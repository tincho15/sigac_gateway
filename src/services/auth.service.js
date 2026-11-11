
const authRepository = require("../repositories/auth.repository");
const passwordService = require("./password.service");
const tokenService = require("./token.service");

class InvalidCredentialsError extends Error {
    constructor() {
        super("Credenciales incorrectas");
        this.name = "InvalidCredentialsError";
    }
}

async function login({ email, password }) {
    const user = await authRepository.findByEmail(email);

    if (!user || !user.activo) {
        throw new InvalidCredentialsError();
    }

    const passwordMatches = await passwordService.comparePassword(
        password,
        user.password
    );

    if (!passwordMatches) {
        throw new InvalidCredentialsError();
    }

    const { password: _, activo, ...authenticatedUser } = user;

    const token = tokenService.generateToken(authenticatedUser);

    return {
        user: authenticatedUser,
        token,
    };
}

module.exports = { login, InvalidCredentialsError };
