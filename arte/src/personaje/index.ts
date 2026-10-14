/**
 * Constructor de los personajes personalizables (v5, personaje de 32 x 64 sobre el cuerpo del arte base de Jaime Orozco).
 *
 * Dibuja por código todas las partes, las valida contra la paleta y los marcadores, las empaqueta en el atlas `personajes-v5` y escribe las
 * hojas de revisión en `arte/salida/`. Solo publica (`web/public/assets/arte/personajes-v5.png` y `shared/src/catalogo/personajes-v5.json`)
 * con `--publicar`:
 *
 *   npm run construir -w @ol/arte -- --solo=personajes --publicar
 */

import { avatarAlAzar } from '@ol/shared';
import type { AvatarSpec, CatalogoPersonaje } from '@ol/shared';
import { registrarConstructor } from '../construir';
import { validarAtlas } from '../nucleo';
import { VALIDACION_V5 as VALIDACION, construirCatalogo, empaquetarCatalogo } from './catalogo';
import { catalogoParaVista, hojaCatalogo, hojaCiclo, hojaCombinaciones, hojaGiro, hojaRevision, hojaSentados, maniqui } from './vistas';
import type { FilaRevision } from './vistas';

export const NOMBRE_ATLAS = 'personajes-v5';

registrarConstructor('personajes', (ctx) => {
  const catalogo = construirCatalogo();
  const { atlas, frames } = empaquetarCatalogo(catalogo.items);
  const errores = validarAtlas(atlas, frames, { ...VALIDACION, permitirMarcadores: true });
  if (errores.length > 0) throw new Error(`Los personajes no pasan la validación:\n${errores.slice(0, 20).join('\n')}`);

  const cat: CatalogoPersonaje = catalogoParaVista(catalogo, atlas, frames, NOMBRE_ATLAS);
  const lienzos = catalogo.lienzos;
  const azar = (n: number): AvatarSpec => avatarAlAzar(cat, n);
  const base = maniqui(cat);

  ctx.guardarPng('personajes-giro.png', hojaGiro(base, cat, lienzos));
  ctx.guardarPng('personajes-ciclo.png', hojaCiclo([1, 2, 3, 4, 5, 6].map(azar), cat, lienzos));
  ctx.guardarPng('personajes-combinaciones.png', hojaCombinaciones(cat, lienzos, 40, 2));
  ctx.guardarPng('personajes-catalogo.png', hojaCatalogo(catalogo, 1));
  ctx.guardarPng('personajes-sentados.png', hojaSentados([7, 8, 9, 10].map(azar), cat, lienzos));

  // Una hoja por categoría del editor: cada opción sobre el mismo maniquí, en varias vistas.
  const color = (i: number): string => cat.colores[i % cat.colores.length]?.id ?? '';
  const hoja = (nombre: string, filas: FilaRevision[], o: { bloques?: number; escala?: number; y0?: number; alto?: number } = {}): void => {
    if (filas.length > 0) ctx.guardarPng(`personajes-v5-${nombre}.png`, hojaRevision(filas, cat, lienzos, { escala: 4, oscuras: 3, ...o }));
  };
  hoja('piel', cat.cuerpos.map((c, i) => ({ nombre: c.id, spec: { ...base, cuerpo: c.id, piel: cat.pieles[i % cat.pieles.length]?.id ?? base.piel } })), { y0: 24, alto: 40 });
  hoja('cabello', cat.peinados.map((p, i) => ({ nombre: p.id, spec: { ...base, peinado: p.id, pelo: cat.pelos[(i * 5 + 1) % cat.pelos.length]?.id ?? base.pelo } })), { bloques: 3, escala: 4, y0: 20, alto: 40 });
  hoja('vello', (cat.barbas ?? []).map((b, i) => ({ nombre: b.id, spec: { ...base, barba: { id: b.id, color: cat.pelos[(i + 2) % cat.pelos.length]?.id ?? base.pelo } } })), { y0: 24, alto: 30 });
  hoja('arriba', cat.arriba.map((p, i) => ({ nombre: p.id, spec: { ...base, arriba: p.id, colorArriba: color(i * 3) } })), { bloques: 2, escala: 4, y0: 40, alto: 24 });
  hoja('chaqueta', (cat.chaquetas ?? []).map((p, i) => ({ nombre: p.id, spec: { ...base, chaqueta: { id: p.id, color: color(i * 4 + 9) } } })), { bloques: 2, escala: 4, y0: 40, alto: 24 });
  hoja('abajo', cat.abajo.map((p, i) => ({ nombre: p.id, spec: { ...base, abajo: p.id, colorAbajo: color(i * 5 + 7) } })), { bloques: 2, escala: 4, y0: 40, alto: 24 });
  hoja('zapatos', cat.zapatos.map((p, i) => ({ nombre: p.id, spec: { ...base, zapatos: p.id, colorZapatos: color(i * 4 + 11) } })), { bloques: 2, escala: 4, y0: 40, alto: 24 });
  const recortes = { sombrero: { bloques: 2, escala: 4, y0: 14, alto: 36 }, gafas: { bloques: 2, escala: 5, y0: 28, alto: 24 }, otro: { bloques: 2, escala: 4, y0: 24, alto: 40 } } as const;
  for (const carpeta of ['sombrero', 'gafas', 'otro'] as const) {
    hoja(
      carpeta,
      cat.accesorios.filter((a) => a.carpeta === carpeta).map((a, i) => ({ nombre: a.id, spec: { ...base, accesorios: [{ id: a.id, color: color(i * 3 + 1), color2: color(i * 3 + 5) }] } })),
      recortes[carpeta],
    );
  }
  hoja('disfraz', cat.especiales.map((e) => ({ nombre: e.id, spec: { ...base, especial: { id: e.id } } })), { bloques: 1, escala: 4, y0: 12, alto: 52 });

  const partes = Object.values(catalogo.meta).reduce((n, v) => n + (Array.isArray(v) ? v.length : 0), 0);
  ctx.log(`${catalogo.items.length} cuadros de ${partes} opciones, atlas de ${atlas.ancho}x${atlas.alto} px validado`);
  ctx.publicarAtlas(NOMBRE_ATLAS, atlas, frames, catalogo.meta, { validar: VALIDACION });
});
