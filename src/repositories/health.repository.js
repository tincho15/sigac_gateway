const prisma = require("../config/prisma");

async function checkDatabaseConnection() {
  await prisma.$queryRaw`SELECT 1`;
}

module.exports = { checkDatabaseConnection };
