// DTOs de respuesta: definen explicitamente que campos se exponen al cliente

function toSolicitudListItem(solicitud) {
  const asignado = solicitud.asignaciones[0]?.asignado ?? null;

  return {
    id_solicitud: solicitud.id_solicitud,
    fecha: solicitud.fecha,
    origen: solicitud.origen,
    tipo: solicitud.tipo,
    estado: solicitud.estado,
    cantidad_expedientes: solicitud._count.solicitudesExpedientes,
    asignado,
  };
}

module.exports = { toSolicitudListItem };