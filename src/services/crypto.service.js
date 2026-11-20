const { createCipheriv, createDecipheriv, randomBytes } = require("node:crypto");

// Cifrado simetrico para datos sensibles en reposo (p. ej. el secreto TOTP).
// Si la base se filtra, sin la clave del servidor los secretos no sirven para generar codigos.
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const KEY_PATTERN = /^[0-9a-fA-F]{64}$/;

function getKey() {
    const key = process.env.TOTP_ENCRYPTION_KEY;

    if (!key || !KEY_PATTERN.test(key)) {
        throw new Error(
            "TOTP_ENCRYPTION_KEY debe estar configurada con 64 caracteres hexadecimales (32 bytes)"
        );
    }

    return Buffer.from(key, "hex");
}

// Formato persistido: iv:authTag:cifrado (cada parte en base64)
function encrypt(plainText) {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, getKey(), iv);
    const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return [iv, authTag, encrypted].map((part) => part.toString("base64")).join(":");
}

function decrypt(payload) {
    const [iv, authTag, encrypted] = payload
        .split(":")
        .map((part) => Buffer.from(part, "base64"));

    const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

module.exports = { encrypt, decrypt };
