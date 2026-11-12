const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX_LENGTH = 150;

function validateLogin(body) {
    const { email, password } = body ?? {};
    const errors = [];

    const normalizedEmail =
        typeof email === "string" ? email.trim().toLowerCase() : "";

    if (
        !EMAIL_PATTERN.test(normalizedEmail) ||
        normalizedEmail.length > EMAIL_MAX_LENGTH
    ) {
        errors.push("El email debe ser válido");
    }

    if (typeof password !== "string" || password.length === 0) {
        errors.push("La contraseña es obligatoria");
    }

    return {
        errors,
        data: {
            email: normalizedEmail,
            password,
        },
    };
}

module.exports = { validateLogin };