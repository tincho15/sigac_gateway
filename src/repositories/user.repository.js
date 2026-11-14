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

// Update directo por email: si no existe, Prisma lanza P2025 sin una consulta previa
async function updatePasswordByEmail(email, passwordHash) {
  try {
    return await prisma.usuario.update({
      where: { email },
      data: { password: passwordHash, debe_cambiar_password: true },
      omit: { password: true },
    });
  } catch (error) {
    if (error.code === RECORD_NOT_FOUND) {
      throw new UserNotFoundError();
    }
    throw error;
  }
}

async function findPasswordById(id_usuario) {
  const user = await prisma.usuario.findUnique({
    where: { id_usuario },
    select: { password: true },
  });

  return user?.password ?? null;
}

async function updatePasswordById(id_usuario, passwordHash) {
  try {
    return await prisma.usuario.update({
      where: { id_usuario },
      data: {
        password: passwordHash,
        debe_cambiar_password: false,
      },
      omit: { password: true },
    });
  } catch (error) {
    if (error.code === RECORD_NOT_FOUND) {
      throw new UserNotFoundError();
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

module.exports = {
  createUser,
  updatePasswordByEmail,
  findPasswordById,
  updatePasswordById,
  findAllUsers,
};
