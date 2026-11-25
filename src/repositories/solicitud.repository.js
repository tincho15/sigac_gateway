const prisma = require("../config/prisma");

// Campos que se exponen en el listado. La asignacion vigente es la que no tiene fecha_fin.
const LIST_SELECT = {
  id_solicitud: true,
  fecha: true,
  origen: true,
  tipo: { select: { id_tipo: true, nombre: true } },
  estado: { select: { id_estado: true, nombre: true } },
  asignaciones: {
    where: { fecha_fin: null },
    orderBy: { fecha_asignacion: "desc" },
    take: 1,
    select: {
      asignado: { select: { id_usuario: true, nombre: true } },
    },
  },
  _count: { select: { solicitudesExpedientes: true } },
};

// Sin id_asignado devuelve todas las solicitudes. Con id_asignado, solo las que
// tienen una asignacion vigente a ese usuario.
async function findAll({ id_asignado, page, limit } = {}) {
  const where = id_asignado === undefined
    ? {}
    : { asignaciones: { some: { id_asignado, fecha_fin: null } } };

  const skip = (page - 1) * limit;

  const [solicitudes, total] = await Promise.all([
    prisma.solicitud.findMany({
      where,
      select: LIST_SELECT,
      orderBy: [{ fecha: "desc" }, { id_solicitud: "desc" }],
      skip,
      take: limit,
    }),
    prisma.solicitud.count({ where }),
  ]);

  return { solicitudes, total };
}

module.exports = { findAll };
