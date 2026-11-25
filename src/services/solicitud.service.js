const solicitudRepository = require("../repositories/solicitud.repository");
const { toSolicitudListItem } = require("../dtos/solicitud.dto");
const { ROLES } = require("../utils/constants");

// El administrador ve todas las solicitudes. Cualquier otro rol ve unicamente
// las que tiene asignadas, para que un rol nuevo no herede acceso total por defecto.
async function listSolicitudes(user, page = 1, limit = 10) {
  const filters = user.rol.nombre === ROLES.ADMINISTRADOR
    ? {}
    : { id_asignado: user.id_usuario };

  const { solicitudes, total } = await solicitudRepository.findAll({
    ...filters,
    page,
    limit,
  });

  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    solicitudes: solicitudes.map(toSolicitudListItem),
  };
}

module.exports = { listSolicitudes };
