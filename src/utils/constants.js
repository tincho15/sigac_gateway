const ROLES = {
    ADMINISTRADOR: "Administrador",
    FUNCIONARIO: "Funcionario",
};

// Nombres de la tabla estado (precargados en prisma/seed.js)
const ESTADOS = {
    PENDIENTE: "Pendiente",
    EN_PROCESO: "En Proceso",
    FINALIZADA: "Finalizada",
    CANCELADA: "Cancelada",
};

module.exports = {
    ROLES,
    ESTADOS,
};
