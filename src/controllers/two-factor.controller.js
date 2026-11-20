const twoFactorService = require("../services/two-factor.service");
const {
    validateEnableTwoFactor,
    validateDisableTwoFactor,
    validateTwoFactorLogin,
} = require("../validators/two-factor.validator");
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

// En las rutas autenticadas un codigo o contraseña incorrectos son 400:
// el 401 se reserva para "token de acceso invalido" y el front lo usa para cerrar sesion
const AUTHENTICATED_ERROR_STATUS = new Map([
    [TwoFactorAlreadyEnabledError, 409],
    [TwoFactorNotInitializedError, 400],
    [TwoFactorNotEnabledError, 400],
    [InvalidTwoFactorCodeError, 400],
    [InvalidCredentialsError, 400],
    [UserNotFoundError, 404],
]);

const LOGIN_ERROR_STATUS = new Map([
    [InvalidTwoFactorCodeError, 401],
    [InvalidTwoFactorSessionError, 401],
    [TooManyTwoFactorAttemptsError, 429],
]);

function sendError(res, error, statusMap, fallbackMessage) {
    for (const [ErrorClass, status] of statusMap) {
        if (error instanceof ErrorClass) {
            return res.status(status).json({ status: "error", message: error.message });
        }
    }

    console.error(
        `${fallbackMessage}:`,
        error instanceof Error ? error.name : "Unknown error"
    );

    return res.status(500).json({ status: "error", message: fallbackMessage });
}

function sendValidationErrors(res, errors) {
    return res.status(400).json({ status: "error", errors });
}

async function getStatus(req, res) {
    try {
        const result = await twoFactorService.getStatus(req.user.id_usuario);
        return res.status(200).json({ status: "success", ...result });
    } catch (error) {
        return sendError(res, error, AUTHENTICATED_ERROR_STATUS, "No se pudo consultar el estado del 2FA");
    }
}

async function setup(req, res) {
    try {
        const result = await twoFactorService.setup(req.user.id_usuario);
        // Incluye el secreto en claro: no debe quedar en caches
        return res
            .status(200)
            .set("Cache-Control", "no-store")
            .json({ status: "success", ...result });
    } catch (error) {
        return sendError(res, error, AUTHENTICATED_ERROR_STATUS, "No se pudo generar el codigo QR");
    }
}

async function enable(req, res) {
    const { errors, data } = validateEnableTwoFactor(req.body);

    if (errors.length > 0) {
        return sendValidationErrors(res, errors);
    }

    try {
        const result = await twoFactorService.enable(req.user.id_usuario, data);
        return res.status(200).json({ status: "success", ...result });
    } catch (error) {
        return sendError(res, error, AUTHENTICATED_ERROR_STATUS, "No se pudo activar el 2FA");
    }
}

async function disable(req, res) {
    const { errors, data } = validateDisableTwoFactor(req.body);

    if (errors.length > 0) {
        return sendValidationErrors(res, errors);
    }

    try {
        const result = await twoFactorService.disable(req.user.id_usuario, data);
        return res.status(200).json({ status: "success", ...result });
    } catch (error) {
        return sendError(res, error, AUTHENTICATED_ERROR_STATUS, "No se pudo desactivar el 2FA");
    }
}

async function verifyLogin(req, res) {
    const { errors, data } = validateTwoFactorLogin(req.body);

    if (errors.length > 0) {
        return sendValidationErrors(res, errors);
    }

    try {
        const result = await twoFactorService.verifyLogin(data);
        return res
            .status(200)
            .set("Cache-Control", "no-store")
            .json({ status: "success", user: result.user, token: result.token });
    } catch (error) {
        return sendError(res, error, LOGIN_ERROR_STATUS, "No se pudo verificar el codigo");
    }
}

module.exports = { getStatus, setup, enable, disable, verifyLogin };
