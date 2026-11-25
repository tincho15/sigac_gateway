const solicitudRepository = require("../repositories/solicitud.repository");
const {
  SolicitudNotFoundError,
  SolicitudAccessDeniedError,
} = require("../errors/solicitud.errors");
const { ROLES } = require("../utils/constants");

// Un Administrador ve cualquier solicitud; el resto solo las que tiene asignadas
// actualmente (asignacion sin fecha_fin)
function canViewSolicitud(user, solicitud) {
  if (user.rol.nombre === ROLES.ADMINISTRADOR) {
    return true;
  }
  return solicitud.asignaciones.some(
    (asignacion) => asignacion.asignado.id_usuario === user.id_usuario
  );
}

async function getSolicitudDetalle({ id_solicitud, user }) {
  const solicitud = await solicitudRepository.findDetalleById(id_solicitud);

  if (!solicitud) {
    throw new SolicitudNotFoundError();
  }

  if (!canViewSolicitud(user, solicitud)) {
    throw new SolicitudAccessDeniedError();
  }

  return solicitud;
}

module.exports = { getSolicitudDetalle };
