const jwt = require("jsonwebtoken");

function generateToken(user) {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT_SECRET no está configurado");
    }

    return jwt.sign(
        {
            role: user.rol.nombre,
            id_rol: user.rol.id_rol,
        },
        secret,
        {
            subject: String(user.id_usuario),
            expiresIn: process.env.JWT_EXPIRES_IN || "1h",
        }
    );
}

function verifyToken(token) {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT_SECRET no está configurado");
    }

    return jwt.verify(token, secret);
}

module.exports = {
    generateToken,
    verifyToken,
};