// 2FA obligatoria: por defecto todo usuario debe activar Google Authenticator
// antes de poder usar el sistema. TWO_FACTOR_REQUIRED=false la vuelve opcional.
function isTwoFactorRequired() {
    return process.env.TWO_FACTOR_REQUIRED?.trim().toLowerCase() !== "false";
}

// true si el usuario todavia tiene que activar el 2FA para poder usar el sistema
function mustEnableTwoFactor(user) {
    return isTwoFactorRequired() && !user.totp_habilitado;
}

module.exports = { isTwoFactorRequired, mustEnableTwoFactor };
