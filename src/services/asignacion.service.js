const asignacionRepository = require("../repositories/asignacion.repository");
const {
  SolicitudNotFoundError,
  FuncionarioInvalidoError,
} = require("../errors/asignacion.errors");

// Asigna (o reasigna) una solicitud a un funcionario. La asignacion anterior se
// cierra con fecha_fin y se crea una nueva, asi se conserva quien la tuvo antes.
// Devuelve { asignacion, created }: created es false si la solicitud ya estaba
// asignada a ese funcionario (no se hace ningun cambio).
async function assignSolicitud({ id_solicitud, id_asignado, id_asignador }) {
  return asignacionRepository.runInTransaction(async (tx) => {
    const exists = await asignacionRepository.lockSolicitud(tx, id_solicitud);
    if (!exists) {
      throw new SolicitudNotFoundError();
    }

    const funcionario = await asignacionRepository.findFuncionarioActivo(
      tx,
      id_asignado
    );
    if (!funcionario) {
      throw new FuncionarioInvalidoError();
    }

    const vigente = await asignacionRepository.findVigente(tx, id_solicitud);
    if (vigente && vigente.id_asignado === id_asignado) {
      return { asignacion: vigente, created: false };
    }

    const now = new Date();
    await asignacionRepository.closeVigentes(tx, id_solicitud, now);

    const asignacion = await asignacionRepository.createAsignacion(tx, {
      id_solicitud,
      id_asignado,
      id_asignador,
      fecha_asignacion: now,
    });

    return { asignacion, created: true };
  });
}

module.exports = { assignSolicitud };
