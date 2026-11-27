
const solicitudRepository = require("../repositories/solicitud.repository");
const { toSolicitudListItem } = require("../dtos/solicitud.dto");
const { ROLES, ESTADOS } = require("../utils/constants");
const {
  TipoSolicitudNotFoundError,
  JuzgadoNotFoundError,
  ExpedienteNotFoundError,
  ExpedienteInconsistenteError,
  EstadoNotFoundError,
} = require("../errors/solicitud.errors");

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

// Campos que, si ambos lados tienen valor, deben coincidir con el expediente registrado
const CAMPOS_COMPARABLES = ["numero", "ficha", "nro_archivo"];

function findMissing(requested, found) {
  const foundSet = new Set(found);
  return [...new Set(requested)].filter((id) => !foundSet.has(id));
}

function camposInconsistentes(existente, datos) {
  const campos = [];

  if (existente.id_juzgado !== datos.id_juzgado) {
    campos.push("id_juzgado");
  }
  for (const campo of CAMPOS_COMPARABLES) {
    if (
      existente[campo] != null &&
      datos[campo] != null &&
      existente[campo] !== datos[campo]
    ) {
      campos.push(campo);
    }
  }

  return campos;
}

// Traduce cada expediente de la solicitud a un id_expediente: verifica los
// referenciados por id, reutiliza los que ya existen por IUE (si sus datos
// coinciden) y registra los nuevos
async function resolveExpedientes(tx, expedientes) {
  const referencias = expedientes.filter((item) => item.datos === undefined);
  const conDatos = expedientes.filter((item) => item.datos !== undefined);

  const idsReferenciados = referencias.map((item) => item.id_expediente);
  if (idsReferenciados.length > 0) {
    const encontrados = await solicitudRepository.findExpedientesByIds(tx, idsReferenciados);
    const faltantes = findMissing(
      idsReferenciados,
      encontrados.map((expediente) => expediente.id_expediente)
    );
    if (faltantes.length > 0) {
      throw new ExpedienteNotFoundError(faltantes);
    }
  }

  const idsJuzgado = conDatos.map((item) => item.datos.id_juzgado);
  if (idsJuzgado.length > 0) {
    const encontrados = await solicitudRepository.findJuzgadoIds(tx, [...new Set(idsJuzgado)]);
    const faltantes = findMissing(idsJuzgado, encontrados);
    if (faltantes.length > 0) {
      throw new JuzgadoNotFoundError(faltantes);
    }
  }

  const iues = conDatos.map((item) => item.datos.iue).filter(Boolean);
  const existentesPorIue = new Map();
  if (iues.length > 0) {
    const existentes = await solicitudRepository.findExpedientesByIues(tx, iues);
    for (const expediente of existentes) {
      existentesPorIue.set(expediente.iue, expediente);
    }
  }

  const resueltos = [];
  // Mismo expediente indicado de dos formas (por id y por IUE): indice de la primera
  const indicePorId = new Map();

  for (const [index, item] of expedientes.entries()) {
    let id_expediente = item.id_expediente;

    if (item.datos !== undefined) {
      const existente = item.datos.iue && existentesPorIue.get(item.datos.iue);

      if (existente) {
        const campos = camposInconsistentes(existente, item.datos);
        if (campos.length > 0) {
          throw new ExpedienteInconsistenteError(
            `expedientes[${index}]: el expediente con IUE ${existente.iue} ya esta registrado con otro valor en: ${campos.join(", ")}`
          );
        }
        id_expediente = existente.id_expediente;
      } else {
        const creado = await solicitudRepository.createExpediente(tx, item.datos);
        id_expediente = creado.id_expediente;
      }
    }

    if (indicePorId.has(id_expediente)) {
      throw new ExpedienteInconsistenteError(
        `expedientes[${index}] y expedientes[${indicePorId.get(id_expediente)}] corresponden al mismo expediente`
      );
    }
    indicePorId.set(id_expediente, index);
    resueltos.push({ id_expediente, observaciones: item.observaciones });
  }

  return resueltos;
}

// Registra una solicitud cargada por formulario, con sus expedientes, en una
// unica transaccion. Recibe los datos ya validados por validateSolicitud.
// Queda en estado Pendiente y sin asignaciones (pendiente de asignacion).
async function createSolicitud(data, id_usuario) {
  return solicitudRepository.runInTransaction(async (tx) => {
    const tipo = await solicitudRepository.findTipoById(tx, data.id_tipo);
    if (!tipo) {
      throw new TipoSolicitudNotFoundError();
    }

    const pendiente = await solicitudRepository.findEstadoByNombre(tx, ESTADOS.PENDIENTE);
    if (!pendiente) {
      throw new EstadoNotFoundError(ESTADOS.PENDIENTE);
    }

    const expedientes = await resolveExpedientes(tx, data.expedientes);

    return solicitudRepository.createSolicitud(tx, {
      origen: data.origen,
      observaciones: data.observaciones,
      id_usuario,
      id_tipo: data.id_tipo,
      id_estado: pendiente.id_estado,
      expedientes,
    });
  });
}

module.exports = { listSolicitudes, createSolicitud };
