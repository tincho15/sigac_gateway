const express = require("express");
const authController = require("../controllers/auth.controller");
const twoFactorController = require("../controllers/two-factor.controller");
const {
    authenticate,
    authenticateAllowingTwoFactorSetup,
} = require("../middlewares/auth.middleware");

const router = express.Router();

// Las rutas con authenticateAllowingTwoFactorSetup tambien funcionan para usuarios
// que todavia no activaron el 2FA obligatorio (las necesitan para activarlo)
router.post("/login", authController.login);
router.post("/logout", authenticateAllowingTwoFactorSetup, authController.logout);
router.get("/me", authenticateAllowingTwoFactorSetup, authController.getMe);

// Segundo paso del login (publico: se autentica con el tempToken del body)
router.post("/2fa/login", twoFactorController.verifyLogin);

// Gestion del 2FA del usuario autenticado
router.get("/2fa/status", authenticateAllowingTwoFactorSetup, twoFactorController.getStatus);
router.post("/2fa/setup", authenticateAllowingTwoFactorSetup, twoFactorController.setup);
router.post("/2fa/enable", authenticateAllowingTwoFactorSetup, twoFactorController.enable);
router.post("/2fa/disable", authenticate, twoFactorController.disable);

module.exports = router;
