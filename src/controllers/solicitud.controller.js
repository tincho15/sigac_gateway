const solicitudService = require("../services/solicitud.service");

async function listSolicitudes(req, res) {
  try {
    const solicitudes = await solicitudService.listSolicitudes(req.user);

    // Un listado sin resultados es una respuesta valida: 200 con lista vacia
    return res.status(200).set("Cache-Control", "no-store").json({
      status: "success",
      total: solicitudes.length,
      solicitudes,
    });
  } catch (error) {
    console.error(
      "Solicitud listing failed:",
      error instanceof Error ? error.name : "Unknown error"
    );
    return res.status(500).json({
      status: "error",
      message: "No se pudieron obtener las solicitudes",
    });
  }
}

module.exports = { listSolicitudes };
