const { mustEnableTwoFactor } = require("../config/two-factor");

// Datos del usuario que se devuelven al iniciar sesion y en /auth/me
// (sin hash, secretos ni flags internos).
// debe_cambiar_password y debe_activar_2fa le indican al front a que pantalla
// obligatoria tiene que llevar al usuario antes de dejarlo usar el sistema.
function toAuthenticatedUser(user) {
    const { id_usuario, nombre, email, debe_cambiar_password, rol } = user;

    return {
        id_usuario,
        nombre,
        email,
        debe_cambiar_password,
        debe_activar_2fa: mustEnableTwoFactor(user),
        rol,
    };
}

module.exports = { toAuthenticatedUser };
