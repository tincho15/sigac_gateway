class EmailAlreadyInUseError extends Error {
  constructor() {
    super("El email ya esta registrado");
    this.name = "EmailAlreadyInUseError";
  }
}

class RoleNotFoundError extends Error {
  constructor() {
    super("El rol indicado no existe");
    this.name = "RoleNotFoundError";
  }
}

module.exports = { EmailAlreadyInUseError, RoleNotFoundError };
