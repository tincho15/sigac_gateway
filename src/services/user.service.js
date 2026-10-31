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

module.exports = { createUser };
