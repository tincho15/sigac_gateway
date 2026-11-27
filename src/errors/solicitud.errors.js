class TipoSolicitudNotFoundError extends Error {
  constructor() {
    super("El tipo de solicitud indicado no existe");
    this.name = "TipoSolicitudNotFoundError";
  }
}

class JuzgadoNotFoundError extends Error {
  constructor(ids) {
    super(`No existen los juzgados indicados: ${ids.join(", ")}`);
    this.name = "JuzgadoNotFoundError";
  }
}

class ExpedienteNotFoundError extends Error {
  constructor(ids) {
    super(`No existen los expedientes indicados: ${ids.join(", ")}`);
    this.name = "ExpedienteNotFoundError";
  }
}

// Los datos enviados contradicen un expediente ya registrado
class ExpedienteInconsistenteError extends Error {
  constructor(message) {
    super(message);
    this.name = "ExpedienteInconsistenteError";
  }
}

// Falta un catalogo precargado (ejecutar npm run db:seed)
class EstadoNotFoundError extends Error {
  constructor(nombre) {
    super(`No existe el estado ${nombre}`);
    this.name = "EstadoNotFoundError";
  }
}

module.exports = {
  TipoSolicitudNotFoundError,
  JuzgadoNotFoundError,
  ExpedienteNotFoundError,
  ExpedienteInconsistenteError,
  EstadoNotFoundError,
};
