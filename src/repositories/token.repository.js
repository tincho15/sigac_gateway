const prisma = require("../config/prisma");

async function isRevoked(jti) {
    const revokedToken = await prisma.tokenRevocado.findUnique({
        where: { jti },
        select: { jti: true },
    });

    return revokedToken !== null;
}

async function revoke({ jti, id_usuario, expira_en }) {
    // skipDuplicates hace que revocar dos veces el mismo token no falle
    await prisma.tokenRevocado.createMany({
        data: [{ jti, id_usuario, expira_en }],
        skipDuplicates: true,
    });
}

async function deleteExpired(now = new Date()) {
    const { count } = await prisma.tokenRevocado.deleteMany({
        where: { expira_en: { lt: now } },
    });

    return count;
}

module.exports = {
    isRevoked,
    revoke,
    deleteExpired,
};
