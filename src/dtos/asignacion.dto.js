// DTOs de respuesta: definen explicitamente que campos se exponen al cliente

function toAsignacionResponse(asignacion) {
  return {
    id_asignacion: asignacion.id_asignacion,
    id_solicitud: asignacion.id_solicitud,
    fecha_asignacion: asignacion.fecha_asignacion,
    asignado: asignacion.asignado,
  };
}

module.exports = { toAsignacionResponse };
