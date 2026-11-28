const solicitudService = require("../services/solicitud.service");
const {
  validateSolicitud,
  validateSolicitudId,
} = require("../validators/solicitud.validator");
const {
  toSolicitudResponse,
  toSolicitudDetalleResponse,
} = require("../dtos/solicitud.dto");
const {
  TipoSolicitudNotFoundError,
  JuzgadoNotFoundError,
  ExpedienteNotFoundError,
  ExpedienteInconsistenteError,
  SolicitudNotFoundError,
  SolicitudAccessDeniedError,
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

async function listSolicitudes(req, res) {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);

    if (
      !Number.isInteger(page) ||
      !Number.isInteger(limit) ||
      page < 1 ||
      limit < 1 ||
      limit > 100
    ) {
      return res.status(400).json({
        status: "error",
        message: "Los parámetros page y limit deben ser enteros positivos. El límite máximo es 100.",
      });
    }

    const resultado = await solicitudService.listSolicitudes(
      req.user,
      page,
      limit
    );

    return res.status(200).set("Cache-Control", "no-store").json({
      status: "success",
      ...resultado,
    });
  } catch (error) {
    console.error(
      "Solicitud listing failed:",
      error instanceof Error ? error.name : "Unknown error"
    );

    return res.status(500).json({
      status: "error",
      message: "No se pudieron obtener las solicitudes",
    });
  }
}

async function getSolicitudDetalle(req, res) {
  const { errors, data } = validateSolicitudId(req.params.id);

  if (errors.length > 0) {
    return res.status(400).json({ status: "error", errors });
  }

  try {
    const solicitud = await solicitudService.getSolicitudDetalle({
      id_solicitud: data.id_solicitud,
      user: req.user,
    });
    return res.status(200).json(toSolicitudDetalleResponse(solicitud));
  } catch (error) {
    if (error instanceof SolicitudNotFoundError) {
      return res.status(404).json({ status: "error", message: error.message });
    }
    if (error instanceof SolicitudAccessDeniedError) {
      return res.status(403).json({ status: "error", message: error.message });
    }

    console.error(
      "Solicitud detail failed:",
      error instanceof Error ? error.name : "Unknown error"
    );
    return res
      .status(500)
      .json({ status: "error", message: "No se pudo obtener la solicitud" });
  }
}

module.exports = { createSolicitud, listSolicitudes, getSolicitudDetalle };
