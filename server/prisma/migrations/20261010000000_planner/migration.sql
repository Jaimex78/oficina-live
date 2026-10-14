-- CreateTable
CREATE TABLE "PlannerColumna" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#8E8E93',
    "orden" INTEGER NOT NULL DEFAULT 0,
    "esFinal" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "PlannerCampo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'lista',
    "semaforo" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "PlannerOpcion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "campoId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#8E8E93',
    "orden" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "PlannerOpcion_campoId_fkey" FOREIGN KEY ("campoId") REFERENCES "PlannerCampo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlannerTarea" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL DEFAULT '',
    "columnaId" INTEGER NOT NULL,
    "responsableId" INTEGER,
    "fechaLimite" DATETIME,
    "valores" TEXT NOT NULL DEFAULT '{}',
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creadaPorId" INTEGER,
    "creadaPor" TEXT NOT NULL DEFAULT '',
    "creadaEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadaEn" DATETIME NOT NULL,
    "completadaEn" DATETIME,
    CONSTRAINT "PlannerTarea_columnaId_fkey" FOREIGN KEY ("columnaId") REFERENCES "PlannerColumna" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PlannerOpcion_campoId_idx" ON "PlannerOpcion"("campoId");

-- CreateIndex
CREATE INDEX "PlannerTarea_columnaId_orden_idx" ON "PlannerTarea"("columnaId", "orden");
