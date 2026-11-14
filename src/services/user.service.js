const userRepository = require("../repositories/user.repository");
const passwordService = require("./password.service");

async function createUser({ email, nombre, id_rol }) {
  const { password, hash } = await passwordService.createPassword();
  const user = await userRepository.createUser({
    email,
    nombre,
    id_rol,
    password: hash,
  });

  return { ...user, password };
}

// El orden se resuelve aca y no en la base: la collation de postgres:16-alpine
// compara por bytes, lo que ubica mayusculas antes que minusculas y deja los
// nombres con tilde al final
const nameCollator = new Intl.Collator("es", { sensitivity: "base" });

function compareUsers(a, b) {
  if (a.activo !== b.activo) {
    return a.activo ? -1 : 1;
  }
  return nameCollator.compare(a.nombre, b.nombre);
}

async function listUsers() {
  const users = await userRepository.findAllUsers();

  return users.sort(compareUsers).map((user) => ({
    id_usuario: user.id_usuario,
    nombre: user.nombre,
    email: user.email,
    activo: user.activo,
    rol: user.rol.nombre,
  }));
}

module.exports = { createUser, listUsers };
