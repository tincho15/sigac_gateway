const prisma = require("../config/prisma");
const { ExpedienteInconsistenteError } = require("../errors/solicitud.errors");

const UNIQUE_CONSTRAINT_VIOLATION = "P2002";

// Todas las funciones (salvo runInTransaction) reciben el cliente de la
// transaccion en curso (tx) para que la solicitud se registre completa o no se registre

const solicitudInclude = {
  tipo: { select: { id_tipo: true, nombre: true } },
  estado: { select: { id_estado: true, nombre: true } },
  solicitudesExpedientes: {
    orderBy: { id_expediente: "asc" },
    include: {
      expediente: true,
      estado: { select: { id_estado: true, nombre: true } },
    },
  },
  _count: { select: { asignaciones: true } },
};

async function runInTransaction(fn) {
  return prisma.$transaction(fn);
}

async function findTipoById(tx, id_tipo) {
  return tx.tipoSolicitud.findUnique({ where: { id_tipo } });
}

async function findEstadoByNombre(tx, nombre) {
  return tx.estado.findUnique({ where: { nombre } });
}

async function findJuzgadoIds(tx, ids) {
  const juzgados = await tx.juzgado.findMany({
    where: { id_juzgado: { in: ids } },
    select: { id_juzgado: true },
  });
  return juzgados.map((juzgado) => juzgado.id_juzgado);
}

async function findExpedientesByIds(tx, ids) {
  return tx.expediente.findMany({ where: { id_expediente: { in: ids } } });
}

async function findExpedientesByIues(tx, iues) {
  return tx.expediente.findMany({ where: { iue: { in: iues } } });
}

async function createExpediente(tx, datos) {
  try {
    return await tx.expediente.create({ data: datos });
  } catch (error) {
    // Otra operacion registro el mismo IUE entre la consulta y la insercion
    if (error.code === UNIQUE_CONSTRAINT_VIOLATION) {
      throw new ExpedienteInconsistenteError(
        `El expediente con IUE ${datos.iue} se registro en simultaneo por otra operacion; reintente`
      );
    }
    throw error;
  }
}

// Crea la solicitud junto con su vinculo a cada expediente (solicitud_expediente)
async function createSolicitud(tx, { expedientes, id_estado, ...solicitud }) {
  return tx.solicitud.create({
    data: {
      ...solicitud,
      id_estado,
      solicitudesExpedientes: {
        create: expedientes.map(({ id_expediente, observaciones }) => ({
          id_expediente,
          observaciones,
          id_estado,
        })),
      },
    },
    include: solicitudInclude,
  });
}

module.exports = {
  runInTransaction,
  findTipoById,
  findEstadoByNombre,
  findJuzgadoIds,
  findExpedientesByIds,
  findExpedientesByIues,
  createExpediente,
  createSolicitud,
};
