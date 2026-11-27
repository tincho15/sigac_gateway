const asignacionService = require("../services/asignacion.service");
const { validateCreateAsignacion } = require("../validators/asignacion.validator");
const { toAsignacionResponse } = require("../dtos/asignacion.dto");
const {
  SolicitudNotFoundError,
  FuncionarioInvalidoError,
} = require("../errors/asignacion.errors");

async function createAsignacion(req, res) {
  const { errors, data } = validateCreateAsignacion(req.params.id, req.body);

  if (errors.length > 0) {
    return res.status(400).json({ status: "error", errors });
  }

  try {
    const { asignacion, created } = await asignacionService.assignSolicitud({
      ...data,
      id_asignador: req.user.id_usuario,
    });

    // 201 si se creo una asignacion nueva; 200 si ya estaba asignada a ese funcionario
    return res.status(created ? 201 : 200).json({
      status: "success",
      asignacion: toAsignacionResponse(asignacion),
    });
  } catch (error) {
    if (error instanceof SolicitudNotFoundError) {
      return res.status(404).json({ status: "error", message: error.message });
    }
    if (error instanceof FuncionarioInvalidoError) {
      return res.status(400).json({ status: "error", message: error.message });
    }

    console.error(
      "Solicitud assignment failed:",
      error instanceof Error ? error.name : "Unknown error"
    );
    return res
      .status(500)
      .json({ status: "error", message: "No se pudo guardar la asignación" });
  }
}

module.exports = { createAsignacion };
