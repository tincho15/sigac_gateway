const CODE_PATTERN = /^\d{6}$/;
const TEMP_TOKEN_MAX_LENGTH = 2048;

// Acepta "123456", "123 456" o 123456: las apps muestran el codigo separado en dos bloques
function normalizeCode(code) {
    if (typeof code === "number") {
        code = String(code).padStart(6, "0");
    }
    return typeof code === "string" ? code.replace(/\s+/g, "") : "";
}

function validateCode(code, errors) {
    const normalized = normalizeCode(code);

    if (!CODE_PATTERN.test(normalized)) {
        errors.push("El codigo debe tener 6 digitos");
    }

    return normalized;
}

function validateEnableTwoFactor(body) {
    const errors = [];
    const code = validateCode(body?.code, errors);

    return { errors, data: { code } };
}

function validateDisableTwoFactor(body) {
    const { password } = body ?? {};
    const errors = [];

    if (typeof password !== "string" || password.length === 0) {
        errors.push("La contraseña es obligatoria");
    }

    const code = validateCode(body?.code, errors);

    return { errors, data: { password, code } };
}

function validateTwoFactorLogin(body) {
    const { tempToken } = body ?? {};
    const errors = [];

    if (
        typeof tempToken !== "string" ||
        tempToken.length === 0 ||
        tempToken.length > TEMP_TOKEN_MAX_LENGTH
    ) {
        errors.push("tempToken es obligatorio");
    }

    const code = validateCode(body?.code, errors);

    return { errors, data: { tempToken, code } };
}

module.exports = {
    validateEnableTwoFactor,
    validateDisableTwoFactor,
    validateTwoFactorLogin,
};
