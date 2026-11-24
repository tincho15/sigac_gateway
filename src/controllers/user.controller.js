const userService = require("../services/user.service");
const twoFactorService = require("../services/two-factor.service");
const {
  validateCreateUser,
  validateUpdateUser,
  validateResetPassword,
  validateChangePassword,
} = require("../validators/user.validator");
const {
  EmailAlreadyInUseError,
  RoleNotFoundError,
  UserNotFoundError,
  InvalidCurrentPasswordError,
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

async function changePassword(req, res) {
  const { errors, data } = validateChangePassword(req.body);

  if (errors.length > 0) {
    return res.status(400).json({ status: "error", errors });
  }

  try {
    await userService.changePassword({
      ...data,
      id_usuario: req.user.id_usuario,
      debe_cambiar_password: req.user.debe_cambiar_password,
    });

    return res.status(200).json({
      status: "success",
      message: "La contraseña se cambió correctamente",
    });
  } catch (error) {
    if (error instanceof InvalidCurrentPasswordError) {
      return res.status(400).json({
        status: "error",
        message: error.message,
      });
    }

    if (error instanceof UserNotFoundError) {
      return res.status(404).json({
        status: "error",
        message: error.message,
      });
    }

    console.error(
      "Password change failed:",
      error instanceof Error ? error.name : "Unknown error"
    );

    return res.status(500).json({
      status: "error",
      message: "No se pudo cambiar la contraseña",
    });
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

async function updateUser(req, res) {
  const { errors, data } = validateUpdateUser(req.params.id, req.body);

  if (errors.length > 0) {
    return res.status(400).json({ status: "error", errors });
  }

  try {
    const user = await userService.updateUser(data);
    return res.status(200).json(user);
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return res.status(404).json({ status: "error", message: error.message });
    }
    if (error instanceof EmailAlreadyInUseError) {
      return res.status(409).json({ status: "error", message: error.message });
    }
    if (error instanceof RoleNotFoundError) {
      return res.status(400).json({ status: "error", message: error.message });
    }

    console.error(
      "User update failed:",
      error instanceof Error ? error.name : "Unknown error"
    );
    return res
      .status(500)
      .json({ status: "error", message: "No se pudo actualizar el usuario" });
  }
}

// Desactiva el 2FA de un usuario que perdio acceso a su app autenticadora
async function resetTwoFactor(req, res) {
  const { errors, data } = validateResetPassword(req.body);

  if (errors.length > 0) {
    return res.status(400).json({ status: "error", errors });
  }

  try {
    const user = await twoFactorService.resetByEmail(data.email);
    return res.status(200).json({ email: user.email, totp_habilitado: false });
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return res.status(404).json({ status: "error", message: error.message });
    }

    console.error(
      "Two-factor reset failed:",
      error instanceof Error ? error.name : "Unknown error"
    );
    return res
      .status(500)
      .json({ status: "error", message: "No se pudo resetear el 2FA" });
  }
}

module.exports = {
  createUser,
  listUsers,
  updateUser,
  resetPassword,
  changePassword,
  resetTwoFactor,
};
