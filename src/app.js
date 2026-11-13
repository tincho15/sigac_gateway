const express = require("express");
const healthRoutes = require("./routes/health.routes");
const userRoutes = require("./routes/user.routes");
const authRoutes = require("./routes/auth.routes");

const app = express();

app.use(express.json());
app.use("/health", healthRoutes);
app.use("/users", userRoutes);
app.use("/auth", authRoutes);

module.exports = app;
