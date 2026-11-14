
const prisma = require("../config/prisma");

async function findByEmail(email) {
    return prisma.usuario.findUnique({
        where: { email },
        select: {
            id_usuario: true,
            nombre: true,
            email: true,
            password: true,
            activo: true,
            rol: {
                select: {
                    id_rol: true,
                    nombre: true,
                },
            },
        },
    });
}

async function findById(id_usuario) {
    return prisma.usuario.findUnique({
        where: { id_usuario },
        select: {
            id_usuario: true,
            nombre: true,
            email: true,
            activo: true,
            rol: {
                select: {
                    id_rol: true,
                    nombre: true,
                },
            },
        },
    });
}

module.exports = {
    findByEmail,
    findById,
};
