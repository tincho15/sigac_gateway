const express = require("express");
const userController = require("../controllers/user.controller");

const {
    authenticate,
    authenticateAllowingTwoFactorSetup,
} = require("../middlewares/auth.middleware");
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

//Update de usuario
router.patch(
    "/:id",
    authenticate,
    authorizeRoles(ROLES.ADMINISTRADOR),
    userController.updateUser
);

//Resetear contraseña
router.post(
    "/reset-password",
    authenticate,
    authorizeRoles(ROLES.ADMINISTRADOR),
    userController.resetPassword
);

//Cambiar contraseña (permitido antes de activar el 2FA: el primer login exige ambas cosas)
router.post(
    "/change-password",
    authenticateAllowingTwoFactorSetup,
    userController.changePassword
);

//Resetear 2FA (el usuario perdio el celular o la app autenticadora)
router.post(
    "/reset-2fa",
    authenticate,
    authorizeRoles(ROLES.ADMINISTRADOR),
    userController.resetTwoFactor
);

module.exports = router;
