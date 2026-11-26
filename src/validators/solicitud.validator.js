// Validacion de formato de los datos de una solicitud. No accede a la base:
// la existencia de tipos, juzgados y expedientes la verifica solicitud.service.

const INT4_MAX = 2147483647;
const OBSERVACIONES_MAX_LENGTH = 2000;
const ORIGEN_MAX_LENGTH = 50;
const EXPEDIENTE_CAMPO_MAX_LENGTH = 50;
const MAX_EXPEDIENTES = 100;
const IUE_ANIO_MINIMO = 1900;

// IUE (Identificador Unico de Expediente): sede-numero/anio, p. ej. 2-12345/2024
const IUE_PATTERN = /^(\d{1,4})-(\d{1,8})\/(\d{4})$/;

const SOLICITUD_FIELDS = new Set([
  "id_tipo",
  "origen",
  "observaciones",
  "expedientes",
]);
// Un expediente se indica por id (ya registrado) o por sus datos
const EXPEDIENTE_REFERENCIA_FIELDS = new Set(["id_expediente", "observaciones"]);
const EXPEDIENTE_DATOS_FIELDS = new Set([
  "iue",
  "numero",
  "ficha",
  "nro_archivo",
  "id_juzgado",
  "observaciones",
]);
const EXPEDIENTE_IDENTIFICADORES = ["iue", "numero", "ficha", "nro_archivo"];

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isPositiveInt(value) {
  return Number.isInteger(value) && value >= 1 && value <= INT4_MAX;
}

function checkUnknownFields(object, allowed, prefix, errors) {
  const unknownFields = Object.keys(object).filter((key) => !allowed.has(key));
  if (unknownFields.length > 0) {
    errors.push(`${prefix}Campos no permitidos: ${unknownFields.join(", ")}`);
  }
}

// Devuelve el texto sin espacios en los extremos, o null si no se envio o queda vacio
function readOptionalString(value, field, maxLength, errors) {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== "string") {
    errors.push(`${field} debe ser una cadena de texto`);
    return null;
  }

  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    errors.push(`${field} admite hasta ${maxLength} caracteres`);
    return null;
  }

  return trimmed || null;
}

// Forma canonica del IUE: sin espacios ni ceros a la izquierda, para que
// "0002-012345/2024" y "2-12345/2024" no se registren como expedientes distintos
function normalizeIue(value, field, errors) {
  const raw = readOptionalString(value, field, EXPEDIENTE_CAMPO_MAX_LENGTH, errors);
  if (raw === null) {
    return null;
  }

  const match = IUE_PATTERN.exec(raw.replace(/\s+/g, ""));
  const anio = match ? Number(match[3]) : NaN;
  if (
    !match ||
    anio < IUE_ANIO_MINIMO ||
    anio > new Date().getFullYear()
  ) {
    errors.push(
      `${field} debe tener el formato sede-numero/anio (p. ej. 2-12345/2024)`
    );
    return null;
  }

  return `${Number(match[1])}-${Number(match[2])}/${match[3]}`;
}

function validateExpedienteReferencia(item, prefix, errors) {
  checkUnknownFields(item, EXPEDIENTE_REFERENCIA_FIELDS, `${prefix}: `, errors);

  if (!isPositiveInt(item.id_expediente)) {
    errors.push(`${prefix}.id_expediente debe ser un entero positivo`);
  }

  return {
    id_expediente: item.id_expediente,
    observaciones: readOptionalString(
      item.observaciones,
      `${prefix}.observaciones`,
      OBSERVACIONES_MAX_LENGTH,
      errors
    ),
  };
}

