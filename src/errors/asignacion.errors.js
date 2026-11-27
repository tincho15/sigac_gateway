class SolicitudNotFoundError extends Error {
  constructor() {
    super("La solicitud indicada no existe");
    this.name = "SolicitudNotFoundError";
  }
}

// El usuario indicado no existe, esta inactivo o no tiene rol Funcionario
class FuncionarioInvalidoError extends Error {
  constructor() {
    super("El usuario indicado no existe o no es un funcionario válido para recibir asignaciones");
    this.name = "FuncionarioInvalidoError";
  }
}

module.exports = { SolicitudNotFoundError, FuncionarioInvalidoError };
