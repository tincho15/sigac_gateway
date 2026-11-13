const userService = require("../services/user.service");
const {
  validateCreateUser,
  validateResetPassword,
} = require("../validators/user.validator");
const {
  EmailAlreadyInUseError,
  RoleNotFoundError,
  UserNotFoundError,
} = require("../errors/user.errors");
const { toResetPasswordResponse } = require("../dtos/user.dto");

async function createUser(req, res) {
  const { errors, data } = validateCreateUser(req.body);

  if (errors.length > 0) {
    return res.status(400).json({ status: "error", errors });
  }

  try {
    const user = await userService.createUser(data);
    // La respuesta incluye la contraseña en claro: no debe quedar en caches
    return res.status(201).set("Cache-Control", "no-store").json(user);
  } catch (error) {
    if (error instanceof EmailAlreadyInUseError) {
      return res.status(409).json({ status: "error", message: error.message });
    }
    if (error instanceof RoleNotFoundError) {
      return res.status(400).json({ status: "error", message: error.message });
    }

    console.error(
      "User creation failed:",
      error instanceof Error ? error.name : "Unknown error"
    );
    return res
      .status(500)
      .json({ status: "error", message: "No se pudo crear el usuario" });
  }
}

async function resetPassword(req, res) {
  const { errors, data } = validateResetPassword(req.body);

  if (errors.length > 0) {
    return res.status(400).json({ status: "error", errors });
  }

  try {
    const user = await userService.resetPassword(data);
    // La respuesta incluye la contraseña en claro: no debe quedar en caches
    return res
      .status(200)
      .set("Cache-Control", "no-store")
      .json(toResetPasswordResponse(user));
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return res.status(404).json({ status: "error", message: error.message });
    }

    console.error(
      "Password reset failed:",
      error instanceof Error ? error.name : "Unknown error"
    );
    return res
      .status(500)
      .json({ status: "error", message: "No se pudo resetear la contraseña" });
  }
}

async function listUsers(_req, res) {
  try {
    const users = await userService.listUsers();
    return res.status(200).json(users);
  } catch (error) {
    console.error(
      "User listing failed:",
      error instanceof Error ? error.name : "Unknown error"
    );
    return res
      .status(500)
      .json({ status: "error", message: "No se pudo obtener los usuarios" });
  }
}

module.exports = { createUser, resetPassword, listUsers };
