// DTOs de respuesta: definen explicitamente que campos se exponen al cliente

function toSolicitudResponse(solicitud) {
  return {
    id_solicitud: solicitud.id_solicitud,
    fecha: solicitud.fecha,
    origen: solicitud.origen,
    observaciones: solicitud.observaciones,
    id_usuario: solicitud.id_usuario,
    tipo: solicitud.tipo,
    estado: solicitud.estado,
    pendiente_asignacion: solicitud._count.asignaciones === 0,
    expedientes: solicitud.solicitudesExpedientes.map(
      ({ expediente, estado, observaciones }) => ({
        id_expediente: expediente.id_expediente,
        iue: expediente.iue,
        numero: expediente.numero,
        ficha: expediente.ficha,
        nro_archivo: expediente.nro_archivo,
        id_juzgado: expediente.id_juzgado,
        estado,
        observaciones,
      })
    ),
  };
}

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

module.exports = { toSolicitudResponse, toSolicitudListItem };
