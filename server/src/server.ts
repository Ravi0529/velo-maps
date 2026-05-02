import "dotenv/config";
import { createServer } from "node:http";
import { createApplication } from "./app/app";
import { Server } from "socket.io";
import { users, currentLocations } from "./db/schema";
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
  shouldProcessLocation,
  updateHeartbeat,
} from "./app/presence/presence.service";

async function main() {
  try {
    const server = createServer(createApplication());

    const io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

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

    io.on("connection", async (socket) => {
      const userId = socket.data.user.id;
      console.log(`User Connected: [UserId => ${userId}]`);
      addActiveUser(userId, socket.id);

      const allUsersWithLocation = await db
        .select({
          id: users.id,
          name: users.name,
          avatar: users.avatar,
          latitude: currentLocations.latitude,
          longitude: currentLocations.longitude,
          updatedAt: currentLocations.updatedAt,
        })
        .from(users)
        .leftJoin(currentLocations, eq(users.id, currentLocations.userId));

      socket.emit("server:users:init", allUsersWithLocation);

      socket.on("client:location:update", async (data) => {
        const userId = socket.data.user.id;

        updateHeartbeat(userId);

        if (
          !shouldProcessLocation(userId, data.latitude, data.longitude) &&
          !canSendLocation(userId)
        ) {
          return;
        }

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

        // removeActiveUser(userId);
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
        if (now - last > 120000) {
          lastHeartbeat.delete(userId);

          console.log(`Marked inactive user: ${userId}`);

          io.emit("server:user:inactive", { userId });
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
