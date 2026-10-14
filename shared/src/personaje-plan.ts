import type { Direccion } from './arte';
import {
  CAPAS_PERSONAJE,
  CUADROS_PARTE_ANIMADA,
  MAX_ACCESORIOS,
  reboteDe,
  type AvatarSpec,
  type CapaPersonaje,
  type CatalogoPersonaje,
  type DisfrazCatalogo,
  type MovilidadCatalogo,
  type OpcionColor,
  type ParteCatalogo,
  type Rampa5,
  type SlotColor,
} from './personaje';

/**
 * Cómo se arma un personaje: la lista de cuadros que se apilan, con su desplazamiento y las rampas de color de cada uno.
 * Es la única fuente de verdad: el navegador (canvas) y el pipeline de arte (lienzos) ejecutan este mismo plan.
 */

export interface CapaDePlan {
  /** Id del cuadro en el atlas de personajes. */
  frame: string;
  capa: CapaPersonaje;
  /** Píxeles hacia abajo (rebote al caminar o al sentarse en las partes que no se animan). */
  dy: number;
  /** Rampa de 5 tonos que reemplaza a cada color marcador de la parte. */
  rampas: Partial<Record<SlotColor, Rampa5>>;
  /** Id de la parte (para depurar). */
  parte: string;
  /** Si viene, no se dibujan las filas del cuadro anteriores a esta (un sombrero cubre el peinado). Se cuenta en filas del cuadro, antes de aplicar `dy`. */
  filaMin?: number;
}

const porId = <T extends { id: string }>(lista: readonly T[], id: string): T | undefined => lista.find((p) => p.id === id);

function rampaDe(lista: readonly OpcionColor[], id: string): Rampa5 | undefined {
  return porId(lista, id)?.rampa;
}

/**
 * Un cuadro de una parte: las que traen 6 cuadros (o 8, el cuerpo) se animan solas, el resto reutiliza el cuadro 0 con el rebote.
 * Una parte de 6 cuadros no tiene los de parpadeo (6 y 7): usa el de quieto (0) y el de sentado (5).
 */
function cuadroDe(lista: readonly string[] | undefined, cuadro: number): { frame: string; animada: boolean } | null {
  if (!lista || lista.length === 0) return null;
  const animada = lista.length >= CUADROS_PARTE_ANIMADA;
  const idx = !animada ? 0 : cuadro < lista.length ? cuadro : cuadro === 6 ? 0 : cuadro === 7 ? 5 : 0;
  const frame = lista[idx];
  return frame ? { frame, animada } : null;
}

/** Cuadro de la hoja: 0 quieto, 1 a 4 caminar, 5 sentado, 6 y 7 los mismos con el ojo medio cerrado. */
export type Cuadro = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** El disfraz del avatar, si existe en el catálogo (los catálogos de la v1 no traen `especiales`). */
export function disfrazDe(spec: AvatarSpec, cat: CatalogoPersonaje): DisfrazCatalogo | undefined {
  return spec.especial ? porId(cat.especiales ?? [], spec.especial.id) : undefined;
}

/** La ayuda de movilidad del avatar, si existe en el catálogo (los catálogos de la v1 no traen `movilidad`). */
export function movilidadDe(spec: AvatarSpec, cat: CatalogoPersonaje): MovilidadCatalogo | undefined {
  return spec.movilidad ? porId(cat.movilidad ?? [], spec.movilidad.id) : undefined;
}

/**
 * Arma la lista de cuadros de un avatar. Reglas de la versión 2 (sin cambiar nada de lo que ya existía):
 *  - Un disfraz reemplaza la prenda de arriba, la de abajo y los zapatos. Puede ocultar el peinado y los accesorios.
 *  - Una ayuda de movilidad sube al personaje (`elevacion`) y puede dejarlo sentado (`cuadroCuerpo`). Sus partes siguen
 *    el cuadro pedido. Las partes estáticas del personaje bajan `REBOTE` del cuadro de su cuerpo, no del pedido.
 */
