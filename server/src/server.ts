import "dotenv/config";
import { createServer } from "node:http";
import { createApplication } from "./app/app";
import { Server } from "socket.io";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";

import { db } from "./db";
import { env } from "./env";
import { verifyUserToken } from "./app/utils/token";
import { kafkaClient } from "./app/kafka/kafka.client";
import { startSocketConsumer } from "./app/kafka/kafka.socket-consumer";
import { startDBConsumer } from "./app/kafka/kafka.db-consumer";
import {
  addActiveUser,
  canSendLocation,
  getActiveUsers,
  lastHeartbeat,
  removeActiveUser,
  shouldProcessLocation,
  updateHeartbeat,
} from "./app/presence/presence.service";

async function main() {
  try {
    const server = createServer(createApplication());

    const io = new Server();
    io.attach(server);

    const PORT: number = env.PORT ? +env.PORT : 8000;

    const producer = kafkaClient.producer();
    await producer.connect();

    io.use((socket, next) => {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Unauthorized"));

      const user = verifyUserToken(token);

      if (!user) return next(new Error("Invalid token"));

      socket.data.user = user;
      next();
    });

    io.on("connection", (socket) => {
      const userId = socket.data.user.id;
      console.log(`User Connected: [UserId => ${userId}]`);
      addActiveUser(userId, socket.id);

      socket.on("client:location:update", async (data) => {
        const userId = socket.data.user.id;

        if (!shouldProcessLocation(userId, data.latitude, data.longitude)) {
          return;
        }
        if (!canSendLocation(userId)) return;
        updateHeartbeat(userId);

        await producer.send({
          topic: "location-updates",
          messages: [
            {
              key: userId,
              value: JSON.stringify({
                userId,
                latitude: data.latitude,
                longitude: data.longitude,
                timestamp: Date.now(),
              }),
            },
          ],
        });
      });

      socket.on("disconnect", async () => {
        console.log(`User Disconnected: [UserId => ${userId}]`);

        removeActiveUser(userId);
        io.emit("server:users:active", getActiveUsers());

        await db
          .update(users)
          .set({ lastSeen: new Date() })
          .where(eq(users.id, userId));
      });
    });

    await startSocketConsumer(io);
    await startDBConsumer();

    setInterval(() => {
      const now = Date.now();

      for (const [userId, last] of lastHeartbeat.entries()) {
        if (now - last > 30000) {
          removeActiveUser(userId);
          lastHeartbeat.delete(userId);

          console.log(`Cleaned stale user: ${userId}`);

          io.emit("server:users:active", getActiveUsers());
        }
      }
    }, 3000);

    server.listen(PORT, () => {
      console.log(`The server is running on PORT: ${PORT}`);
    });
  } catch (error) {
    console.error(`Error starting http server: ${error}`);
    throw error;
  }
}

main();
