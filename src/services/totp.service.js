const { generateSecret, generateURI, verify } = require("otplib");
const QRCode = require("qrcode");

// Tolerancia de 30 s hacia atras y adelante: absorbe un periodo de desfase
// entre el reloj del servidor y el del celular
const EPOCH_TOLERANCE = 30;

function createSecret() {
    return generateSecret();
}

// Devuelve la URI otpauth:// que entienden Google Authenticator y apps compatibles,
// y la misma URI como imagen QR (data URL PNG) lista para mostrar en un <img>
async function buildEnrollment({ secret, email }) {
    const otpauthUrl = generateURI({
        issuer: process.env.TOTP_ISSUER || "SIGAC",
        label: email,
        secret,
    });

    const qrCode = await QRCode.toDataURL(otpauthUrl);

    return { otpauthUrl, qrCode };
}

// Devuelve el paso de tiempo en que coincidio el codigo, o null si no es valido.
// afterTimeStep descarta codigos de pasos ya usados (proteccion contra replay).
async function verifyCode({ secret, code, afterTimeStep }) {
    const result = await verify({
        secret,
        token: code,
        epochTolerance: EPOCH_TOLERANCE,
        ...(afterTimeStep != null ? { afterTimeStep } : {}),
    });

    return result.valid ? result.timeStep : null;
}

module.exports = { createSecret, buildEnrollment, verifyCode };
