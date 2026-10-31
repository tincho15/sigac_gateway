const express = require("express");
const healthRoutes = require("./routes/health.routes");
const userRoutes = require("./routes/user.routes");

const app = express();

app.use(express.json());
app.use("/health", healthRoutes);
app.use("/users", userRoutes);

module.exports = app;
