-- DropForeignKey
ALTER TABLE "asignacion" DROP CONSTRAINT "asignacion_id_solicitud_id_expediente_fkey";

-- DropIndex
DROP INDEX "asignacion_id_solicitud_id_expediente_idx";

-- AlterTable
ALTER TABLE "expediente" ALTER COLUMN "iue" DROP NOT NULL;

-- AlterTable
ALTER TABLE "asignacion" DROP COLUMN "id_expediente";

-- CreateIndex
CREATE INDEX "asignacion_id_solicitud_idx" ON "asignacion"("id_solicitud");

-- AddForeignKey
ALTER TABLE "asignacion" ADD CONSTRAINT "asignacion_id_solicitud_fkey" FOREIGN KEY ("id_solicitud") REFERENCES "solicitud"("id_solicitud") ON DELETE RESTRICT ON UPDATE CASCADE;
