const solicitudService = require("../services/solicitud.service");

async function listSolicitudes(req, res) {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);

    if (
      !Number.isInteger(page) ||
      !Number.isInteger(limit) ||
      page < 1 ||
      limit < 1 ||
      limit > 100
    ) {
      return res.status(400).json({
        status: "error",
        message: "Los parámetros page y limit deben ser enteros positivos. El límite máximo es 100.",
      });
    }

    const resultado = await solicitudService.listSolicitudes(
      req.user,
      page,
      limit
    );

    return res.status(200).set("Cache-Control", "no-store").json({
      status: "success",
      ...resultado,
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
