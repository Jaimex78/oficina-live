-- CreateTable
CREATE TABLE "MapaOficina" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "estado" TEXT NOT NULL,
    "numero" INTEGER NOT NULL DEFAULT 0,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "contenido" TEXT NOT NULL,
    "nota" TEXT NOT NULL DEFAULT '',
    "autorId" INTEGER,
    "autor" TEXT NOT NULL DEFAULT '',
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "MapaOficina_estado_numero_idx" ON "MapaOficina"("estado", "numero");

