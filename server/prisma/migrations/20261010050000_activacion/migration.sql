-- Cuentas pendientes de activación: se crean sin contraseña y la persona la crea con un enlace de un solo uso.
-- Del enlace solo se guarda su huella SHA-256 y su vencimiento.
ALTER TABLE "Usuario" ADD COLUMN "pendiente" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Usuario" ADD COLUMN "enlaceHash" TEXT;
ALTER TABLE "Usuario" ADD COLUMN "enlaceVence" DATETIME;
CREATE UNIQUE INDEX "Usuario_enlaceHash_key" ON "Usuario"("enlaceHash");
