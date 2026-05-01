import { kafkaClient } from "./kafka.client";

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

      io.emit("server:location:update", data);
    },
  });
}
