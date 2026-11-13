
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

module.exports = { findByEmail };