function validateExpedienteDatos(item, prefix, errors) {
  checkUnknownFields(item, EXPEDIENTE_DATOS_FIELDS, `${prefix}: `, errors);

  const errorCount = errors.length;
  const datos = {
    iue: normalizeIue(item.iue, `${prefix}.iue`, errors),
    numero: readOptionalString(
      item.numero,
      `${prefix}.numero`,
      EXPEDIENTE_CAMPO_MAX_LENGTH,
      errors
    ),
    ficha: readOptionalString(
      item.ficha,
      `${prefix}.ficha`,
      EXPEDIENTE_CAMPO_MAX_LENGTH,
      errors
    ),
    nro_archivo: readOptionalString(
      item.nro_archivo,
      `${prefix}.nro_archivo`,
      EXPEDIENTE_CAMPO_MAX_LENGTH,
      errors
    ),
    id_juzgado: item.id_juzgado,
  };

  // Si algun identificador era invalido ya hay un error mas preciso
  if (
    errors.length === errorCount &&
    EXPEDIENTE_IDENTIFICADORES.every((field) => datos[field] === null)
  ) {
    errors.push(
      `${prefix} debe indicar al menos uno de: ${EXPEDIENTE_IDENTIFICADORES.join(", ")}`
    );
  }

  if (!isPositiveInt(item.id_juzgado)) {
    errors.push(`${prefix}.id_juzgado es obligatorio y debe ser un entero positivo`);
  }

  const observaciones = readOptionalString(
    item.observaciones,
    `${prefix}.observaciones`,
    OBSERVACIONES_MAX_LENGTH,
    errors
  );

  return { datos, observaciones };
}

// Clave para detectar el mismo expediente repetido dentro de la solicitud
function expedienteKey(expediente) {
  if (expediente.id_expediente !== undefined) {
    return `id:${expediente.id_expediente}`;
  }

  const { iue, numero, ficha, nro_archivo, id_juzgado } = expediente.datos;
  if (iue) {
    return `iue:${iue}`;
  }
  return `datos:${JSON.stringify([id_juzgado, numero, ficha, nro_archivo])}`;
}

function validateExpedientes(expedientes, errors) {
  if (!Array.isArray(expedientes) || expedientes.length === 0) {
    errors.push("expedientes es obligatorio y debe tener al menos un expediente");
    return [];
  }
  if (expedientes.length > MAX_EXPEDIENTES) {
    errors.push(`Una solicitud admite hasta ${MAX_EXPEDIENTES} expedientes`);
    return [];
  }

  const result = [];
  const seen = new Map();

  expedientes.forEach((item, index) => {
    const prefix = `expedientes[${index}]`;

    if (!isPlainObject(item)) {
      errors.push(`${prefix} debe ser un objeto`);
      return;
    }

    const errorCount = errors.length;
    const expediente = Object.hasOwn(item, "id_expediente")
      ? validateExpedienteReferencia(item, prefix, errors)
      : validateExpedienteDatos(item, prefix, errors);

    if (errors.length > errorCount) {
      return;
    }

    const key = expedienteKey(expediente);
    if (seen.has(key)) {
      errors.push(
        `${prefix} repite el expediente indicado en expedientes[${seen.get(key)}]`
      );
      return;
    }

    seen.set(key, index);
    result.push(expediente);
  });

  return result;
}

/**
 * Valida y normaliza los datos de negocio de una solicitud.
 *
 * Cada expediente es { id_expediente, observaciones? } para uno ya registrado, o
 * { iue?, numero?, ficha?, nro_archivo?, id_juzgado, observaciones? } con sus datos.
 *
 * @returns {{ errors: string[], data: {
 *   id_tipo: number, origen: string, observaciones: string|null,
 *   expedientes: Array<{ id_expediente: number, observaciones: string|null }
 *     | { datos: object, observaciones: string|null }>
 * } }}
 */
function validateSolicitud(body) {
  const errors = [];

  if (!isPlainObject(body)) {
    errors.push("El cuerpo de la solicitud debe ser un objeto");
    return { errors, data: null };
  }

  checkUnknownFields(body, SOLICITUD_FIELDS, "", errors);

  if (!isPositiveInt(body.id_tipo)) {
    errors.push("id_tipo es obligatorio y debe ser un entero positivo");
  }

  // Quien pide la solicitud (p. ej. "Juzgado 3")
  const origen = typeof body.origen === "string" ? body.origen.trim() : "";
  if (!origen || origen.length > ORIGEN_MAX_LENGTH) {
    errors.push(`origen es obligatorio y admite hasta ${ORIGEN_MAX_LENGTH} caracteres`);
  }

  const data = {
    id_tipo: body.id_tipo,
    origen,
    observaciones: readOptionalString(
      body.observaciones,
      "observaciones",
      OBSERVACIONES_MAX_LENGTH,
      errors
    ),
    expedientes: validateExpedientes(body.expedientes, errors),
  };

  return { errors, data };
}

module.exports = { validateSolicitud };
