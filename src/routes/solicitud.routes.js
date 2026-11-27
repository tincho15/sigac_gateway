const express = require("express");
const solicitudController = require("../controllers/solicitud.controller");
const asignacionController = require("../controllers/asignacion.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const { ROLES } = require("../utils/constants");

const router = express.Router();

// Listar solicitudes: el administrador ve todas, el funcionario solo las asignadas
router.get(
  "/",
  authenticate,
  authorizeRoles(ROLES.ADMINISTRADOR, ROLES.FUNCIONARIO),
  solicitudController.listSolicitudes
);

// Registrar una solicitud con sus expedientes (formulario)
router.post(
  "/",
  authenticate,
  authorizeRoles(ROLES.ADMINISTRADOR),
  solicitudController.createSolicitud
);

// Asignar o reasignar una solicitud a un funcionario
router.post(
    "/:id/asignaciones",
    authenticate,
    authorizeRoles(ROLES.ADMINISTRADOR),
    asignacionController.createAsignacion
);

module.exports = router;
