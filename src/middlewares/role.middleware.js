function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {

        // Verificar que exista un usuario autenticado
        if (!req.user) {
            return res.status(401).json({
                error: "Se requiere autenticación",
            });
        }

        // Obtener el rol del usuario
        const userRole = req.user.rol.nombre;

        // Comprobar si tiene autorización
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                error: "No tenés permisos para realizar esta operación",
            });
        }

        // El usuario está autorizado
        next();
    };
}

module.exports = { authorizeRoles };