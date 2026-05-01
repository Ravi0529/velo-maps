import { kafkaClient } from "./kafka.client";

async function run() {
  const admin = kafkaClient.admin();
  await admin.connect();

  await admin.createTopics({
    topics: [
      {
        topic: "location-updates",
        numPartitions: 2,
      },
    ],
  });

  console.log("Topic created");
  await admin.disconnect();
}

run();
