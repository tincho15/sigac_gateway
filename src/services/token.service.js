const { randomUUID } = require("node:crypto");
const jwt = require("jsonwebtoken");

// La audiencia distingue el token de acceso del token intermedio de 2FA:
// el token de 2FA no sirve para entrar a rutas protegidas y viceversa
const ACCESS_AUDIENCE = "sigac:access";
const TWO_FACTOR_AUDIENCE = "sigac:2fa";
const ALGORITHMS = ["HS256"];

function getSecret() {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT_SECRET no está configurado");
    }

    return secret;
}

function generateToken(user) {
    return jwt.sign(
        {
            role: user.rol.nombre,
            id_rol: user.rol.id_rol,
        },
        getSecret(),
        {
            subject: String(user.id_usuario),
            // Identificador unico del token, necesario para poder revocarlo en el logout
            jwtid: randomUUID(),
            audience: ACCESS_AUDIENCE,
            expiresIn: process.env.JWT_EXPIRES_IN || "1h",
        }
    );
}

function verifyToken(token) {
    return jwt.verify(token, getSecret(), {
        audience: ACCESS_AUDIENCE,
        algorithms: ALGORITHMS,
    });
}

// Token de corta duracion que se entrega tras validar la contraseña de un usuario
// con 2FA activo. Solo permite llamar a POST /auth/2fa/login. El jti identifica
// el intento para limitar la cantidad de codigos probados y usarlo una sola vez.
function generateTwoFactorToken(id_usuario) {
    return jwt.sign({}, getSecret(), {
        subject: String(id_usuario),
        audience: TWO_FACTOR_AUDIENCE,
        expiresIn: process.env.TWO_FACTOR_TOKEN_EXPIRES_IN || "5m",
        jwtid: randomUUID(),
    });
}

function verifyTwoFactorToken(token) {
    return jwt.verify(token, getSecret(), {
        audience: TWO_FACTOR_AUDIENCE,
        algorithms: ALGORITHMS,
    });
}

module.exports = {
    generateToken,
    verifyToken,
    generateTwoFactorToken,
    verifyTwoFactorToken,
};
