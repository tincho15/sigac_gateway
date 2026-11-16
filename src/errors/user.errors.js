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
    super("El usuario indicado no existe");
    this.name = "UserNotFoundError";
  }
}

class InvalidCurrentPasswordError extends Error {
  constructor() {
    super("La contraseña actual es incorrecta");
    this.name = "InvalidCurrentPasswordError";
  }
}

module.exports = { EmailAlreadyInUseError, RoleNotFoundError, UserNotFoundError, InvalidCurrentPasswordError };
