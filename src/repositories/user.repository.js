const prisma = require("../config/prisma");
const {
  EmailAlreadyInUseError,
  RoleNotFoundError,
} = require("../errors/user.errors");

const UNIQUE_CONSTRAINT_VIOLATION = "P2002";
const FOREIGN_KEY_VIOLATION = "P2003";

// Se delega en las restricciones de la base para evitar carreras entre consulta e insercion
async function createUser(user) {
  try {
    return await prisma.usuario.create({
      data: user,
      omit: { password: true },
    });
  } catch (error) {
    if (error.code === UNIQUE_CONSTRAINT_VIOLATION) {
      throw new EmailAlreadyInUseError();
    }
    if (error.code === FOREIGN_KEY_VIOLATION) {
      throw new RoleNotFoundError();
    }
    throw error;
  }
}

module.exports = { createUser };
