
const authRepository = require("../repositories/auth.repository");
const passwordService = require("./password.service");
const tokenService = require("./token.service");
const tokenRepository = require("../repositories/token.repository");

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

async function logout({ jti, exp, id_usuario }) {
    await tokenRepository.revoke({
        jti,
        id_usuario,
        // exp viene en segundos (estandar JWT)
        expira_en: new Date(exp * 1000),
    });

    // Limpieza oportunista: los tokens vencidos ya los rechaza jwt.verify,
    // asi que sus filas no hacen falta. Un fallo aca no debe impedir el logout.
    try {
        await tokenRepository.deleteExpired();
    } catch (error) {
        console.error(
            "Expired token cleanup failed:",
            error instanceof Error ? error.name : "Unknown error"
        );
    }
}

module.exports = { login, logout, InvalidCredentialsError };
