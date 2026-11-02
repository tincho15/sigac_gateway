-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "rol" (
    "id_rol" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "descripcion" VARCHAR(255),

    CONSTRAINT "rol_pkey" PRIMARY KEY ("id_rol")
);

-- CreateTable
CREATE TABLE "tipo_solicitud" (
    "id_tipo" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "descripcion" VARCHAR(255),

    CONSTRAINT "tipo_solicitud_pkey" PRIMARY KEY ("id_tipo")
);

-- CreateTable
CREATE TABLE "estado" (
    "id_estado" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,

    CONSTRAINT "estado_pkey" PRIMARY KEY ("id_estado")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id_usuario" SERIAL NOT NULL,
    "id_rol" INTEGER NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "juzgado" (
    "id_juzgado" SERIAL NOT NULL,
    "numero" VARCHAR(20) NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,

    CONSTRAINT "juzgado_pkey" PRIMARY KEY ("id_juzgado")
);

-- CreateTable
CREATE TABLE "ubicacion" (
    "id_ubicacion" SERIAL NOT NULL,
    "piso" VARCHAR(20) NOT NULL,
    "nro_estanteria" VARCHAR(20) NOT NULL,
    "anio" VARCHAR(10) NOT NULL,
    "id_juzgado" INTEGER NOT NULL,

    CONSTRAINT "ubicacion_pkey" PRIMARY KEY ("id_ubicacion")
);

-- CreateTable
CREATE TABLE "expediente" (
    "id_expediente" SERIAL NOT NULL,
    "iue" VARCHAR(50) NOT NULL,
    "numero" VARCHAR(50),
    "ficha" VARCHAR(50),
    "nro_archivo" VARCHAR(50),
    "id_juzgado" INTEGER NOT NULL,
    "id_ubicacion" INTEGER,

    CONSTRAINT "expediente_pkey" PRIMARY KEY ("id_expediente")
);

-- CreateTable
CREATE TABLE "email_recibido" (
    "id_email" SERIAL NOT NULL,
    "id_externo" VARCHAR(255) NOT NULL,
    "remitente" VARCHAR(255) NOT NULL,
    "asunto" VARCHAR(500),
    "fecha_recepcion" TIMESTAMP(3) NOT NULL,
    "estado_procesamiento" VARCHAR(50) NOT NULL,

    CONSTRAINT "email_recibido_pkey" PRIMARY KEY ("id_email")
);

-- CreateTable
CREATE TABLE "solicitud" (
    "id_solicitud" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "origen" VARCHAR(50) NOT NULL,
    "observaciones" TEXT,
    "id_usuario" INTEGER,
    "id_tipo" INTEGER NOT NULL,
    "id_estado" INTEGER NOT NULL,
    "id_email" INTEGER,

    CONSTRAINT "solicitud_pkey" PRIMARY KEY ("id_solicitud")
);

-- CreateTable
CREATE TABLE "documento" (
    "id_documento" SERIAL NOT NULL,
    "tipo_documento" VARCHAR(50) NOT NULL,
    "datos_extraidos" TEXT,
    "confianza_ocr" VARCHAR(20),
    "fecha_procesamiento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_solicitud" INTEGER NOT NULL,
    "id_usuario" INTEGER,

    CONSTRAINT "documento_pkey" PRIMARY KEY ("id_documento")
);

-- CreateTable
CREATE TABLE "historial_solicitud" (
    "id_historial" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accion" VARCHAR(100) NOT NULL,
    "detalle" TEXT,
    "id_solicitud" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,

    CONSTRAINT "historial_solicitud_pkey" PRIMARY KEY ("id_historial")
);

-- CreateTable
CREATE TABLE "solicitud_expediente" (
    "id_solicitud" INTEGER NOT NULL,
    "id_expediente" INTEGER NOT NULL,
    "id_estado" INTEGER NOT NULL,
    "observaciones" TEXT,
    "fecha_inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_fin" TIMESTAMP(3),

    CONSTRAINT "solicitud_expediente_pkey" PRIMARY KEY ("id_solicitud","id_expediente")
);

-- CreateTable
CREATE TABLE "asignacion" (
    "id_asignacion" SERIAL NOT NULL,
    "fecha_asignacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_fin" TIMESTAMP(3),
    "id_solicitud" INTEGER NOT NULL,
    "id_expediente" INTEGER NOT NULL,
    "id_asignado" INTEGER NOT NULL,
    "id_asignador" INTEGER NOT NULL,

    CONSTRAINT "asignacion_pkey" PRIMARY KEY ("id_asignacion")
);

-- CreateTable
CREATE TABLE "historial_expediente" (
    "id_historial" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accion" VARCHAR(100) NOT NULL,
    "detalle" TEXT,
    "id_solicitud" INTEGER NOT NULL,
    "id_expediente" INTEGER NOT NULL,
    "id_estado" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,

    CONSTRAINT "historial_expediente_pkey" PRIMARY KEY ("id_historial")
);

-- CreateTable
CREATE TABLE "transferencia" (
    "id_transferencia" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_receptor" VARCHAR(150) NOT NULL,
    "observaciones" TEXT,
    "id_juzgado" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,

    CONSTRAINT "transferencia_pkey" PRIMARY KEY ("id_transferencia")
);

-- CreateTable
CREATE TABLE "transferencia_expediente" (
    "id_transferencia" INTEGER NOT NULL,
    "id_expediente" INTEGER NOT NULL,
    "observaciones" TEXT,

    CONSTRAINT "transferencia_expediente_pkey" PRIMARY KEY ("id_transferencia","id_expediente")
);

-- CreateIndex
CREATE UNIQUE INDEX "rol_nombre_key" ON "rol"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "tipo_solicitud_nombre_key" ON "tipo_solicitud"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "estado_nombre_key" ON "estado"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE INDEX "usuario_id_rol_idx" ON "usuario"("id_rol");

-- CreateIndex
CREATE INDEX "ubicacion_id_juzgado_idx" ON "ubicacion"("id_juzgado");

-- CreateIndex
CREATE UNIQUE INDEX "expediente_iue_key" ON "expediente"("iue");

-- CreateIndex
CREATE INDEX "expediente_id_juzgado_idx" ON "expediente"("id_juzgado");

-- CreateIndex
CREATE INDEX "expediente_id_ubicacion_idx" ON "expediente"("id_ubicacion");

-- CreateIndex
CREATE UNIQUE INDEX "email_recibido_id_externo_key" ON "email_recibido"("id_externo");

-- CreateIndex
CREATE UNIQUE INDEX "solicitud_id_email_key" ON "solicitud"("id_email");

-- CreateIndex
CREATE INDEX "solicitud_id_usuario_idx" ON "solicitud"("id_usuario");

-- CreateIndex
CREATE INDEX "solicitud_id_tipo_idx" ON "solicitud"("id_tipo");

-- CreateIndex
CREATE INDEX "solicitud_id_estado_idx" ON "solicitud"("id_estado");

-- CreateIndex
CREATE INDEX "documento_id_solicitud_idx" ON "documento"("id_solicitud");

-- CreateIndex
CREATE INDEX "documento_id_usuario_idx" ON "documento"("id_usuario");

-- CreateIndex
CREATE INDEX "historial_solicitud_id_solicitud_idx" ON "historial_solicitud"("id_solicitud");

-- CreateIndex
CREATE INDEX "historial_solicitud_id_usuario_idx" ON "historial_solicitud"("id_usuario");

-- CreateIndex
CREATE INDEX "solicitud_expediente_id_expediente_idx" ON "solicitud_expediente"("id_expediente");

-- CreateIndex
CREATE INDEX "solicitud_expediente_id_estado_idx" ON "solicitud_expediente"("id_estado");

-- CreateIndex
CREATE INDEX "asignacion_id_solicitud_id_expediente_idx" ON "asignacion"("id_solicitud", "id_expediente");

-- CreateIndex
CREATE INDEX "asignacion_id_asignado_idx" ON "asignacion"("id_asignado");

-- CreateIndex
CREATE INDEX "asignacion_id_asignador_idx" ON "asignacion"("id_asignador");

-- CreateIndex
CREATE INDEX "historial_expediente_id_solicitud_id_expediente_idx" ON "historial_expediente"("id_solicitud", "id_expediente");

-- CreateIndex
CREATE INDEX "historial_expediente_id_estado_idx" ON "historial_expediente"("id_estado");

-- CreateIndex
CREATE INDEX "historial_expediente_id_usuario_idx" ON "historial_expediente"("id_usuario");

-- CreateIndex
CREATE INDEX "transferencia_id_juzgado_idx" ON "transferencia"("id_juzgado");

-- CreateIndex
CREATE INDEX "transferencia_id_usuario_idx" ON "transferencia"("id_usuario");

-- CreateIndex
CREATE INDEX "transferencia_expediente_id_expediente_idx" ON "transferencia_expediente"("id_expediente");

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "rol"("id_rol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ubicacion" ADD CONSTRAINT "ubicacion_id_juzgado_fkey" FOREIGN KEY ("id_juzgado") REFERENCES "juzgado"("id_juzgado") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expediente" ADD CONSTRAINT "expediente_id_juzgado_fkey" FOREIGN KEY ("id_juzgado") REFERENCES "juzgado"("id_juzgado") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expediente" ADD CONSTRAINT "expediente_id_ubicacion_fkey" FOREIGN KEY ("id_ubicacion") REFERENCES "ubicacion"("id_ubicacion") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud" ADD CONSTRAINT "solicitud_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud" ADD CONSTRAINT "solicitud_id_tipo_fkey" FOREIGN KEY ("id_tipo") REFERENCES "tipo_solicitud"("id_tipo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud" ADD CONSTRAINT "solicitud_id_estado_fkey" FOREIGN KEY ("id_estado") REFERENCES "estado"("id_estado") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud" ADD CONSTRAINT "solicitud_id_email_fkey" FOREIGN KEY ("id_email") REFERENCES "email_recibido"("id_email") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documento" ADD CONSTRAINT "documento_id_solicitud_fkey" FOREIGN KEY ("id_solicitud") REFERENCES "solicitud"("id_solicitud") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documento" ADD CONSTRAINT "documento_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_solicitud" ADD CONSTRAINT "historial_solicitud_id_solicitud_fkey" FOREIGN KEY ("id_solicitud") REFERENCES "solicitud"("id_solicitud") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_solicitud" ADD CONSTRAINT "historial_solicitud_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_expediente" ADD CONSTRAINT "solicitud_expediente_id_solicitud_fkey" FOREIGN KEY ("id_solicitud") REFERENCES "solicitud"("id_solicitud") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_expediente" ADD CONSTRAINT "solicitud_expediente_id_expediente_fkey" FOREIGN KEY ("id_expediente") REFERENCES "expediente"("id_expediente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_expediente" ADD CONSTRAINT "solicitud_expediente_id_estado_fkey" FOREIGN KEY ("id_estado") REFERENCES "estado"("id_estado") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignacion" ADD CONSTRAINT "asignacion_id_solicitud_id_expediente_fkey" FOREIGN KEY ("id_solicitud", "id_expediente") REFERENCES "solicitud_expediente"("id_solicitud", "id_expediente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignacion" ADD CONSTRAINT "asignacion_id_asignado_fkey" FOREIGN KEY ("id_asignado") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignacion" ADD CONSTRAINT "asignacion_id_asignador_fkey" FOREIGN KEY ("id_asignador") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_expediente" ADD CONSTRAINT "historial_expediente_id_solicitud_id_expediente_fkey" FOREIGN KEY ("id_solicitud", "id_expediente") REFERENCES "solicitud_expediente"("id_solicitud", "id_expediente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_expediente" ADD CONSTRAINT "historial_expediente_id_estado_fkey" FOREIGN KEY ("id_estado") REFERENCES "estado"("id_estado") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_expediente" ADD CONSTRAINT "historial_expediente_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia" ADD CONSTRAINT "transferencia_id_juzgado_fkey" FOREIGN KEY ("id_juzgado") REFERENCES "juzgado"("id_juzgado") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia" ADD CONSTRAINT "transferencia_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia_expediente" ADD CONSTRAINT "transferencia_expediente_id_transferencia_fkey" FOREIGN KEY ("id_transferencia") REFERENCES "transferencia"("id_transferencia") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia_expediente" ADD CONSTRAINT "transferencia_expediente_id_expediente_fkey" FOREIGN KEY ("id_expediente") REFERENCES "expediente"("id_expediente") ON DELETE RESTRICT ON UPDATE CASCADE;

