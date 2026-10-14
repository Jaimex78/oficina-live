-- CreateTable
CREATE TABLE "Usuario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuario" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cargo" TEXT NOT NULL DEFAULT '',
    "correo" TEXT NOT NULL DEFAULT '',
    "rol" TEXT NOT NULL DEFAULT 'usuario',
    "claveHash" TEXT NOT NULL,
    "debeCambiarClave" BOOLEAN NOT NULL DEFAULT true,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "intentosFallidos" INTEGER NOT NULL DEFAULT 0,
    "bloqueadoHasta" DATETIME,
    "versionToken" INTEGER NOT NULL DEFAULT 1,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimoIngreso" DATETIME,
    "apodo" TEXT NOT NULL DEFAULT '',
    "personaje" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'disponible',
    "invisible" BOOLEAN NOT NULL DEFAULT false,
    "etiquetaLugar" TEXT NOT NULL DEFAULT ''
);

-- CreateTable
CREATE TABLE "Solicitud" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "cargo" TEXT NOT NULL DEFAULT '',
    "mensaje" TEXT NOT NULL DEFAULT '',
    "ip" TEXT NOT NULL DEFAULT '',
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "creadaEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atendidaPor" TEXT,
    "atendidaEn" DATETIME
);

-- CreateTable
CREATE TABLE "Actividad" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" INTEGER,
    "usuario" TEXT NOT NULL DEFAULT '',
    "accion" TEXT NOT NULL,
    "objeto" TEXT NOT NULL DEFAULT '',
    "detalle" TEXT NOT NULL DEFAULT '',
    "ip" TEXT NOT NULL DEFAULT ''
);

-- CreateTable
CREATE TABLE "Ajuste" (
    "clave" TEXT NOT NULL PRIMARY KEY,
    "valor" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_usuario_key" ON "Usuario"("usuario");

-- CreateIndex
CREATE INDEX "Solicitud_ip_creadaEn_idx" ON "Solicitud"("ip", "creadaEn");

-- CreateIndex
CREATE INDEX "Actividad_fecha_idx" ON "Actividad"("fecha");

-- CreateIndex
CREATE INDEX "Actividad_accion_idx" ON "Actividad"("accion");
