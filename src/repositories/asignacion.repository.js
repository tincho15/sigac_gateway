const prisma = require("../config/prisma");
const { ROLES } = require("../utils/constants");

// Todas las funciones (salvo runInTransaction) reciben el cliente de la
// transaccion en curso (tx): cerrar la asignacion anterior y crear la nueva
// ocurren juntas o no ocurren.

const ASIGNACION_SELECT = {
  id_asignacion: true,
  id_solicitud: true,
  id_asignado: true,
  fecha_asignacion: true,
  asignado: { select: { id_usuario: true, nombre: true } },
};

async function runInTransaction(fn) {
  return prisma.$transaction(fn);
}

// Bloquea la fila de la solicitud hasta el fin de la transaccion: si dos
// administradores asignan la misma solicitud a la vez, el segundo espera al
// primero y no quedan dos asignaciones vigentes. Devuelve false si no existe.
async function lockSolicitud(tx, id_solicitud) {
  const rows = await tx.$queryRaw`
    SELECT id_solicitud FROM solicitud WHERE id_solicitud = ${id_solicitud} FOR UPDATE
  `;

  return rows.length > 0;
}

async function findFuncionarioActivo(tx, id_usuario) {
  return tx.usuario.findFirst({
    where: { id_usuario, activo: true, rol: { nombre: ROLES.FUNCIONARIO } },
    select: { id_usuario: true, nombre: true },
  });
}

// La asignacion vigente es la que no tiene fecha_fin
async function findVigente(tx, id_solicitud) {
  return tx.asignacion.findFirst({
    where: { id_solicitud, fecha_fin: null },
    orderBy: { fecha_asignacion: "desc" },
    select: ASIGNACION_SELECT,
  });
}

async function closeVigentes(tx, id_solicitud, fecha_fin) {
  return tx.asignacion.updateMany({
    where: { id_solicitud, fecha_fin: null },
    data: { fecha_fin },
  });
}

async function createAsignacion(tx, data) {
  return tx.asignacion.create({ data, select: ASIGNACION_SELECT });
}

module.exports = {
  runInTransaction,
  lockSolicitud,
  findFuncionarioActivo,
  findVigente,
  closeVigentes,
  createAsignacion,
};
