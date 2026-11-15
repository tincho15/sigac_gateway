const prisma = require("../config/prisma");
const {
  EmailAlreadyInUseError,
  RoleNotFoundError,
  UserNotFoundError,
} = require("../errors/user.errors");

const UNIQUE_CONSTRAINT_VIOLATION = "P2002";
const FOREIGN_KEY_VIOLATION = "P2003";
const RECORD_NOT_FOUND = "P2025";

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

async function findAllUsers() {
  return prisma.usuario.findMany({
    select: {
      id_usuario: true,
      nombre: true,
      email: true,
      activo: true,
      rol: { select: { nombre: true } },
    },
  });
}

async function updateUser(id_usuario, updates) {
  try {
    return await prisma.usuario.update({
      where: { id_usuario },
      data: updates,
      select: {
        id_usuario: true,
        nombre: true,
        email: true,
        activo: true,
        rol: { select: { nombre: true } },
      },
    });
  } catch (error) {
    if (error.code === UNIQUE_CONSTRAINT_VIOLATION) {
      throw new EmailAlreadyInUseError();
    }
    if (error.code === FOREIGN_KEY_VIOLATION) {
      throw new RoleNotFoundError();
    }
    if (error.code === RECORD_NOT_FOUND) {
      throw new UserNotFoundError();
    }
    throw error;
  }
}

module.exports = { createUser, findAllUsers, updateUser };
