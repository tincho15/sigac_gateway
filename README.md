# SIGAC Gateway

Backend inicial con Express.js y Prisma para PostgreSQL.

## Estructura

```text
src/
  config/          Configuracion compartida (Prisma)
  controllers/     Manejo de solicitudes HTTP
  errors/          Errores de dominio
  repositories/    Acceso a datos
  routes/          Definicion de rutas
  services/        Logica de aplicacion
  validators/      Validacion de datos de entrada
  app.js           Configuracion de Express
  server.js        Inicio y cierre del servidor
```

Las capas de cada funcionalidad se ubican directamente en estas carpetas dentro de `src`.

## Requisitos

- Node.js 20 o superior
- PostgreSQL

## Configuracion

1. Instalar dependencias:

   ```sh
   npm install
   ```

2. Copiar `.env.example` a `.env`. Los valores por defecto sirven para la base levantada con Docker; si usas un PostgreSQL instalado localmente, ajusta `DATABASE_URL`.

3. Levantar PostgreSQL (opcional si ya tienes uno instalado; requiere Docker):

   ```sh
   npm run db:up
   ```

4. Crear las tablas y precargar los catalogos (`rol`, `tipo_solicitud`, `estado`):

   ```sh
   npm run db:setup
   ```

   `npm install` ya genera el cliente de Prisma; si cambia el schema, ejecutar `npm run prisma:generate`.

5. Iniciar el servidor:

   ```sh
   npm run dev
   ```

## Base de datos

El modelo esta en `prisma/schema.prisma` y las migraciones versionadas en `prisma/migrations`. Todos los `id` son enteros autoincrementales asignados por la base.

| Script               | Uso                                                                 |
| -------------------- | ------------------------------------------------------------------- |
| `npm run db:up`      | Levanta PostgreSQL con Docker                                       |
| `npm run db:down`    | Detiene el contenedor (los datos se conservan en el volumen)        |
| `npm run db:setup`   | Aplica las migraciones pendientes y ejecuta el seed                 |
| `npm run db:migrate` | Crea una migracion nueva despues de cambiar el schema (desarrollo)  |
| `npm run db:seed`    | Vuelve a ejecutar las precargas (no duplica datos)                  |
| `npm run db:reset`   | Borra la base, reaplica migraciones y seed                          |
| `npm run db:studio`  | Abre Prisma Studio para ver los datos                               |

Al cambiar el schema, ejecutar `npm run db:migrate -- --name descripcion_del_cambio` y commitear la carpeta generada en `prisma/migrations`. Los demas aplican el cambio con `npm run db:setup`.

## Endpoints

- `GET /health`: comprueba que el servidor responde y que Prisma puede consultar la base de datos. Devuelve `200` si esta conectada y `503` si no lo esta.
- `POST /users`: crea un usuario a partir de `email`, `nombre` e `id_rol`. Devuelve `201` con los datos del usuario y la contraseña generada, `400` si los datos son invalidos o el rol no existe y `409` si el email ya esta registrado. La contraseña se guarda hasheada con bcrypt, por lo que esta respuesta es la unica vez que puede verse en claro.
