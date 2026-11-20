class InvalidCredentialsError extends Error {
    constructor() {
        super("Credenciales incorrectas");
        this.name = "InvalidCredentialsError";
    }
}

module.exports = { InvalidCredentialsError };
