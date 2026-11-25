const express = require("express");
const solicitudController = require("../controllers/solicitud.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const { ROLES } = require("../utils/constants");

const router = express.Router();

//Detalle de una solicitud
//Pueden acceder los dos roles; el service restringe a los no administradores
//a las solicitudes que tienen asignadas
router.get(
    "/:id",
    authenticate,
    authorizeRoles(ROLES.ADMINISTRADOR, ROLES.FUNCIONARIO),
    solicitudController.getSolicitudDetalle
);

module.exports = router;