export function planDeAvatar(spec: AvatarSpec, cat: CatalogoPersonaje, dir: Direccion, cuadro: Cuadro): CapaDePlan[] {
  const capas: { orden: number; capa: CapaDePlan }[] = [];
  let secuencia = 0;

  const disfraz = disfrazDe(spec, cat);
  const movilidad = movilidadDe(spec, cat);
  const cuadroCuerpo: Cuadro = movilidad ? (movilidad.cuadroCuerpo[cuadro] ?? cuadro) : cuadro;
  const subida = movilidad ? (movilidad.elevacion[cuadro] ?? 0) : 0;

  /** `propia`: la parte sigue el cuadro pedido y no sube con el personaje (partes de la ayuda de movilidad). */
  const agregar = (parte: ParteCatalogo | undefined, rampas: Partial<Record<SlotColor, Rampa5>>, propia = false, filaMin?: number): void => {
    if (!parte) return;
    const cuadroUsado = propia ? cuadro : cuadroCuerpo;
    const poner = (lista: readonly string[] | undefined, capa: CapaPersonaje, conCorte: boolean): void => {
      const c = cuadroDe(lista, cuadroUsado);
      if (!c) return;
      const dy = propia ? 0 : (c.animada ? 0 : reboteDe(dir, cuadroCuerpo)) - subida;
      capas.push({
        orden: CAPAS_PERSONAJE.indexOf(capa) * 1000 + secuencia++,
        capa: { frame: c.frame, capa, dy, rampas, parte: parte.id, ...(!conCorte || filaMin === undefined ? {} : { filaMin }) },
      });
    };
    poner(parte.atras?.[dir], 'atras', false);
    poner(parte.frames[dir], parte.capa, true);
  };

  const piel = rampaDe(cat.pieles, spec.piel);
  const pelo = rampaDe(cat.pelos, spec.pelo);
  const arriba = rampaDe(cat.colores, spec.colorArriba);
  const arriba2 = rampaDe(cat.colores, spec.colorArriba2) ?? arriba;
  const abajo = rampaDe(cat.colores, spec.colorAbajo);
  const zapatos = rampaDe(cat.colores, spec.colorZapatos);

  if (movilidad && spec.movilidad) {
    const m1 = rampaDe(cat.colores, spec.movilidad.color ?? movilidad.porDefecto) ?? rampaDe(cat.colores, movilidad.porDefecto);
    for (const parte of movilidad.partes) agregar(parte, m1 ? { accA: m1, accB: m1 } : {}, true);
  }

  agregar(porId(cat.cuerpos, spec.cuerpo), piel ? { piel } : {});
  if (disfraz && spec.especial) {
    const c1 = rampaDe(cat.colores, spec.especial.color ?? disfraz.porDefecto.color) ?? rampaDe(cat.colores, disfraz.porDefecto.color);
    const c2 =
      rampaDe(cat.colores, spec.especial.color2 ?? disfraz.porDefecto.color2 ?? spec.especial.color ?? disfraz.porDefecto.color) ?? c1;
    // Un disfraz usa sus dos colores y, si lo necesita (orejas de elfo, manos), la piel del avatar.
    for (const parte of disfraz.partes) agregar(parte, { ...(c1 ? { ropaA: c1 } : {}), ...(c2 ? { ropaB: c2 } : {}), ...(piel ? { piel } : {}) });
  } else {
    agregar(porId(cat.zapatos, spec.zapatos), zapatos ? { zapatos } : {});
    agregar(porId(cat.abajo, spec.abajo), abajo ? { pantalon: abajo } : {});
    agregar(porId(cat.arriba, spec.arriba), { ...(arriba ? { ropaA: arriba } : {}), ...(arriba2 ? { ropaB: arriba2 } : {}) });
    if (spec.chaqueta) {
      // Cada prenda lleva su propio color: la chaqueta usa los slots ropaA y ropaB con SU rampa, no la de la prenda de arriba.
      const ch = rampaDe(cat.colores, spec.chaqueta.color);
      agregar(porId(cat.chaquetas ?? [], spec.chaqueta.id), ch ? { ropaA: ch, ropaB: ch } : {});
    }
  }

  // Los accesorios que se pueden dibujar: el disfraz puede ocultarlos todos o solo los de la cabeza.
  const accesorios: { parte: ParteCatalogo; a: AvatarSpec['accesorios'][number] }[] = [];
  if (!disfraz?.ocultaAccesorios) {
    for (const a of spec.accesorios.slice(0, MAX_ACCESORIOS)) {
      const parte = porId(cat.accesorios, a.id);
      if (!parte) continue;
      if (disfraz?.ocultaCabeza && parte.capa === 'cabeza') continue;
      accesorios.push({ parte, a });
    }
  }
  // Un sombrero (o el sombrero de un disfraz) tapa el peinado desde su fila hacia arriba, si lo pide.
  const conCorte = [...accesorios.map(({ parte }) => parte), ...(disfraz?.partes ?? [])];
  const corte = conCorte.reduce<number | undefined>((m, parte) => (parte.ocultaPeloSobre === undefined ? m : Math.max(m ?? 0, parte.ocultaPeloSobre)), undefined);

  if (!disfraz?.ocultaPelo) agregar(porId(cat.peinados, spec.peinado), pelo ? { cabello: pelo } : {}, false, corte);
  if (spec.barba && !disfraz?.ocultaBarba) {
    // El vello facial usa los colores del pelo: el elegido, o el del pelo del personaje si no hay uno válido.
    const vello = rampaDe(cat.pelos, spec.barba.color) ?? pelo;
    agregar(porId(cat.barbas ?? [], spec.barba.id), vello ? { cabello: vello } : {});
  }
  for (const { parte, a } of accesorios) {
    const a1 = rampaDe(cat.colores, a.color);
    const a2 = (a.color2 ? rampaDe(cat.colores, a.color2) : undefined) ?? a1;
    agregar(parte, { ...(a1 ? { accA: a1 } : {}), ...(a2 ? { accB: a2 } : {}) });
  }
  return capas.sort((x, y) => x.orden - y.orden).map((c) => c.capa);
}

