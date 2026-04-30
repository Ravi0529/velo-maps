import "dotenv/config";
import { createServer } from "node:http";
import { createApplication } from "./app/app";
import { env } from "./env";

async function main() {
  try {
    const server = createServer(createApplication());
    const PORT: number = env.PORT ? +env.PORT : 5000;

    server.listen(PORT, () => {
      console.log(`The server is running on PORT: ${PORT}`);
    });
  } catch (error) {
    console.error(`Error starting http server: ${error}`);
    throw error;
  }
}

main();
