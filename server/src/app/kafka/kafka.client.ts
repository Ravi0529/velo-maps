import { Kafka } from "kafkajs";

export const kafkaClient = new Kafka({
  clientId: "velo-app",
  brokers: ["localhost:9092"],
});