/** Texto estable de un avatar: sirve de llave para guardar en caché la hoja ya armada. */
export function claveAvatar(spec: AvatarSpec): string {
  const base = [spec.cuerpo, spec.piel, spec.peinado, spec.pelo, spec.arriba, spec.colorArriba, spec.colorArriba2, spec.abajo, spec.colorAbajo, spec.zapatos, spec.colorZapatos, ...spec.accesorios.map((a) => `${a.id}:${a.color}:${a.color2 ?? ''}`)];
  // El disfraz, la movilidad, la barba y la chaqueta solo suman a la llave si existen: la llave de un avatar anterior no cambia.
  if (spec.especial) base.push(`e:${spec.especial.id}:${spec.especial.color ?? ''}:${spec.especial.color2 ?? ''}`);
  if (spec.movilidad) base.push(`m:${spec.movilidad.id}:${spec.movilidad.color ?? ''}`);
  if (spec.barba) base.push(`b:${spec.barba.id}:${spec.barba.color}`);
  if (spec.chaqueta) base.push(`j:${spec.chaqueta.id}:${spec.chaqueta.color}`);
  return base.join('|');
}

/** Revisa un avatar contra el catálogo. Devuelve el problema en español o `null` si todo existe. */
export function validarAvatar(spec: AvatarSpec, cat: CatalogoPersonaje): string | null {
  const falta = (nombre: string) => `La opción «${nombre}» ya no existe en el catálogo de personajes.`;
  if (spec.v !== 1) return 'La versión del personaje no es compatible.';
  if (!porId(cat.cuerpos, spec.cuerpo)) return falta('cuerpo');
  if (!porId(cat.pieles, spec.piel)) return falta('piel');
  if (!porId(cat.peinados, spec.peinado)) return falta('peinado');
  if (!porId(cat.pelos, spec.pelo)) return falta('color de pelo');
  if (!porId(cat.arriba, spec.arriba)) return falta('prenda de arriba');
  if (!porId(cat.colores, spec.colorArriba)) return falta('color de la prenda de arriba');
  if (spec.colorArriba2 && !porId(cat.colores, spec.colorArriba2)) return falta('segundo color de la prenda de arriba');
  if (!porId(cat.abajo, spec.abajo)) return falta('prenda de abajo');
  if (!porId(cat.colores, spec.colorAbajo)) return falta('color de la prenda de abajo');
  if (!porId(cat.zapatos, spec.zapatos)) return falta('zapatos');
  if (!porId(cat.colores, spec.colorZapatos)) return falta('color de los zapatos');
  if (spec.accesorios.length > MAX_ACCESORIOS) return `Máximo ${MAX_ACCESORIOS} accesorios.`;
  const vistos = new Set<string>();
  for (const a of spec.accesorios) {
    if (vistos.has(a.id)) return 'Un accesorio está repetido.';
    vistos.add(a.id);
    if (!porId(cat.accesorios, a.id)) return falta('accesorio');
    if (!porId(cat.colores, a.color) || (a.color2 && !porId(cat.colores, a.color2))) return falta('color de accesorio');
  }
  if (spec.especial) {
    if (!porId(cat.especiales ?? [], spec.especial.id)) return falta('disfraz');
    if (spec.especial.color && !porId(cat.colores, spec.especial.color)) return falta('color del disfraz');
    if (spec.especial.color2 && !porId(cat.colores, spec.especial.color2)) return falta('segundo color del disfraz');
  }
  if (spec.movilidad) {
    if (!porId(cat.movilidad ?? [], spec.movilidad.id)) return falta('movilidad');
    if (spec.movilidad.color && !porId(cat.colores, spec.movilidad.color)) return falta('color de la movilidad');
  }
  if (spec.barba) {
    if (!porId(cat.barbas ?? [], spec.barba.id)) return falta('barba');
    if (spec.barba.color && !porId(cat.pelos, spec.barba.color)) return falta('color de la barba');
  }
  if (spec.chaqueta) {
    if (!porId(cat.chaquetas ?? [], spec.chaqueta.id)) return falta('chaqueta');
    if (!porId(cat.colores, spec.chaqueta.color)) return falta('color de la chaqueta');
  }
  return null;
}

