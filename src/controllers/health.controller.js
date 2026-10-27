const healthService = require("../services/health.service");

async function getHealth(_req, res) {
  try {
    const health = await healthService.getHealthStatus();
    return res.status(200).json(health);
  } catch (error) {
    console.error(
      "Health check failed:",
      error instanceof Error ? error.name : "Unknown error"
    );
    return res
      .status(503)
      .json({ status: "error", database: "disconnected" });
  }
}

module.exports = { getHealth };
