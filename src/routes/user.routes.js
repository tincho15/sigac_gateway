const express = require("express");
const userController = require("../controllers/user.controller");

const { authenticate } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");

const router = express.Router();

router.post("/", 
    authenticate, //Comentar para permitir crear usuario sin autenticarse
    authorizeRoles("Administrador"), //Comentar esta linea para permitir crear usuario sin ser admin
    //,authorizeRoles("Administrador", "Funcionario") ejemplo para permitir mas de un rol al mismo endpoint
    userController.createUser); 

module.exports = router;
