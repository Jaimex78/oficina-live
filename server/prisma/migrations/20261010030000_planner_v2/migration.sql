-- Planner con varios tableros, subtareas, comentarios y notificaciones.

CREATE TABLE "PlannerTablero" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "orden" INTEGER NOT NULL DEFAULT 0,
    "archivado" BOOLEAN NOT NULL DEFAULT false
);

-- Todo lo que ya existía pasa a un primer tablero.
INSERT INTO "PlannerTablero" ("id", "nombre", "color", "orden") VALUES (1, 'Tablero del equipo', '#3B82F6', 0);

ALTER TABLE "PlannerColumna" ADD COLUMN "tableroId" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "PlannerColumna" ADD COLUMN "limite" INTEGER;
ALTER TABLE "PlannerCampo" ADD COLUMN "tableroId" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "PlannerTarea" ADD COLUMN "miembros" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "PlannerTarea" ADD COLUMN "archivada" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PlannerTarea" ADD COLUMN "avisoVencimiento" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "PlannerColumna_tableroId_idx" ON "PlannerColumna"("tableroId");
CREATE INDEX "PlannerCampo_tableroId_idx" ON "PlannerCampo"("tableroId");

CREATE TABLE "PlannerSubtarea" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tareaId" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "hecha" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "PlannerSubtarea_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "PlannerTarea" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "PlannerSubtarea_tareaId_idx" ON "PlannerSubtarea"("tareaId");

CREATE TABLE "PlannerComentario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tareaId" INTEGER NOT NULL,
    "autorId" INTEGER,
    "autor" TEXT NOT NULL DEFAULT '',
    "texto" TEXT NOT NULL,
    "creadaEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlannerComentario_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "PlannerTarea" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "PlannerComentario_tareaId_idx" ON "PlannerComentario"("tareaId");

CREATE TABLE "Notificacion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "texto" TEXT NOT NULL DEFAULT '',
    "enlace" TEXT NOT NULL DEFAULT '',
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "creadaEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Notificacion_usuarioId_leida_creadaEn_idx" ON "Notificacion"("usuarioId", "leida", "creadaEn");
