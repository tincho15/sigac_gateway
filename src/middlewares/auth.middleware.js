const authRepository = require("../repositories/auth.repository");
const tokenRepository = require("../repositories/token.repository");
const tokenService = require("../services/token.service");
const { mustEnableTwoFactor } = require("../config/two-factor");

const TWO_FACTOR_SETUP_REQUIRED = "TWO_FACTOR_SETUP_REQUIRED";

// allowPendingTwoFactor: permite el acceso a usuarios que todavia no activaron el 2FA
// obligatorio. Solo se usa en las rutas necesarias para activarlo (y /me, logout,
// cambio de contraseña); el resto responde 403 hasta que lo activen.
function createAuthenticate({ allowPendingTwoFactor = false } = {}) {
    return (req, res, next) => authenticateRequest(req, res, next, allowPendingTwoFactor);
}

async function authenticateRequest(req, res, next, allowPendingTwoFactor) {
    // 1. Obtener el encabezado Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            error: "No se proporcionó un token de autenticación",
        });
    }

    // 2. Extraer el JWT
    const token = authHeader.split(" ")[1];

    let payload;

    // 3. Verificar el token
    try {
        payload = tokenService.verifyToken(token);
    } catch (error) {
        if (
            error.name === "JsonWebTokenError" ||
            error.name === "TokenExpiredError" ||
            error.name === "NotBeforeError"
        ) {
            return res.status(401).json({
                error: "Token inválido o expirado",
            });
        }

        return next(error);
    }

    // 4. Obtener el ID del usuario desde el token
    const id_usuario = Number(payload.sub);

    if (!Number.isSafeInteger(id_usuario) || id_usuario <= 0) {
        return res.status(401).json({
            error: "Identidad de usuario inválida",
        });
    }

    // 5. El token debe tener un identificador (jti) para poder revocarse
    const { jti, exp } = payload;

    if (typeof jti !== "string" || jti.length === 0) {
        return res.status(401).json({
            error: "Token inválido o expirado",
        });
    }

    try {
        // 6. Buscar el usuario y comprobar que el token no fue revocado (logout)
        const [user, revoked] = await Promise.all([
            authRepository.findById(id_usuario),
            tokenRepository.isRevoked(jti),
        ]);

        if (revoked) {
            return res.status(401).json({
                error: "Token inválido o expirado",
            });
        }

        if (!user || !user.activo) {
            return res.status(401).json({
                error: "Usuario inexistente o desactivado",
            });
        }

        // 7. Con 2FA obligatoria, sin activarlo solo se accede a las rutas de activacion
        if (!allowPendingTwoFactor && mustEnableTwoFactor(user)) {
            return res.status(403).json({
                error: "Tenés que activar la verificación en dos pasos para continuar",
                code: TWO_FACTOR_SETUP_REQUIRED,
            });
        }

        // 8. Adjuntar el usuario y los datos del token a la solicitud
        req.user = user;
        req.auth = { jti, exp };

        // 9. Continuar con el siguiente middleware
        next();

    } catch (error) {
        next(error);
    }
}

const authenticate = createAuthenticate();
const authenticateAllowingTwoFactorSetup = createAuthenticate({ allowPendingTwoFactor: true });

module.exports = {
    authenticate,
    authenticateAllowingTwoFactorSetup,
    TWO_FACTOR_SETUP_REQUIRED,
};