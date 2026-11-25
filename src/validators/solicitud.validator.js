const INT4_MAX = 2147483647;

function validateSolicitudId(id) {
  const errors = [];
  const id_solicitud = Number(id);

  if (
    typeof id !== "string" ||
    !/^[1-9]\d*$/.test(id) ||
    !Number.isSafeInteger(id_solicitud) ||
    id_solicitud > INT4_MAX
  ) {
    errors.push("id debe ser un entero positivo");
  }

  return { errors, data: { id_solicitud } };
}

module.exports = { validateSolicitudId };
