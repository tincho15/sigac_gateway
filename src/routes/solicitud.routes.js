const express = require("express");
const solicitudController = require("../controllers/solicitud.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const { ROLES } = require("../utils/constants");

const router = express.Router();

//Registrar una solicitud con sus expedientes (formulario)
router.post(
    "/",
    authenticate,
    authorizeRoles(ROLES.ADMINISTRADOR, ROLES.FUNCIONARIO),
    solicitudController.createSolicitud
);

module.exports = router;
