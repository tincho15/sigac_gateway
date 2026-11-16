-- CreateTable
CREATE TABLE "token_revocado" (
    "jti" VARCHAR(36) NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "expira_en" TIMESTAMP(3) NOT NULL,
    "revocado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_revocado_pkey" PRIMARY KEY ("jti")
);

-- CreateIndex
CREATE INDEX "token_revocado_id_usuario_idx" ON "token_revocado"("id_usuario");

-- CreateIndex
CREATE INDEX "token_revocado_expira_en_idx" ON "token_revocado"("expira_en");

-- AddForeignKey
ALTER TABLE "token_revocado" ADD CONSTRAINT "token_revocado_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

