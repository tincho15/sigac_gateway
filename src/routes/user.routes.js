const express = require("express");
const userController = require("../controllers/user.controller");

const { authenticate } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const { ROLES } = require("../utils/constants");

const router = express.Router();

//Crear usuario 
router.post("/", 
    authenticate, //Comentar para permitir crear usuario sin autenticarse
    authorizeRoles(ROLES.ADMINISTRADOR), //Comentar esta linea para permitir crear usuario sin ser admin
    //,authorizeRoles(ROLES.ADMINISTRADOR, ROLES.FUNCIONARIO) ejemplo para permitir mas de un rol al mismo endpoint
    userController.createUser); 

//Listar usuarios
router.get(
    "/",
    authenticate,
    authorizeRoles(ROLES.ADMINISTRADOR),
    userController.listUsers
);

module.exports = router;
