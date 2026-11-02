const userService = require("../services/user.service");
const { validateCreateUser } = require("../validators/user.validator");
const {
  EmailAlreadyInUseError,
  RoleNotFoundError,
} = require("../errors/user.errors");

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

module.exports = { createUser };
