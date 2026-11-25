const prisma = require("../config/prisma");

// Datos publicos de un usuario: nunca se selecciona password ni campos de 2FA
const USUARIO_RESUMEN = {
  select: { id_usuario: true, nombre: true, email: true },
};

async function findDetalleById(id_solicitud) {
  return prisma.solicitud.findUnique({
    where: { id_solicitud },
    select: {
      id_solicitud: true,
      fecha: true,
      origen: true,
      observaciones: true,
      tipo: { select: { id_tipo: true, nombre: true } },
      estado: { select: { id_estado: true, nombre: true } },
      usuario: USUARIO_RESUMEN,
      email: {
        select: {
          id_email: true,
          remitente: true,
          asunto: true,
          fecha_recepcion: true,
        },
      },
      // Solo la asignacion vigente (sin fecha de fin) define quien puede ver la solicitud
      asignaciones: {
        where: { fecha_fin: null },
        orderBy: { fecha_asignacion: "desc" },
        select: {
          id_asignacion: true,
          fecha_asignacion: true,
          asignado: USUARIO_RESUMEN,
          asignador: USUARIO_RESUMEN,
        },
      },
      solicitudesExpedientes: {
        orderBy: { fecha_inicio: "asc" },
        select: {
          observaciones: true,
          fecha_inicio: true,
          fecha_fin: true,
          estado: { select: { id_estado: true, nombre: true } },
          expediente: {
            select: {
              id_expediente: true,
              iue: true,
              numero: true,
              ficha: true,
              nro_archivo: true,
              juzgado: {
                select: { id_juzgado: true, numero: true, nombre: true },
              },
              ubicacion: {
                select: {
                  id_ubicacion: true,
                  piso: true,
                  nro_estanteria: true,
                  anio: true,
                },
              },
            },
          },
        },
      },
      documentos: {
        orderBy: { fecha_procesamiento: "asc" },
        select: {
          id_documento: true,
          tipo_documento: true,
          datos_extraidos: true,
          confianza_ocr: true,
          fecha_procesamiento: true,
        },
      },
      historiales: {
        orderBy: { fecha: "desc" },
        select: {
          id_historial: true,
          fecha: true,
          accion: true,
          detalle: true,
          usuario: USUARIO_RESUMEN,
        },
      },
    },
  });
}

module.exports = { findDetalleById };
