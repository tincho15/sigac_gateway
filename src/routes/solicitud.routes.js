const express = require("express");
const solicitudController = require("../controllers/solicitud.controller");

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

module.exports = router;
