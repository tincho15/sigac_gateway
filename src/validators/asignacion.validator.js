const INT4_MAX = 2147483647;

function isValidId(value) {
  return Number.isInteger(value) && value >= 1 && value <= INT4_MAX;
}

// id: id de la solicitud (viene en la URL, siempre como texto)
// body: { id_asignado } con el id del funcionario que recibe la solicitud
function validateCreateAsignacion(id, body) {
  const errors = [];
  const id_solicitud = Number(id);

  if (!/^[1-9]\d*$/.test(id) || !isValidId(id_solicitud)) {
    errors.push("id debe ser un entero positivo");
  }

  const isObject =
    body !== null && typeof body === "object" && !Array.isArray(body);
  const id_asignado = isObject ? body.id_asignado : undefined;

  if (!isValidId(id_asignado)) {
    errors.push("id_asignado debe ser un entero positivo");
  }

  return { errors, data: { id_solicitud, id_asignado } };
}

module.exports = { validateCreateAsignacion };
