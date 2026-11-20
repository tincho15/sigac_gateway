const prisma = require("../config/prisma");
const { UserNotFoundError } = require("../errors/user.errors");

const RECORD_NOT_FOUND = "P2025";

const userWithTotpSelect = {
    id_usuario: true,
    nombre: true,
    email: true,
    password: true,
    activo: true,
    debe_cambiar_password: true,
    totp_habilitado: true,
    totp_secreto: true,
    totp_ultimo_paso: true,
    rol: {
        select: {
            id_rol: true,
            nombre: true,
        },
    },
};

async function findById(id_usuario) {
    return prisma.usuario.findUnique({
        where: { id_usuario },
        select: userWithTotpSelect,
    });
}

// Guarda un secreto pendiente de confirmacion: el 2FA sigue desactivado
// hasta que el usuario demuestre que lo cargo en la app (POST /auth/2fa/enable)
async function savePendingSecret(id_usuario, encryptedSecret) {
    return prisma.usuario.update({
        where: { id_usuario },
        data: {
            totp_secreto: encryptedSecret,
            totp_habilitado: false,
            totp_ultimo_paso: null,
        },
        select: { id_usuario: true },
    });
}

async function enable(id_usuario, timeStep) {
    return prisma.usuario.update({
        where: { id_usuario },
        data: { totp_habilitado: true, totp_ultimo_paso: timeStep },
        select: { id_usuario: true },
    });
}

async function disable(id_usuario) {
    return prisma.usuario.update({
        where: { id_usuario },
        data: { totp_habilitado: false, totp_secreto: null, totp_ultimo_paso: null },
        select: { id_usuario: true },
    });
}

// Registra el paso usado solo si es posterior al ultimo: dos solicitudes
// simultaneas con el mismo codigo no pueden ser aceptadas ambas
async function consumeTimeStep(id_usuario, timeStep) {
    const { count } = await prisma.usuario.updateMany({
        where: {
            id_usuario,
            OR: [{ totp_ultimo_paso: null }, { totp_ultimo_paso: { lt: timeStep } }],
        },
        data: { totp_ultimo_paso: timeStep },
    });

    return count === 1;
}

async function disableByEmail(email) {
    try {
        return await prisma.usuario.update({
            where: { email },
            data: { totp_habilitado: false, totp_secreto: null, totp_ultimo_paso: null },
            select: { email: true },
        });
    } catch (error) {
        if (error.code === RECORD_NOT_FOUND) {
            throw new UserNotFoundError();
        }
        throw error;
    }
}

module.exports = {
    findById,
    savePendingSecret,
    enable,
    disable,
    consumeTimeStep,
    disableByEmail,
};
