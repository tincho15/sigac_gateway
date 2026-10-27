require("dotenv").config();

const app = require("./app");
const prisma = require("./config/prisma");

const port = Number(process.env.PORT) || 3000;
const server = app.listen(port, () => {
  console.log(`SIGAC Gateway listening on port ${port}`);
});

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down...`);

  server.close(async (error) => {
    if (error) {
      console.error("Failed to close HTTP server:", error);
      process.exitCode = 1;
    }

    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error("Failed to disconnect Prisma:", disconnectError);
      process.exitCode = 1;
    } finally {
      process.exit();
    }
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
