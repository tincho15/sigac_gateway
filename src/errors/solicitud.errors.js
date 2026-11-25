class SolicitudNotFoundError extends Error {
  constructor() {
    super("La solicitud indicada no existe");
    this.name = "SolicitudNotFoundError";
  }
}

class SolicitudAccessDeniedError extends Error {
  constructor() {
    super("No tenés permisos para ver esta solicitud");
    this.name = "SolicitudAccessDeniedError";
  }
}

module.exports = { SolicitudNotFoundError, SolicitudAccessDeniedError };
