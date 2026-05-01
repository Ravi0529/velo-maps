import { db } from "../../db";
import { kafkaClient } from "./kafka.client";
import { eq } from "drizzle-orm";
import { users } from "../../db/schema";

export async function startSocketConsumer(io: {
  emit: (arg0: string, arg1: any) => void;
}) {
  const consumer = kafkaClient.consumer({
    groupId: "socket-server",
  });

  await consumer.connect();
  await consumer.subscribe({ topic: "location-updates" });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const data = JSON.parse(message.value!.toString());

      const userId = data.userId;

      const user = await db.query.users.findFirst({
        where: eq(users.id, data.userId),
      });

      if (!user) return;

      io.emit("server:location:update", {
        userId,
        latitude: data.latitude,
        longitude: data.longitude,
        timestamp: data.timestamp,
        name: user.name,
        avatar: user.avatar,
      });
    },
  });
}
