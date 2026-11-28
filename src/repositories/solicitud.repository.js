const prisma = require("../config/prisma");
const { ExpedienteInconsistenteError } = require("../errors/solicitud.errors");

// Campos que se exponen en el listado. La asignación vigente es la que no tiene fecha_fin.
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
// tienen una asignación vigente a ese usuario.
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

const UNIQUE_CONSTRAINT_VIOLATION = "P2002";

// Todas las funciones (salvo runInTransaction) reciben el cliente de la
// transacción en curso (tx) para que la solicitud se registre completa o no se registre.

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
    // Otra operación registró el mismo IUE entre la consulta y la inserción.
    if (error.code === UNIQUE_CONSTRAINT_VIOLATION) {
      throw new ExpedienteInconsistenteError(
        `El expediente con IUE ${datos.iue} se registró en simultáneo por otra operación; reintente`
      );
    }
    throw error;
  }
}

// Crea la solicitud junto con su vínculo a cada expediente (solicitud_expediente).
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

// Datos publicos de un usuario: nunca se selecciona password ni campos de 2FA
const USUARIO_RESUMEN = {
  select: { id_usuario: true, nombre: true, email: true },
};

async function findDetalleById(id_solicitud) {
  return prisma.solicitud.findUnique({
    where: { id_solicitud },
    select: {
      id_solicitud: true,
      fecha: true,
      origen: true,
      observaciones: true,
      tipo: { select: { id_tipo: true, nombre: true } },
      estado: { select: { id_estado: true, nombre: true } },
      usuario: USUARIO_RESUMEN,
      email: {
        select: {
          id_email: true,
          remitente: true,
          asunto: true,
          fecha_recepcion: true,
        },
      },
      // Solo la asignacion vigente (sin fecha de fin) define quien puede ver la solicitud
      asignaciones: {
        where: { fecha_fin: null },
        orderBy: { fecha_asignacion: "desc" },
        select: {
          id_asignacion: true,
          fecha_asignacion: true,
          asignado: USUARIO_RESUMEN,
          asignador: USUARIO_RESUMEN,
        },
      },
      solicitudesExpedientes: {
        orderBy: { fecha_inicio: "asc" },
        select: {
          observaciones: true,
          fecha_inicio: true,
          fecha_fin: true,
          estado: { select: { id_estado: true, nombre: true } },
          expediente: {
            select: {
              id_expediente: true,
              iue: true,
              numero: true,
              ficha: true,
              nro_archivo: true,
              juzgado: {
                select: { id_juzgado: true, numero: true, nombre: true },
              },
              ubicacion: {
                select: {
                  id_ubicacion: true,
                  piso: true,
                  nro_estanteria: true,
                  anio: true,
                },
              },
            },
          },
        },
      },
      documentos: {
        orderBy: { fecha_procesamiento: "asc" },
        select: {
          id_documento: true,
          tipo_documento: true,
          datos_extraidos: true,
          confianza_ocr: true,
          fecha_procesamiento: true,
        },
      },
      historiales: {
        orderBy: { fecha: "desc" },
        select: {
          id_historial: true,
          fecha: true,
          accion: true,
          detalle: true,
          usuario: USUARIO_RESUMEN,
        },
      },
    },
  });
}

module.exports = {
  findAll,
  findDetalleById,
  runInTransaction,
  findTipoById,
  findEstadoByNombre,
  findJuzgadoIds,
  findExpedientesByIds,
  findExpedientesByIues,
  createExpediente,
  createSolicitud,
};
