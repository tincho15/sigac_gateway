const solicitudRepository = require("../repositories/solicitud.repository");
const { toSolicitudListItem } = require("../dtos/solicitud.dto");
const { ROLES } = require("../utils/constants");

// El administrador ve todas las solicitudes. Cualquier otro rol ve unicamente
// las que tiene asignadas, para que un rol nuevo no herede acceso total por defecto.
async function listSolicitudes(user) {
  const filters =
    user.rol.nombre === ROLES.ADMINISTRADOR
      ? {}
      : { id_asignado: user.id_usuario };

  const solicitudes = await solicitudRepository.findAll(filters);

  return solicitudes.map(toSolicitudListItem);
}

module.exports = { listSolicitudes };
