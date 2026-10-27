const healthRepository = require("../repositories/health.repository");

async function getHealthStatus() {
  await healthRepository.checkDatabaseConnection();
  return { status: "ok", database: "connected" };
}

module.exports = { getHealthStatus };