/** Generador determinista con buena mezcla de bits (mulberry32): mismas semillas, mismos avatares. */
function generador(semilla: number): () => number {
  let a = (semilla >>> 0) || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Un avatar completo y válido a partir de una semilla (para quien aún no creó el suyo y para el botón «sorpréndeme»).
 * Nunca elige disfraz, movilidad ni mascota: son decisiones de la persona. Sin `conPremium` tampoco sortea ropa premium. Elige a lo sumo un accesorio por carpeta (sombrero,
 * gafas, otro), una chaqueta en 1 de cada 3 avatares y vello facial en 1 de cada 5 (casi siempre del color del pelo).
 */
export function avatarAlAzar(cat: CatalogoPersonaje, semilla: number, conPremium = false): AvatarSpec {
  const r = generador(semilla);
  // Sin el paquete de ropa premium solo se sortea lo básico.
  const libre = <T extends { premium?: boolean }>(lista: readonly T[]): T[] => (conPremium ? [...lista] : lista.filter((p) => p.premium !== true));
  const n = (k: number): number => Math.floor(r() * Math.max(1, k));
  const elegir = <T extends { id: string }>(lista: readonly T[]): string => lista[n(lista.length)]?.id ?? '';
  const accesorios: AvatarSpec['accesorios'] = [];
  for (const [carpeta, uno] of [['sombrero', 5], ['gafas', 4], ['otro', 5]] as const) {
    const candidatos = libre(cat.accesorios).filter((p) => p.carpeta === carpeta);
    const tira = n(uno);
    if (candidatos.length > 0 && tira === 0) accesorios.push({ id: elegir(candidatos), color: elegir(cat.colores) });
  }
  const spec: AvatarSpec = {
    v: 1,
    cuerpo: elegir(cat.cuerpos),
    piel: elegir(cat.pieles),
    peinado: elegir(cat.peinados),
    pelo: elegir(cat.pelos),
    arriba: elegir(cat.arriba),
    colorArriba: elegir(cat.colores),
    colorArriba2: elegir(cat.colores),
    abajo: elegir(cat.abajo),
    colorAbajo: elegir(cat.colores),
    zapatos: elegir(cat.zapatos),
    colorZapatos: elegir(cat.colores),
    accesorios,
  };
  const chaquetas = libre(cat.chaquetas ?? []);
  if (chaquetas.length > 0 && n(3) === 0) spec.chaqueta = { id: elegir(chaquetas), color: elegir(cat.colores) };
  const barbas = cat.barbas ?? [];
  if (barbas.length > 0 && n(5) === 0) spec.barba = { id: elegir(barbas), color: n(6) === 0 ? elegir(cat.pelos) : spec.pelo };
  return spec;
}
