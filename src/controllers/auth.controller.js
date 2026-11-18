
const authService = require("../services/auth.service");
const { validateLogin } = require("../validators/auth.validator");
const { InvalidCredentialsError } = require("../services/auth.service");

async function login(req, res) {
    const { errors, data } = validateLogin(req.body);

    if (errors.length > 0) {
        return res.status(400).json({
            status: "error",
            errors,
        });
    }

    try {
        const result = await authService.login(data);

        return res
            .status(200)
            .set("Cache-Control", "no-store")
            .json({
                status: "success",
                user: result.user,
                token: result.token,
            });
    } catch (error) {
        if (error instanceof InvalidCredentialsError) {
            return res.status(401).json({
                status: "error",
                message: error.message,
            });
        }

        console.error(
            "Login failed:",
            error instanceof Error ? error.name : "Unknown error"
        );

        return res.status(500).json({
            status: "error",
            message: "No se pudo iniciar sesión",
        });
    }
}

async function logout(req, res) {
    try {
        await authService.logout({
            jti: req.auth.jti,
            exp: req.auth.exp,
            id_usuario: req.user.id_usuario,
        });

        return res
            .status(200)
            .set("Cache-Control", "no-store")
            .json({
                status: "success",
                message: "Sesión cerrada",
            });
    } catch (error) {
        console.error(
            "Logout failed:",
            error instanceof Error ? error.name : "Unknown error"
        );

        return res.status(500).json({
            status: "error",
            message: "No se pudo cerrar la sesión",
        });
    }
}

function getMe(req, res) {
    return res
        .status(200)
        .set("Cache-Control", "no-store")
        .json({
            status: "success",
            user: {
                id_usuario: req.user.id_usuario,
                nombre: req.user.nombre,
                email: req.user.email,
                debe_cambiar_password: req.user.debe_cambiar_password,
                rol: req.user.rol,
            },
        });
}

module.exports = { login, logout, getMe };
