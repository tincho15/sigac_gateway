# SIGAC Gateway

Backend inicial con Express.js y Prisma para PostgreSQL.

## Estructura

```text
Dockerfile        Imagen del backend
compose.yaml      Servicios del backend y PostgreSQL
.dockerignore     Archivos excluidos del contexto de Docker
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

2. Copiar `.env.example` a `.env` y configurar `DATABASE_URL` para que Prisma pueda conectarse desde el entorno local. Por ejemplo:

   ```env
   DATABASE_URL="postgresql://sigac_user:postgres@localhost:5432/sigac?schema=public"
   ```

3. Levantar PostgreSQL (opcional si ya tienes uno instalado; requiere Docker):

   ```sh
   docker compose up -d db
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

## Docker

La configuracion de Docker incluye:

- `Dockerfile`: construye la imagen del backend con Node.js 24, instala las dependencias, genera el cliente de Prisma y expone el puerto `3000`.
- `compose.yaml`: define el backend y PostgreSQL 17 Alpine. El backend espera a que la base de datos pase su comprobacion de salud.
- `.dockerignore`: excluye dependencias locales, archivos de Git y `.env` de la imagen.

Para construir y levantar ambos servicios:

```sh
docker compose up --build
```

Compose usa los valores predeterminados de `.env.example` para la base de datos (`sigac_user`, `postgres`, `sigac`) y expone el backend en `http://localhost:3000` y PostgreSQL en `localhost:5432`. Los datos de PostgreSQL se guardan en el volumen `sigac_db_data`. Si un puerto ya esta ocupado, se puede cambiar con `BACKEND_PORT` o `POSTGRES_PORT` en `.env`.

El contenedor del backend no ejecuta las migraciones ni el seed automaticamente. Con los servicios levantados y `DATABASE_URL` configurada para `localhost`, ejecuta:

```sh
npm run db:setup
```

Para detener los servicios sin borrar los datos:

```sh
docker compose down
```

## Base de datos

El modelo esta en `prisma/schema.prisma` y las migraciones versionadas en `prisma/migrations`. Todos los `id` son enteros autoincrementales asignados por la base.

| Script               | Uso                                                                 |
| -------------------- | ------------------------------------------------------------------- |
| `npm run db:up`      | Levanta el backend y PostgreSQL con Docker Compose                  |
| `npm run db:down`    | Detiene los servicios (los datos se conservan en el volumen)        |
| `npm run db:setup`   | Aplica las migraciones pendientes y ejecuta el seed                 |
| `npm run db:migrate` | Crea una migracion nueva despues de cambiar el schema (desarrollo)  |
| `npm run db:seed`    | Vuelve a ejecutar las precargas (no duplica datos)                  |
| `npm run db:reset`   | Borra la base, reaplica migraciones y seed                          |
| `npm run db:studio`  | Abre Prisma Studio para ver los datos                               |

Al cambiar el schema, ejecutar `npm run db:migrate -- --name descripcion_del_cambio` y commitear la carpeta generada en `prisma/migrations`. Los demas aplican el cambio con `npm run db:setup`.

## Endpoints

- `GET /health`: comprueba que el servidor responde y que Prisma puede consultar la base de datos. Devuelve `200` si esta conectada y `503` si no lo esta.
- `POST /users`: crea un usuario a partir de `email`, `nombre` e `id_rol`. Devuelve `201` con los datos del usuario y la contraseña generada, `400` si los datos son invalidos o el rol no existe y `409` si el email ya esta registrado. La contraseña se guarda hasheada con bcrypt, por lo que esta respuesta es la unica vez que puede verse en claro.

## Autenticacion y control de roles

La autenticacion se realiza con tokens JWT y los permisos se verifican mediante los middlewares `authenticate` y `authorizeRoles`.

### Inicio de sesion

`POST /auth/login` es publico. Recibe las credenciales en formato JSON:

```json
{
  "email": "usuario@example.com",
  "password": "contraseña"
}
```

Si las credenciales son validas y el usuario esta activo, responde `200` con los datos del usuario y un token JWT. El token no se almacena en el servidor; se debe enviar en las solicitudes protegidas. El email se normaliza a minusculas. Una solicitud invalida devuelve `400` y las credenciales incorrectas o un usuario inactivo devuelven `401`.

Configura `JWT_SECRET` en el entorno del servidor con un valor secreto. `JWT_EXPIRES_IN` define la duracion del token y es opcional; si no se configura, el token vence en una hora.

### Proteccion de rutas

1. `authenticate` requiere el encabezado `Authorization: Bearer <token>`, verifica la firma y vencimiento del JWT y vuelve a buscar al usuario en la base de datos. Si el token no es valido, el usuario no existe o esta desactivado, responde `401`. Si la verificacion es exitosa, adjunta el usuario actual a `req.user` y continua.
2. `authorizeRoles(...rolesPermitidos)` debe ejecutarse despues de `authenticate`. Comprueba el nombre del rol de `req.user`; si el usuario no esta autenticado responde `401` y si su rol no esta permitido responde `403`.

Por ejemplo, `POST /users` requiere un token valido y el rol `Administrador`. Para permitir mas de un rol, se pueden indicar varios nombres, por ejemplo `authorizeRoles("Administrador", "Funcionario")`. Los roles iniciales precargados son `Administrador` y `Funcionario`.

Ejemplo de solicitud a una ruta protegida:

```http
POST /users
Authorization: Bearer <token>
Content-Type: application/json
```

Al agregar proteccion a otra ruta, importa ambos middlewares y colocalos antes del controlador:

```js
router.post("/", authenticate, authorizeRoles("Administrador"), controller);
```
