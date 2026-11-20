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
- `PATCH /users/:id`: actualiza parcialmente `email`, `nombre`, `id_rol` o `activo`. Debe enviarse al menos un campo; los campos provistos se validan y el email se normaliza a minusculas. Devuelve `200` con los datos actualizados, `400` si la solicitud es invalida o el rol no existe, `404` si el usuario no existe y `409` si el email ya esta registrado. Requiere autenticacion y rol `Administrador`.

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

Si las credenciales son validas y el usuario esta activo, responde `200` con los datos del usuario y un token JWT. Si el usuario tiene activada la verificacion en dos pasos, en lugar del token responde `{ "status": "2fa_required", "tempToken": "..." }` y el login se completa en `POST /auth/2fa/login` (ver [Autenticacion de dos factores](#autenticacion-de-dos-factores-google-authenticator)). El token no se almacena en el servidor; se debe enviar en las solicitudes protegidas. El email se normaliza a minusculas. Una solicitud invalida devuelve `400` y las credenciales incorrectas o un usuario inactivo devuelven `401`.

Configura `JWT_SECRET` en el entorno del servidor con un valor secreto. `JWT_EXPIRES_IN` define la duracion del token y es opcional; si no se configura, el token vence en una hora.

Cada token incluye un identificador unico (`jti`), que se usa para poder revocarlo al cerrar sesion.

### Cierre de sesion

`POST /auth/logout` requiere `Authorization: Bearer <token>` y no recibe cuerpo. Revoca el token con el que se hace la solicitud y responde `200`:

```json
{
  "status": "success",
  "message": "Sesión cerrada"
}
```

Solo se cierra la sesion de ese token; otras sesiones del mismo usuario siguen activas. Despues del logout, cualquier solicitud con ese token responde `401`. Sin token, o con un token invalido, vencido o ya revocado, el endpoint responde `401`.

Los tokens revocados se guardan en la tabla `token_revocado` (`jti`, `id_usuario`, `expira_en`, `revocado_en`) hasta que vencen. Una vez vencido, `jwt.verify` ya rechaza el token, por lo que su fila deja de ser necesaria: cada logout borra los registros con `expira_en` anterior a la fecha actual.

### Proteccion de rutas

1. `authenticate` requiere el encabezado `Authorization: Bearer <token>`, verifica la firma y vencimiento del JWT, comprueba que el token tenga `jti` y no haya sido revocado, y vuelve a buscar al usuario en la base de datos. Si el token no es valido o fue revocado, o si el usuario no existe o esta desactivado, responde `401`. Si la verificacion es exitosa, adjunta el usuario actual a `req.user`, los datos del token (`jti`, `exp`) a `req.auth` y continua.
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

## Autenticacion de dos factores (Google Authenticator)

El JWT se complementa con un segundo factor TOTP (RFC 6238): un codigo de 6 digitos que cambia cada 30 segundos y que genera Google Authenticator (o cualquier app compatible: Microsoft Authenticator, Authy, 1Password, etc.) en el celular del usuario. **Es obligatoria**: en su primer inicio de sesion cada usuario tiene que activarla antes de poder usar el sistema. Una vez activa, la contraseña sola ya no alcanza para iniciar sesion.

### Como funciona

```text
Primer login (2FA todavia no activado)
  POST /auth/login       -> { status: "success", user: { ..., debe_activar_2fa: true }, token }
  Con ese token solo se puede usar: /auth/me, /auth/logout, /auth/2fa/status|setup|enable
  y /users/change-password. El resto de las rutas protegidas responde 403
  { code: "TWO_FACTOR_SETUP_REQUIRED" } hasta que se active el 2FA.

Activacion
  POST /auth/2fa/setup   -> el backend genera un secreto y devuelve un QR
  (el usuario escanea el QR con Google Authenticator)
  POST /auth/2fa/enable  -> el usuario envia un codigo de la app; si es valido, el 2FA queda activo
                            y el mismo token pasa a tener acceso completo
  POST /auth/2fa/setup   -> el backend genera un secreto y devuelve un QR
  (el usuario escanea el QR con Google Authenticator)
  POST /auth/2fa/enable  -> el usuario envia un codigo de la app; si es valido, el 2FA queda activo

Login con 2FA activo
  POST /auth/login       -> email + contraseña correctos => { status: "2fa_required", tempToken }
  POST /auth/2fa/login   -> tempToken + codigo de la app  => { status: "success", user, token }
```

- El secreto TOTP se guarda **cifrado** (AES-256-GCM) en `usuario.totp_secreto` con la clave `TOTP_ENCRYPTION_KEY`. Si se filtra la base, sin esa clave no se pueden generar codigos.
- El `tempToken` es un JWT de 5 minutos con una audiencia distinta a la del token de acceso: no sirve para entrar a rutas protegidas, se usa una sola vez y admite 5 codigos incorrectos; despues hay que volver a ingresar la contraseña.
- Un mismo codigo no se acepta dos veces (`usuario.totp_ultimo_paso`) y se tolera ±30 s de diferencia de reloj entre el servidor y el celular.
- Los tokens de acceso ahora llevan la audiencia `sigac:access`; los emitidos antes de esta version dejan de ser validos y hay que volver a iniciar sesion.

### 2FA obligatoria en el primer login

- El login y `GET /auth/me` devuelven `user.debe_activar_2fa`. Es `true` mientras el usuario no haya activado el 2FA (incluye a los usuarios que ya existian antes de este cambio y a los que un administrador les reseteo el 2FA).
- La regla se aplica en el backend, no solo en la pantalla: el middleware `authenticate` (`src/middlewares/auth.middleware.js`) rechaza con `403` y `code: "TWO_FACTOR_SETUP_REQUIRED"` a quien todavia no lo activo. Las rutas necesarias para activarlo usan `authenticateAllowingTwoFactorSetup`.
- Orden en el primer login de un usuario nuevo: primero cambia la contraseña temporal (`debe_cambiar_password`) y despues activa el 2FA. El frontend lo resuelve en `lib/auth/redirects.ts`: `/change-password` → `/activar-2fa` → `/solicitudes`.
- Si un usuario desactiva su 2FA desde **Seguridad**, vuelve a quedar pendiente y el sistema le pide activarlo otra vez (sirve para pasar la cuenta a un celular nuevo).
- `TWO_FACTOR_REQUIRED=false` en el `.env` lo vuelve opcional (por ejemplo en desarrollo). Por defecto es obligatoria.

Para proteger una ruta nueva no hace falta nada extra: `authenticate` ya exige el 2FA. Solo si la ruta tiene que funcionar antes de activarlo, usar `authenticateAllowingTwoFactorSetup`.

### Paso a paso: configuracion

#### Backend (este repositorio)

1. Instalar las dependencias nuevas (`otplib` y `qrcode`):

   ```sh
   npm install
   ```

2. Generar una clave de cifrado de 32 bytes:

   ```sh
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. Agregar las variables al `.env` (ver `.env.example`):

   ```env
   TOTP_ENCRYPTION_KEY=<los 64 caracteres hexadecimales del paso 2>
   TOTP_ISSUER=SIGAC
   TWO_FACTOR_TOKEN_EXPIRES_IN=5m
   TWO_FACTOR_REQUIRED=true
   ```

   `TOTP_ISSUER` es el nombre que muestra Google Authenticator junto a la cuenta, `TWO_FACTOR_TOKEN_EXPIRES_IN` la vigencia del paso intermedio y `TWO_FACTOR_REQUIRED` si la 2FA es obligatoria (`true` por defecto). Las tres son opcionales.

   > **Importante:** usar la misma `TOTP_ENCRYPTION_KEY` en todos los entornos que compartan la base y no cambiarla. Si se pierde o se cambia, los secretos guardados no se pueden descifrar y cada usuario con 2FA debera ser reseteado (`POST /users/reset-2fa`) y volver a activarlo. No commitear el `.env`.

   Con Docker, `compose.yaml` toma estas variables del `.env` y se las pasa al contenedor del backend.

4. Aplicar la migracion `20261118000000_usuario_totp`, que agrega `totp_habilitado`, `totp_secreto` y `totp_ultimo_paso` a la tabla `usuario`:

   ```sh
   npm run db:deploy
   ```

   `npm install` regenera el cliente de Prisma; si no se ejecuto, correr `npm run prisma:generate`.

5. Reiniciar el backend (`npm run dev`, o `docker compose up --build` con Docker).

#### Frontend (`sigac_front`)

1. Verificar que `BACKEND_URL` en el `.env` del frontend apunte a la URL donde escucha el backend.
2. Levantar el frontend (`npm run dev`). No hace falta instalar dependencias nuevas.

El frontend no guarda los JWT en `localStorage`: los Route Handlers de Next (`app/api/auth/...`) los guardan en cookies `httpOnly` (`sigac_session` para la sesion y `sigac_2fa` para el paso intermedio), asi el JavaScript del navegador nunca accede a ellos.

### Paso a paso: uso

#### Activar la verificacion en dos pasos (primer login)

1. Instalar **Google Authenticator** en el celular (Google Play o App Store).
2. Iniciar sesion en SIGAC. Si es un usuario nuevo, primero se pide cambiar la contraseña temporal. Despues el sistema lleva automaticamente a **Activá la verificación en dos pasos** (`/activar-2fa`) y no deja ir a otra pantalla hasta completarlo.
3. Tocar **Activar verificacion en dos pasos**. Se muestra un codigo QR y una clave de texto.
4. En Google Authenticator tocar **+** → **Escanear un codigo QR** y apuntar al QR. Si no se puede escanear, elegir **Ingresar una clave de configuracion**, escribir la clave mostrada y seleccionar **Basada en el tiempo**.
5. La app agrega la cuenta `SIGAC (email)` y muestra un codigo de 6 digitos. Escribirlo en el campo y tocar **Confirmar y activar**.
6. El 2FA queda activo y el sistema redirige a la pantalla de inicio. Desde ese momento el login pide el codigo de la app.

El estado se puede consultar despues en **Seguridad**, en el menu lateral (`/cuenta/seguridad`).

#### Iniciar sesion con 2FA

1. Ingresar email y contraseña como siempre.
2. El formulario pasa a **Verificacion en dos pasos**: abrir Google Authenticator y escribir el codigo actual de la cuenta SIGAC.
3. Si el codigo vence mientras se escribe, usar el siguiente. Tras 5 codigos incorrectos o 5 minutos hay que volver a ingresar la contraseña.

#### Desactivar la verificacion en dos pasos

En **Seguridad**, ingresar la contraseña y un codigo actual de la app y tocar **Desactivar verificacion en dos pasos**. Se piden ambos para que alguien con una sesion abierta ajena no pueda quitarla. Como la 2FA es obligatoria, despues de desactivarla el sistema pide activarla de nuevo; se usa para pasar la cuenta a otro celular.

#### Perdida del celular

Si el usuario ya no tiene acceso a la app, un administrador puede desactivarle el 2FA:

```http
POST /users/reset-2fa
Authorization: Bearer <token de un Administrador>
Content-Type: application/json

{ "email": "usuario@example.com" }
```

En el proximo login el usuario entra con la contraseña y el sistema le exige activar el 2FA con su nuevo celular.

### Endpoints

| Metodo y ruta            | Autenticacion          | Body                  | Respuestas                                                                                                               |
| ------------------------ | ---------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `POST /auth/login`       | Publica                | `{ email, password }` | `200` `{ status: "success", user, token }` (`user.debe_activar_2fa` indica si falta activarlo) o `{ status: "2fa_required", tempToken }`; `401` credenciales invalidas |
| `POST /auth/2fa/login`   | Publica (tempToken)    | `{ tempToken, code }` | `200` `{ status: "success", user, token }`; `401` codigo incorrecto o tempToken vencido/usado; `429` demasiados intentos |
| `GET /auth/2fa/status`   | Bearer                 | -                     | `200` `{ status: "success", enabled }`                                                                                   |
| `POST /auth/2fa/setup`   | Bearer                 | -                     | `200` `{ secret, otpauthUrl, qrCode }` (`qrCode` es un data URL PNG); `409` si ya esta activo                            |
| `POST /auth/2fa/enable`  | Bearer                 | `{ code }`            | `200` `{ enabled: true }`; `400` codigo incorrecto o sin `setup` previo; `409` si ya esta activo                         |
| `POST /auth/2fa/disable` | Bearer                 | `{ password, code }`  | `200` `{ enabled: false }`; `400` contraseña o codigo incorrectos, o 2FA no activo                                       |
| `POST /users/reset-2fa`  | Bearer + Administrador | `{ email }`           | `200` `{ email, totp_habilitado: false }`; `404` si el usuario no existe                                                 |

`GET /auth/2fa/status`, `setup` y `enable` funcionan aunque el 2FA todavia no este activo. Cualquier otra ruta protegida responde `403` `{ code: "TWO_FACTOR_SETUP_REQUIRED" }` en ese caso, incluido `POST /auth/2fa/disable`.

`code` acepta 6 digitos con o sin espacio (`"123456"` o `"123 456"`). En las rutas autenticadas un codigo incorrecto responde `400` (no `401`) para no confundirse con un token de acceso vencido.

### Probar con curl

Los ejemplos usan el puerto por defecto del backend (`3000`); ajustarlo si se configuro otro.

```sh
# 1. Login (todavia sin 2FA): copiar el "token" de la respuesta
curl -s -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" \
  -d '{"email":"usuario@example.com","password":"<contraseña>"}'

# 2. Generar el QR: pegar el valor de "qrCode" en la barra del navegador y escanearlo, o cargar "secret" a mano
curl -s -X POST http://localhost:3000/auth/2fa/setup -H "Authorization: Bearer <token>"

# 3. Confirmar con el codigo que muestra la app
curl -s -X POST http://localhost:3000/auth/2fa/enable -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" -d '{"code":"123456"}'

# 4. Repetir el paso 1: ahora responde "2fa_required" con un "tempToken"

# 5. Completar el login con el codigo actual de la app
curl -s -X POST http://localhost:3000/auth/2fa/login -H "Content-Type: application/json" \
  -d '{"tempToken":"<tempToken>","code":"654321"}'
```

### Archivos involucrados

- `src/services/totp.service.js`: genera el secreto, la URI `otpauth://`, el QR y verifica codigos (`otplib`, `qrcode`).
- `src/services/crypto.service.js`: cifra y descifra el secreto con `TOTP_ENCRYPTION_KEY`.
- `src/services/two-factor.service.js`: activacion, desactivacion, login en dos pasos, limite de intentos y reseteo administrativo.
- `src/services/token.service.js`: token de acceso (`sigac:access`) y token intermedio de 2FA (`sigac:2fa`).
- `src/config/two-factor.js` y `src/middlewares/auth.middleware.js`: 2FA obligatoria (`TWO_FACTOR_REQUIRED`) y bloqueo de rutas hasta activarla.
- `src/controllers/two-factor.controller.js`, `src/validators/two-factor.validator.js`, `src/repositories/two-factor.repository.js`, `src/errors/two-factor.errors.js`.

### Limitaciones conocidas

- El contador de intentos fallidos del paso intermedio vive en memoria: funciona con una sola instancia del backend. Si se escalan varias replicas, hay que moverlo a Redis o a la base.
- Mientras el 2FA no esta activo, el token del primer login sirve para activarlo con solo la contraseña. Si alguien conoce la contraseña de un usuario que todavia no lo activo, podria registrar su propio celular; por eso conviene que cada usuario lo active apenas recibe su cuenta.
