-- Foto de perfil: el archivo vive en la carpeta de datos (fotos/), aquí solo su nombre y un contador de versión.
ALTER TABLE "Usuario" ADD COLUMN "fotoArchivo" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Usuario" ADD COLUMN "fotoVersion" INTEGER NOT NULL DEFAULT 0;
