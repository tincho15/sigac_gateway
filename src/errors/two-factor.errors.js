class TwoFactorAlreadyEnabledError extends Error {
  constructor() {
    super("La autenticacion de dos factores ya esta activada");
    this.name = "TwoFactorAlreadyEnabledError";
  }
}

class TwoFactorNotInitializedError extends Error {
  constructor() {
    super("Primero genera el codigo QR con POST /auth/2fa/setup");
    this.name = "TwoFactorNotInitializedError";
  }
}

class TwoFactorNotEnabledError extends Error {
  constructor() {
    super("La autenticacion de dos factores no esta activada");
    this.name = "TwoFactorNotEnabledError";
  }
}

class InvalidTwoFactorCodeError extends Error {
  constructor() {
    super("Codigo de verificacion incorrecto");
    this.name = "InvalidTwoFactorCodeError";
  }
}

class InvalidTwoFactorSessionError extends Error {
  constructor() {
    super("La verificacion expiro o no es valida. Inicia sesion nuevamente");
    this.name = "InvalidTwoFactorSessionError";
  }
}

class TooManyTwoFactorAttemptsError extends Error {
  constructor() {
    super("Demasiados intentos fallidos. Inicia sesion nuevamente");
    this.name = "TooManyTwoFactorAttemptsError";
  }
}

module.exports = {
  TwoFactorAlreadyEnabledError,
  TwoFactorNotInitializedError,
  TwoFactorNotEnabledError,
  InvalidTwoFactorCodeError,
  InvalidTwoFactorSessionError,
  TooManyTwoFactorAttemptsError,
};
