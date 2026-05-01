import { kafkaClient } from "./kafka.client";
import { db } from "../../db";
import { locationLogs, currentLocations } from "../../db/schema";

export async function startDBConsumer() {
  const consumer = kafkaClient.consumer({
    groupId: "db-processor",
  });

  await consumer.connect();
  await consumer.subscribe({ topic: "location-updates" });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const data = JSON.parse(message.value!.toString());

      const { userId, latitude, longitude, timestamp } = data;

      await db.insert(locationLogs).values({
        userId,
        latitude,
        longitude,
        timestamp: new Date(timestamp),
      });

      await db
        .insert(currentLocations)
        .values({
          userId,
          latitude,
          longitude,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: currentLocations.userId,
          set: {
            latitude,
            longitude,
            updatedAt: new Date(),
          },
        });
    },
  });
}
