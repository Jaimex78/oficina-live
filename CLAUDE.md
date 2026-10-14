# Oficina Live

Oficina virtual en pixel art, solo para computador, con presencia en tiempo real, objetos y personajes propios, permisos por persona, Planner interno y enlaces a Teams. Idea inspirada en Gather. Autor: Jaime Orozco, con Claude (Anthropic).

Licencia: todos los derechos reservados (`LICENSE`). Terceros en `AVISOS.md`.

## Estructura

Monorepo de npm (Node 24+). Paquetes `@ol/*`:

- `shared/` contratos y lógica pura: mapa (`mapa.ts`, `oficina.ts`, `ConstructorSala`), validación del mapa, plantillas (`plantillas/`), catálogos de objetos y personajes, permisos y protocolo de presencia. Sin red ni disco.
- `server/` Express 5, Prisma + SQLite, WebSocket de presencia, `tsx`. Rutas en `src/rutas/`, auth en `src/auth/`, Teams en `src/teams/`.
- `web/` React 19, Vite 7 y Phaser 3. El mundo vive en `src/mundo/`, el HUD en `src/hud/`, el editor del mapa en `src/editor/`.
- `arte/` pipeline de pixel art por código (`Lienzo`, paleta cerrada, atlas). `npm run arte` regenera los atlas de `web/public/assets/arte/`.

## Comandos

```bash
npm install
npm run dev        # API en 8790 y web en 5190 (sin datos de ejemplo)
npm run demo       # igual, con cuentas de demostración (ver docs/ACCESOS.md)
npm run local      # versión local con datos reales en data-local/
npm test           # shared, server, web y arte
npm run typecheck
npm run build
```

Variables en `.env.example`. Para el primer arranque sin cuentas, define `OL_ADMIN_CORREO`.

## Reglas del proyecto

- Solo computador. Los celulares ven una pantalla que pide el sitio de escritorio (`SoloComputador.tsx`). No se crea versión móvil.
- Casilla de 32 px. Personaje de 32 x 64 px con caminar de 4 cuadros por dirección.
- Las sillas se pueden cruzar. La persona se sienta solo si se detiene unos 160 ms con su centro dentro de la casilla del asiento. Una silla ocupada bloquea.
- Los objetos pequeños se apoyan sobre mesas por sus metadatos (`superficies.ts`, `apoyos.ts`). El validador del mapa avisa de lo suelto y propone «Arreglar».
- Solo en modo edición se resaltan casillas al pasar el mouse. En el mundo no hay efectos de hover.
- Los sonidos se sintetizan con Web Audio (`web/src/mundo/sonido.ts`). No hay archivos de audio.
- Teams: el servidor arma los enlaces (`POST /api/teams/enlace`). El navegador nunca recibe listas de correos. El nombre del chat solo se aplica al crear un grupo nuevo; para chats persistentes por sala haría falta Microsoft Graph.
- Cuentas: sin contraseñas por defecto. Cada perfil nuevo recibe un enlace de activación de un solo uso.
- Textos para personas: español neutro, frases cortas, sin rayas largas.

## Antes de publicar cambios

1. `npm run typecheck && npm test` en verde.
2. Sin llaves ni datos reales en git (`data*/` y `.env` están ignorados).
3. Material de terceros solo con licencia, y listado en `AVISOS.md`. `arte/referencia/` es material de estudio local y no se versiona.

## Pendientes conocidos

- Música ambiental con pistas licenciadas (no hay audio en la plataforma).
- Envío real de correos (SMTP) para los enlaces de activación.
- Chats persistentes de Teams por sala con Microsoft Graph y un registro de aplicación en Entra.
- Catálogo de personajes más amplio (hoy es reducido) y más disfraces.
- Probar con dos personas reales: bloqueo de sala, coworking, saludos y chat cercano.
