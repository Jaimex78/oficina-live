-- Las cuentas que ya existían ya tienen su personaje: solo las nuevas pasan por el creador la primera vez.
ALTER TABLE "Usuario" ADD COLUMN "personajeListo" BOOLEAN NOT NULL DEFAULT false;
UPDATE "Usuario" SET "personajeListo" = true;
