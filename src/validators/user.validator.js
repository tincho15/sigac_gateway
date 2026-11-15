const EMAIL_MAX_LENGTH = 150;
const NOMBRE_MAX_LENGTH = 100;
const INT4_MAX = 2147483647;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UPDATE_FIELDS = new Set(["email", "nombre", "id_rol", "activo"]);

function validateCreateUser(body) {
  const { email, nombre, id_rol } = body ?? {};
  const errors = [];

  // El indice unico distingue mayusculas: se normaliza para no duplicar el mismo email
  const normalizedEmail =
    typeof email === "string" ? email.trim().toLowerCase() : "";
  const normalizedNombre = typeof nombre === "string" ? nombre.trim() : "";

  if (
    !EMAIL_PATTERN.test(normalizedEmail) ||
    normalizedEmail.length > EMAIL_MAX_LENGTH
  ) {
    errors.push(`email debe ser valido y tener hasta ${EMAIL_MAX_LENGTH} caracteres`);
  }

  if (!normalizedNombre || normalizedNombre.length > NOMBRE_MAX_LENGTH) {
    errors.push(`nombre es obligatorio y admite hasta ${NOMBRE_MAX_LENGTH} caracteres`);
  }

  if (!Number.isInteger(id_rol) || id_rol < 1 || id_rol > INT4_MAX) {
    errors.push("id_rol debe ser un entero positivo");
  }

  return {
    errors,
    data: { email: normalizedEmail, nombre: normalizedNombre, id_rol },
  };
}

function validateUpdateUser(id, body) {
  const errors = [];
  const id_usuario = Number(id);

  if (
    !/^[1-9]\d*$/.test(id) ||
    !Number.isSafeInteger(id_usuario) ||
    id_usuario > INT4_MAX
  ) {
    errors.push("id debe ser un entero positivo");
  }

  const isObject =
    body !== null && typeof body === "object" && !Array.isArray(body);
  if (!isObject) {
    errors.push("El cuerpo de la solicitud debe ser un objeto");
    return { errors, data: { id_usuario, updates: {} } };
  }

  const keys = Object.keys(body);
  const unknownFields = keys.filter((key) => !UPDATE_FIELDS.has(key));
  if (unknownFields.length > 0) {
    errors.push(`Campos no permitidos: ${unknownFields.join(", ")}`);
  }
  if (keys.length === 0) {
    errors.push("Debe indicar al menos un campo para actualizar");
  }

  const updates = {};
  if (Object.hasOwn(body, "email")) {
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!EMAIL_PATTERN.test(email) || email.length > EMAIL_MAX_LENGTH) {
      errors.push(
        `email debe ser valido y tener hasta ${EMAIL_MAX_LENGTH} caracteres`
      );
    } else {
      updates.email = email;
    }
  }

  if (Object.hasOwn(body, "nombre")) {
    const nombre = typeof body.nombre === "string" ? body.nombre.trim() : "";
    if (!nombre || nombre.length > NOMBRE_MAX_LENGTH) {
      errors.push(
        `nombre es obligatorio y admite hasta ${NOMBRE_MAX_LENGTH} caracteres`
      );
    } else {
      updates.nombre = nombre;
    }
  }

  if (Object.hasOwn(body, "id_rol")) {
    if (
      !Number.isInteger(body.id_rol) ||
      body.id_rol < 1 ||
      body.id_rol > INT4_MAX
    ) {
      errors.push("id_rol debe ser un entero positivo");
    } else {
      updates.id_rol = body.id_rol;
    }
  }

  if (Object.hasOwn(body, "activo")) {
    if (typeof body.activo !== "boolean") {
      errors.push("activo debe ser un valor booleano");
    } else {
      updates.activo = body.activo;
    }
  }

  return { errors, data: { id_usuario, updates } };
}

module.exports = { validateCreateUser, validateUpdateUser };
