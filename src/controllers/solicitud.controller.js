const solicitudService = require("../services/solicitud.service");
const { validateSolicitud } = require("../validators/solicitud.validator");
const { toSolicitudResponse } = require("../dtos/solicitud.dto");
const {
  TipoSolicitudNotFoundError,
  JuzgadoNotFoundError,
  ExpedienteNotFoundError,
  ExpedienteInconsistenteError,
} = require("../errors/solicitud.errors");

// Alta desde el formulario: la registra el usuario autenticado
async function createSolicitud(req, res) {
  const { errors, data } = validateSolicitud(req.body);

  if (errors.length > 0) {
    return res.status(400).json({ status: "error", errors });
  }

  try {
    const solicitud = await solicitudService.createSolicitud(
      data,
      req.user.id_usuario
    );
    return res.status(201).json(toSolicitudResponse(solicitud));
  } catch (error) {
    if (
      error instanceof TipoSolicitudNotFoundError ||
      error instanceof JuzgadoNotFoundError ||
      error instanceof ExpedienteNotFoundError
    ) {
      return res.status(400).json({ status: "error", message: error.message });
    }
    if (error instanceof ExpedienteInconsistenteError) {
      return res.status(409).json({ status: "error", message: error.message });
    }

    console.error(
      "Solicitud creation failed:",
      error instanceof Error ? error.name : "Unknown error"
    );
    return res
      .status(500)
      .json({ status: "error", message: "No se pudo registrar la solicitud" });
  }
}

module.exports = { createSolicitud };
