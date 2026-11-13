const { randomInt } = require("node:crypto");
const bcrypt = require("bcryptjs");

const PASSWORD_LENGTH = 8;
const SALT_ROUNDS = 10;
// Sin caracteres ambiguos (0, O, 1, l, I): la contraseña se transmite a mano al usuario
const PASSWORD_ALPHABET =
  "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generatePassword() {
  let password = "";

  for (let i = 0; i < PASSWORD_LENGTH; i++) {
    password += PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)];
  }

  return password;
}

async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Devuelve la contraseña en claro (se muestra una unica vez) y su hash (se persiste)
async function createPassword() {
  const password = generatePassword();
  const hash = await hashPassword(password);

  return { password, hash };
}

async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

module.exports = { generatePassword, hashPassword, createPassword, comparePassword };
