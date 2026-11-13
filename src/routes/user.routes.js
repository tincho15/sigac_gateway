const express = require("express");
const userController = require("../controllers/user.controller");

const router = express.Router();

router.post("/", userController.createUser);
router.post("/reset-password", userController.resetPassword);

module.exports = router;
