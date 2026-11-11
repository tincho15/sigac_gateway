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
- `GET /users`: devuelve todos los usuarios con `id_usuario`, `nombre`, `email`, `activo` y `rol` (nombre del rol). Primero los activos y despues los inactivos, cada grupo ordenado alfabeticamente por nombre (sin distinguir mayusculas ni tildes).
- `POST /users`: crea un usuario a partir de `email`, `nombre` e `id_rol`. Devuelve `201` con los datos del usuario y la contraseña generada, `400` si los datos son invalidos o el rol no existe y `409` si el email ya esta registrado. La contraseña se guarda hasheada con bcrypt, por lo que esta respuesta es la unica vez que puede verse en claro.
