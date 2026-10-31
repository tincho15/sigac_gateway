const EMAIL_MAX_LENGTH = 150;
const NOMBRE_MAX_LENGTH = 100;
const INT4_MAX = 2147483647;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

module.exports = { validateCreateUser };
