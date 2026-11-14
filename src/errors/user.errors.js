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

class UserNotFoundError extends Error {
  constructor() {
    super("El usuario no existe");
    this.name = "UserNotFoundError";
  }
}

module.exports = { EmailAlreadyInUseError, RoleNotFoundError, UserNotFoundError };
