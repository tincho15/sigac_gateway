-- AlterTable
ALTER TABLE "usuario" ADD COLUMN "totp_habilitado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "totp_secreto" VARCHAR(255),
ADD COLUMN "totp_ultimo_paso" INTEGER;
