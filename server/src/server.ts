import "dotenv/config";
import { createServer } from "node:http";
import { createApplication } from "./app/app";
import { Server } from "socket.io";

import { env } from "./env";
import { verifyUserToken } from "./app/utils/token";
import { kafkaClient } from "./app/kafka/kafka.client";
import { startSocketConsumer } from "./app/kafka/kafka.socket-consumer";

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
      console.log("User connected: ", socket.data.user.id);

      socket.on("client:location:update", async (data) => {
        const userId = socket.data.user.id;

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

      socket.on("disconnect", () => {
        console.log("User disconnected: ", socket.data.user.id);
      });
    });

    await startSocketConsumer(io);

    server.listen(PORT, () => {
      console.log(`The server is running on PORT: ${PORT}`);
    });
  } catch (error) {
    console.error(`Error starting http server: ${error}`);
    throw error;
  }
}

main();
