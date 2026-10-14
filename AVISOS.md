# Avisos y atribuciones

Oficina Live es © 2026 Jaime Orozco, todos los derechos reservados (ver [LICENSE](LICENSE)).
Este archivo lista lo que no es de la persona autora y cada licencia que lo cubre.
Esas licencias no cambian la del resto del proyecto.

## Arte

- **Personaje base** (cuerpo, pelo, chaqueta y pantalón): arte pixel de Jaime Orozco como diseñador. Las capas se transcriben a código en `arte/src/personaje/v5/`. Todo el arte restante (objetos, atlas, mascotas, exterior y escenas de ingreso) se dibuja por código con el núcleo de `arte/` y es de Jaime Orozco.
- **Estilo:** inspirado en la experiencia de [Gather](https://www.gather.town/). Oficina Live no tiene relación con Gather, no usa su código ni sus gráficos, y solo se midieron proporciones. Gather es marca de sus titulares.
- **Edificio de ejemplo:** la plantilla «Piso 4 Naos» y la fachada del ingreso son dibujos propios inspirados en Naos Empresarial (Bogotá). No son oficiales ni están afiliados al edificio.

## Tipografías

| Tipografía | Paquete | Licencia |
|---|---|---|
| Inter Variable | `@fontsource-variable/inter` | SIL Open Font License 1.1 |
| JetBrains Mono Variable | `@fontsource-variable/jetbrains-mono` | SIL Open Font License 1.1 |

## Dependencias principales

| Paquete | Uso | Licencia |
|---|---|---|
| [Phaser](https://phaser.io) 3 | motor del mundo en 2D | MIT |
| [React](https://react.dev) 19, React DOM, React Router | interfaz | MIT |
| [Vite](https://vite.dev) 7 | compilación y servidor de desarrollo | MIT |
| [lucide-react](https://lucide.dev) | iconos | ISC |
| [Express](https://expressjs.com) 5 | API del servidor | MIT |
| [Prisma](https://www.prisma.io) | acceso a SQLite | Apache-2.0 |
| [ws](https://github.com/websockets/ws) | presencia en tiempo real | MIT |
| [jose](https://github.com/panva/jose) | firma de sesiones (JWT) | MIT |
| [helmet](https://helmetjs.github.io) | cabeceras de seguridad | MIT |
| [zod](https://zod.dev) | validación | MIT |
| [sharp](https://sharp.pixelplumbing.com) | fotos de perfil | Apache-2.0 |
| [pngjs](https://github.com/pngjs/pngjs) | lectura y escritura de PNG | MIT |
| [Vitest](https://vitest.dev), [tsx](https://tsx.is), [TypeScript](https://www.typescriptlang.org) | pruebas y herramientas | MIT, MIT, Apache-2.0 |

Para ver el árbol completo con sus licencias: `npx license-checker --summary` en la raíz.

## Marcas

Microsoft Teams es marca de Microsoft Corporation. Oficina Live solo arma enlaces profundos (`deep links`) a Teams y no está afiliado ni respaldado por Microsoft. Spotify, Gather y los demás nombres citados pertenecen a sus titulares.

## Construcción con IA

Parte del código, del arte por código y de la documentación se escribió con Claude (Anthropic) bajo la dirección y revisión de Jaime Orozco. Claude figura como coautor en los commits.
