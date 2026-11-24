const twoFactorRepository = require("../repositories/two-factor.repository");
const cryptoService = require("./crypto.service");
const passwordService = require("./password.service");
const tokenService = require("./token.service");
const totpService = require("./totp.service");
const { toAuthenticatedUser } = require("../dtos/auth.dto");
const { InvalidCredentialsError } = require("../errors/auth.errors");
const { UserNotFoundError } = require("../errors/user.errors");
const {
    TwoFactorAlreadyEnabledError,
    TwoFactorNotInitializedError,
    TwoFactorNotEnabledError,
    InvalidTwoFactorCodeError,
    InvalidTwoFactorSessionError,
    TooManyTwoFactorAttemptsError,
} = require("../errors/two-factor.errors");

const MAX_LOGIN_ATTEMPTS = 5;
const JWT_ERRORS = new Set(["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"]);

// Intentos por token intermedio (jti). Vive en memoria: alcanza para una sola
// instancia del backend; con varias replicas habria que moverlo a Redis o a la base.
const loginAttempts = new Map();

function pruneExpiredAttempts(now) {
    for (const [jti, entry] of loginAttempts) {
        if (entry.expiresAt <= now) {
            loginAttempts.delete(jti);
        }
    }
}

async function getUserOrFail(id_usuario) {
    const user = await twoFactorRepository.findById(id_usuario);

    if (!user) {
        throw new UserNotFoundError();
    }

    return user;
}

// Verifica el codigo contra el secreto guardado y registra el paso usado
async function checkAndConsumeCode(user, code) {
    const secret = cryptoService.decrypt(user.totp_secreto);
    const timeStep = await totpService.verifyCode({
        secret,
        code,
        afterTimeStep: user.totp_ultimo_paso,
    });

    if (timeStep == null) {
        return false;
    }

    return twoFactorRepository.consumeTimeStep(user.id_usuario, timeStep);
}

async function getStatus(id_usuario) {
    const user = await getUserOrFail(id_usuario);

    return { enabled: user.totp_habilitado };
}

// Paso 1 de la activacion: genera un secreto nuevo y el QR para escanearlo
async function setup(id_usuario) {
    const user = await getUserOrFail(id_usuario);

    if (user.totp_habilitado) {
        throw new TwoFactorAlreadyEnabledError();
    }

    const secret = totpService.createSecret();
    await twoFactorRepository.savePendingSecret(id_usuario, cryptoService.encrypt(secret));

    const { otpauthUrl, qrCode } = await totpService.buildEnrollment({
        secret,
        email: user.email,
    });

    return { secret, otpauthUrl, qrCode };
}

// Paso 2 de la activacion: el usuario confirma con un codigo de la app
async function enable(id_usuario, { code }) {
    const user = await getUserOrFail(id_usuario);

    if (user.totp_habilitado) {
        throw new TwoFactorAlreadyEnabledError();
    }

    if (!user.totp_secreto) {
        throw new TwoFactorNotInitializedError();
    }

    const timeStep = await totpService.verifyCode({
        secret: cryptoService.decrypt(user.totp_secreto),
        code,
    });

    if (timeStep == null) {
        throw new InvalidTwoFactorCodeError();
    }

    await twoFactorRepository.enable(id_usuario, timeStep);

    return { enabled: true };
}

// Desactivar exige contraseña y codigo: un token robado no alcanza para quitar el 2FA
async function disable(id_usuario, { password, code }) {
    const user = await getUserOrFail(id_usuario);

    if (!user.totp_habilitado) {
        throw new TwoFactorNotEnabledError();
    }

    const passwordMatches = await passwordService.comparePassword(password, user.password);

    if (!passwordMatches) {
        throw new InvalidCredentialsError();
    }

    if (!(await checkAndConsumeCode(user, code))) {
        throw new InvalidTwoFactorCodeError();
    }

    await twoFactorRepository.disable(id_usuario);

    return { enabled: false };
}

// Segundo paso del login: canjea el token intermedio + codigo por el JWT de acceso
async function verifyLogin({ tempToken, code }) {
    let payload;

    try {
        payload = tokenService.verifyTwoFactorToken(tempToken);
    } catch (error) {
        if (JWT_ERRORS.has(error.name)) {
            throw new InvalidTwoFactorSessionError();
        }
        throw error;
    }

    const now = Date.now();
    pruneExpiredAttempts(now);

    const attempt = loginAttempts.get(payload.jti) ?? {
        count: 0,
        used: false,
        expiresAt: payload.exp * 1000,
    };

    if (attempt.used) {
        throw new InvalidTwoFactorSessionError();
    }

    if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
        throw new TooManyTwoFactorAttemptsError();
    }

    const user = await twoFactorRepository.findById(Number(payload.sub));

    if (!user || !user.activo || !user.totp_habilitado || !user.totp_secreto) {
        throw new InvalidTwoFactorSessionError();
    }

    if (!(await checkAndConsumeCode(user, code))) {
        attempt.count += 1;
        loginAttempts.set(payload.jti, attempt);

        if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
            throw new TooManyTwoFactorAttemptsError();
        }
        throw new InvalidTwoFactorCodeError();
    }

    // El token intermedio es de un solo uso
    attempt.used = true;
    loginAttempts.set(payload.jti, attempt);

    return {
        user: toAuthenticatedUser(user),
        token: tokenService.generateToken(user),
    };
}

// Uso administrativo: el usuario perdio el celular y no puede generar codigos
async function resetByEmail(email) {
    return twoFactorRepository.disableByEmail(email);
}

module.exports = { getStatus, setup, enable, disable, verifyLogin, resetByEmail };
