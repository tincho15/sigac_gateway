const express = require("express");
const userController = require("../controllers/user.controller");

const router = express.Router();

// TODO: Agregar middleware de auth 
router.get("/", userController.listUsers);
router.post("/", userController.createUser);
router.post("/reset-password", userController.resetPassword);

module.exports = router;
