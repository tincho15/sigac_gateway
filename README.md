# SIGAC Gateway

Backend inicial con Express.js y Prisma para PostgreSQL.

## Estructura

```text
src/
  config/          Configuracion compartida (Prisma)
  controllers/     Manejo de solicitudes HTTP
  repositories/    Acceso a datos
  routes/          Definicion de rutas
  services/        Logica de aplicacion
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

2. Copiar `.env.example` a `.env` y configurar `DATABASE_URL` y, opcionalmente, `PORT`.

3. Generar el cliente de Prisma:

   ```sh
   npm run prisma:generate
   ```

4. Iniciar el servidor:

   ```sh
   npm run dev
   ```

## Endpoint

- `GET /health`: comprueba que el servidor responde y que Prisma puede consultar la base de datos. Devuelve `200` si esta conectada y `503` si no lo esta.
