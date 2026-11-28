// DTOs de respuesta: definen explicitamente que campos se exponen al cliente

function toUsuarioResumen(usuario) {
  if (!usuario) {
    return null;
  }
  return {
    id_usuario: usuario.id_usuario,
    nombre: usuario.nombre,
    email: usuario.email,
  };
}

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

function toSolicitudDetalleResponse(solicitud) {
  const [asignacionActual] = solicitud.asignaciones;

  return {
    id_solicitud: solicitud.id_solicitud,
    fecha: solicitud.fecha,
    origen: solicitud.origen,
    observaciones: solicitud.observaciones,
    tipo: solicitud.tipo,
    estado: solicitud.estado,
    usuario: toUsuarioResumen(solicitud.usuario),
    email: solicitud.email,
    asignacion: asignacionActual
      ? {
          id_asignacion: asignacionActual.id_asignacion,
          fecha_asignacion: asignacionActual.fecha_asignacion,
          asignado: toUsuarioResumen(asignacionActual.asignado),
          asignador: toUsuarioResumen(asignacionActual.asignador),
        }
      : null,
    expedientes: solicitud.solicitudesExpedientes.map((se) => ({
      ...se.expediente,
      estado: se.estado,
      observaciones: se.observaciones,
      fecha_inicio: se.fecha_inicio,
      fecha_fin: se.fecha_fin,
    })),
    documentos: solicitud.documentos,
    historial: solicitud.historiales.map((h) => ({
      id_historial: h.id_historial,
      fecha: h.fecha,
      accion: h.accion,
      detalle: h.detalle,
      usuario: toUsuarioResumen(h.usuario),
    })),
  };
}

module.exports = {
  toSolicitudResponse,
  toSolicitudListItem,
  toSolicitudDetalleResponse,
};
