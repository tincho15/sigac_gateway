const healthRepository = require("../repositories/health.repository");

async function getHealthStatus() {
  return { status: "ok" };
}

module.exports = { getHealthStatus };
