const EMAIL_MAX_LENGTH = 150;
const NOMBRE_MAX_LENGTH = 100;
const INT4_MAX = 2147483647;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_BYTES = 72;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
const UPDATE_FIELDS = new Set(["email", "nombre", "id_rol", "activo"]);

// El indice unico distingue mayusculas: se normaliza para no duplicar el mismo email
function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function validateEmail(normalizedEmail, errors) {
  if (
    !EMAIL_PATTERN.test(normalizedEmail) ||
    normalizedEmail.length > EMAIL_MAX_LENGTH
  ) {
    errors.push(`email debe ser valido y tener hasta ${EMAIL_MAX_LENGTH} caracteres`);
  }
}

function validatePassword(password, errors) {
  if (typeof password !== "string" || !password.trim()) {
    errors.push("La contraseña es obligatoria");
    return;
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`);
  }

  if (Buffer.byteLength(password, "utf8") > PASSWORD_MAX_BYTES) {
    errors.push(`La contraseña no puede superar los ${PASSWORD_MAX_BYTES} bytes`);
  }

  if (!PASSWORD_PATTERN.test(password)) {
    errors.push("La contraseña debe contener al menos una mayúscula, una minúscula y un número");
  }
}

function validateChangePassword(body) {
  const { currentPassword, newPassword } = body ?? {};
  const errors = [];

  validatePassword(newPassword, errors);

  if (
    currentPassword !== undefined &&
    typeof currentPassword !== "string"
  ) {
    errors.push("currentPassword debe ser una cadena de texto");
  }

  return {
    errors,
    data: { currentPassword, newPassword },
  };
}

function validateCreateUser(body) {
  const { email, nombre, id_rol } = body ?? {};
  const errors = [];

  const normalizedEmail = normalizeEmail(email);
  const normalizedNombre = typeof nombre === "string" ? nombre.trim() : "";

  validateEmail(normalizedEmail, errors);

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


function validateResetPassword(body) {
  const { email } = body ?? {};
  const errors = [];

  const normalizedEmail = normalizeEmail(email);
  validateEmail(normalizedEmail, errors);

  return { errors, data: { email: normalizedEmail } };
}

module.exports = { validateCreateUser, validateResetPassword, validateChangePassword, validateUpdateUser };