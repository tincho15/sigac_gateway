const solicitudService = require("../services/solicitud.service");
const { validateSolicitudId } = require("../validators/solicitud.validator");
const {
  SolicitudNotFoundError,
  SolicitudAccessDeniedError,
} = require("../errors/solicitud.errors");
const { toSolicitudDetalleResponse } = require("../dtos/solicitud.dto");

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

module.exports = { getSolicitudDetalle };
