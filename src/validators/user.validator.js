const EMAIL_MAX_LENGTH = 150;
const NOMBRE_MAX_LENGTH = 100;
const INT4_MAX = 2147483647;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function validateResetPassword(body) {
  const { email } = body ?? {};
  const errors = [];

  const normalizedEmail = normalizeEmail(email);
  validateEmail(normalizedEmail, errors);

  return { errors, data: { email: normalizedEmail } };
}

module.exports = { validateCreateUser, validateResetPassword };
