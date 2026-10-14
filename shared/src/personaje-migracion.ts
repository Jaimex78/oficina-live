import { avatarAlAzar, validarAvatar } from './personaje-plan';
import type { AvatarSpec, CatalogoPersonaje } from './personaje';

/**
 * Migración de personajes guardados con un catálogo anterior (v2, v3 y v4) al catálogo v5 (personaje de 32 x 64, catálogo reducido).
 * Conserva lo que sigue existiendo (ids que no cambiaron) y reemplaza el resto por el equivalente más cercano de la v5.
 * Lo que no tiene equivalente (casi todos los disfraces, la movilidad, los accesorios de fantasía) se quita.
 * Un avatar vacío o roto cae a `avatarAlAzar`. Es determinista: la misma cuenta siempre queda con el mismo personaje.
 */

const PIEL: Record<string, string> = { 'piel-1': 'piel-1', 'piel-2': 'piel-2', 'piel-3': 'piel-2', 'piel-4': 'piel-3', 'piel-5': 'piel-3', 'piel-6': 'piel-4', 'piel-7': 'piel-4', 'piel-8': 'piel-5' };

const PELO: Record<string, string> = {
  'pelo-negro': 'pelo-casi-negro',
  'pelo-castano-oscuro': 'pelo-cafe-oscuro',
  'pelo-castano': 'pelo-cafe',
  'pelo-castano-claro': 'pelo-cafe',
  'pelo-rubio-oscuro': 'pelo-caqui',
  'pelo-rubio': 'pelo-rubio',
  'pelo-rubio-ceniza': 'pelo-caqui',
  'pelo-pelirrojo': 'pelo-rojizo',
  'pelo-canoso': 'pelo-blanco',
  'pelo-blanco': 'pelo-blanco',
  'pelo-azul': 'pelo-celeste',
  'pelo-rosado': 'pelo-rosa',
};

const COLOR: Record<string, string> = {
  'rojo-coral': 'rojo',
  negro: 'negro',
  blanco: 'blanco',
  gris: 'gris',
  'azul-marino': 'azul-violeta',
  azul: 'azul-violeta',
  celeste: 'celeste',
  verde: 'verde',
  'verde-oscuro': 'verde-azulado',
  amarillo: 'amarillo',
  naranja: 'naranja',
  rosado: 'rosa',
  morado: 'morado',
  beige: 'beige',
  cafe: 'cafe',
  vino: 'magenta',
};

const PEINADO: Record<string, string> = {
  // catálogos v1 a v3
  'peinado-corto-raya': 'peinado-corto',
  'peinado-corto-clasico': 'peinado-corto',
  'peinado-rizado-corto': 'peinado-rizado',
  'peinado-afro-grande': 'peinado-afro',
  'peinado-ondulado-hombros': 'peinado-ondulado',
  'peinado-largo-suelto': 'peinado-melena',
  'peinado-largo-cola': 'peinado-cola',
  'peinado-mono-alto': 'peinado-mono',
  'peinado-bob-flequillo': 'peinado-flequillo',
  // catálogo v4 (41 peinados) al v5 (12)
  'peinado-largo': 'peinado-melena',
  'peinado-bob': 'peinado-flequillo',
  'peinado-mohicano': 'peinado-despeinado',
  'peinado-puntas': 'peinado-despeinado',
  'peinado-tupe': 'peinado-corto',
  'peinado-raya': 'peinado-corto',
  'peinado-lados-afeitados': 'peinado-rapado',
  'peinado-pixie': 'peinado-corto',
  'peinado-coletas': 'peinado-cola',
  'peinado-monos-dobles': 'peinado-mono',
  'peinado-cortina': 'peinado-flequillo',
  'peinado-melena-rizada': 'peinado-rizos-largos',
  'peinado-trena-larga': 'peinado-trenzas',
  'peinado-trenza-larga': 'peinado-trenzas',
  'peinado-rastas': 'peinado-rizos-largos',
  'peinado-calvo-lados': 'peinado-rapado',
  'peinado-hongo': 'peinado-corto',
  'peinado-flequillo-lateral': 'peinado-flequillo',
};
/** Los peinados sacados de la hoja del diseñador en la v4 (`peinado-hoja-NN`) caen en uno de estos, según su número. */
const PEINADO_HOJA = ['peinado-despeinado', 'peinado-corto', 'peinado-rizado', 'peinado-flequillo', 'peinado-afro', 'peinado-cola', 'peinado-melena', 'peinado-mono'];
const peinadoDeHoja = (id: string): string | undefined => {
  const m = /^peinado-hoja-(\d+)$/.exec(id);
  return m ? PEINADO_HOJA[Number(m[1]) % PEINADO_HOJA.length] : undefined;
};

/** Prenda de arriba vieja a su equivalente y, si era un abrigo, la chaqueta que la acompaña. */
const ARRIBA: Record<string, { arriba: string; chaqueta?: string }> = {
  'arriba-camiseta': { arriba: 'arriba-camiseta' },
  'arriba-camisa': { arriba: 'arriba-camisa' },
  'arriba-polo': { arriba: 'arriba-polo' },
  'arriba-buso': { arriba: 'arriba-buso' },
  'arriba-sueter': { arriba: 'arriba-sueter' },
  'arriba-blazer': { arriba: 'arriba-camisa', chaqueta: 'chaqueta-blazer' },
  'arriba-chaqueta': { arriba: 'arriba-camiseta', chaqueta: 'chaqueta-chaqueta' },
  'arriba-blusa': { arriba: 'arriba-blusa' },
  // catálogo v4
  'arriba-sin-mangas': { arriba: 'arriba-camiseta' },
  'arriba-rayas': { arriba: 'arriba-camiseta' },
  'arriba-estampada': { arriba: 'arriba-camiseta' },
};
const arribaDeHoja = (id: string): string | undefined => (id.startsWith('arriba-hoja-') ? 'arriba-camiseta' : undefined);

/** Chaqueta de la v4 a su equivalente de la v5. */
const CHAQUETA: Record<string, string> = {
  'chaqueta-chamarra': 'chaqueta-chaqueta', 'chaqueta-abrigo-largo': 'chaqueta-abrigo', 'chaqueta-jean': 'chaqueta-chaqueta', 'chaqueta-bomber': 'chaqueta-chaqueta',
  'chaqueta-sudadera': 'chaqueta-chaqueta', 'chaqueta-cuero': 'chaqueta-chaqueta', 'chaqueta-impermeable': 'chaqueta-chaqueta', 'chaqueta-acolchado': 'chaqueta-abrigo',
  'chaqueta-poncho': 'chaqueta-cardigan', 'chaqueta-kimono': 'chaqueta-cardigan', 'chaqueta-deportiva': 'chaqueta-chaqueta', 'chaqueta-lana': 'chaqueta-cardigan',
  'chaqueta-pelo': 'chaqueta-abrigo', 'chaqueta-smoking': 'chaqueta-blazer', 'chaqueta-capa-corta': 'chaqueta-chaleco',
};

/** Vello facial de la v4 a su equivalente de la v5 (4 estilos). */
const BARBA: Record<string, string> = {
  'barba-chivita': 'barba-perilla', 'barba-manubrio': 'barba-bigote-clasico', 'barba-larga': 'barba-completa', 'barba-patillas': 'barba-corta',
  'barba-candado': 'barba-perilla', 'barba-sombra': 'barba-corta',
};

const ABAJO: Record<string, string> = {
  'abajo-pantalon': 'abajo-pantalon', 'abajo-jean': 'abajo-jean', 'abajo-bermuda': 'abajo-corto', 'abajo-falda': 'abajo-falda', 'abajo-jogger': 'abajo-pantalon',
  'abajo-falda-larga': 'abajo-falda', 'abajo-pantalon-ancho': 'abajo-pantalon', 'abajo-short-deportivo': 'abajo-corto', 'abajo-hoja-08': 'abajo-pantalon', 'abajo-hoja-04': 'abajo-pantalon',
};
const ZAPATOS: Record<string, string> = {
  'zapatos-tenis': 'zapatos-tenis', 'zapatos-botas': 'zapatos-botas', 'zapatos-formales': 'zapatos-formales', 'zapatos-sandalias': 'zapatos-sandalias',
  'zapatos-tenis-altos': 'zapatos-tenis', 'zapatos-mocasines': 'zapatos-formales', 'zapatos-botines': 'zapatos-botas', 'zapatos-gruesos': 'zapatos-botas', 'zapatos-hoja-14': 'zapatos-tenis',
};
/** Accesorio viejo a su equivalente de la v5; `''` es que no tiene equivalente y se quita. */
const ACC: Record<string, string> = {
  'acc-gafas-rectangulares': 'acc-gafas-cuadradas',
  'acc-orejas-gato': 'acc-gorro-lana', 'acc-mono': 'acc-gorro-lana', 'acc-capitan': 'acc-gorra', 'acc-copa': 'acc-boina', 'acc-casco': 'acc-gorra', 'acc-flores': 'acc-boina',
  'acc-birrete': 'acc-boina', 'acc-paja': 'acc-gorra', 'acc-vaquero': 'acc-gorra', 'acc-diadema': '', 'acc-bandana': 'acc-gorro-lana',
  'acc-monoculo': 'acc-gafas-redondas', 'acc-antifaz': 'acc-gafas-sol', 'acc-visor': 'acc-gafas-sol', 'acc-aviador': 'acc-gafas-sol', 'acc-gatunas': 'acc-gafas-cuadradas',
  'acc-lectura': 'acc-gafas-redondas', 'acc-grandes': 'acc-gafas-cuadradas', 'acc-deportivas': 'acc-gafas-sol', 'acc-gafas-3d': 'acc-gafas-cuadradas',
  'acc-panuelo': 'acc-bufanda', 'acc-cola': '', 'acc-mascara-tribal': '', 'acc-collar': '', 'acc-peluche': '', 'acc-corbata': '', 'acc-corbatin': '', 'acc-alas': 'acc-capa', 'acc-bolso': 'acc-mochila',
};

const existe = (lista: readonly { id: string }[] | undefined, id: string): boolean => (lista ?? []).some((p) => p.id === id);

/** Un personaje válido con el catálogo actual a partir de uno guardado (o de nada). */
export function migrarAvatar(spec: AvatarSpec | null | undefined, cat: CatalogoPersonaje, semilla = 1): AvatarSpec {
  const azar = avatarAlAzar(cat, semilla);
  if (!spec || typeof spec !== 'object' || spec.v !== 1) return azar;
  if (validarAvatar(spec, cat) === null) return spec;

  const color = (id: string | undefined, respaldo: string): string => {
    const c = COLOR[id ?? ''] ?? id ?? '';
    return existe(cat.colores, c) ? c : respaldo;
  };
  const colorPelo = (id: string | undefined, respaldo: string): string => {
    const c = PELO[id ?? ''] ?? id ?? '';
    return existe(cat.pelos, c) ? c : respaldo;
  };
  const escoger = (lista: readonly { id: string }[] | undefined, mapa: Record<string, string>, id: string, respaldo: string): string => {
    const c = mapa[id] ?? id;
    return existe(lista, c) ? c : respaldo;
  };

  const vieja = ARRIBA[spec.arriba] ?? (arribaDeHoja(spec.arriba) ? { arriba: arribaDeHoja(spec.arriba) as string } : undefined);
  const arriba = vieja ? vieja.arriba : spec.arriba;
  const r: AvatarSpec = {
    v: 1,
    cuerpo: existe(cat.cuerpos, spec.cuerpo) ? spec.cuerpo : azar.cuerpo,
    piel: existe(cat.pieles, spec.piel) && !(spec.cuerpo === 'cuerpo-a' || spec.cuerpo === 'cuerpo-b') ? spec.piel : escoger(cat.pieles, PIEL, spec.piel, azar.piel),
    peinado: existe(cat.peinados, spec.peinado) ? spec.peinado : escoger(cat.peinados, PEINADO, peinadoDeHoja(spec.peinado) ?? spec.peinado, azar.peinado),
    pelo: colorPelo(spec.pelo, azar.pelo),
    arriba: existe(cat.arriba, arriba) ? arriba : azar.arriba,
    colorArriba: color(spec.colorArriba, azar.colorArriba),
    colorArriba2: color(spec.colorArriba2, azar.colorArriba2),
    abajo: escoger(cat.abajo, ABAJO, spec.abajo, azar.abajo),
    colorAbajo: color(spec.colorAbajo, azar.colorAbajo),
    zapatos: escoger(cat.zapatos, ZAPATOS, spec.zapatos, azar.zapatos),
    colorZapatos: color(spec.colorZapatos, azar.colorZapatos),
    accesorios: [],
  };
  // La piel de un avatar viejo se reparte entre 5 tonos; los demás ids se convierten con las tablas de arriba.
  if (spec.cuerpo === 'cuerpo-a' || spec.cuerpo === 'cuerpo-b') r.piel = existe(cat.pieles, PIEL[spec.piel] ?? '') ? (PIEL[spec.piel] as string) : azar.piel;
  const chaqueta = vieja?.chaqueta;
  if (chaqueta && existe(cat.chaquetas, chaqueta)) r.chaqueta = { id: chaqueta, color: color(spec.colorArriba, azar.colorArriba) };
  const vistos = new Set<string>();
  const carpetas = new Set<string>();
  for (const a of spec.accesorios ?? []) {
    const id = ACC[a.id] ?? a.id;
    const parte = (cat.accesorios ?? []).find((p) => p.id === id);
    // una sola pieza por carpeta (un sombrero, unas gafas, un «Otro»): si dos caen en la misma, gana la primera
    if (!parte || vistos.has(id) || (parte.carpeta && carpetas.has(parte.carpeta))) continue;
    vistos.add(id);
    if (parte.carpeta) carpetas.add(parte.carpeta);
    r.accesorios.push({ id, color: color(a.color, azar.colorArriba), ...(a.color2 ? { color2: color(a.color2, azar.colorArriba) } : {}) });
  }
  const barba = spec.barba ? (BARBA[spec.barba.id] ?? spec.barba.id) : '';
  if (spec.barba && existe(cat.barbas, barba)) r.barba = { id: barba, color: colorPelo(spec.barba.color, r.pelo) };
  if (spec.especial && existe(cat.especiales, spec.especial.id)) {
    r.especial = { id: spec.especial.id, ...(spec.especial.color && existe(cat.colores, color(spec.especial.color, '')) ? { color: color(spec.especial.color, '') } : {}) };
  }
  const chaquetaVieja = spec.chaqueta ? (CHAQUETA[spec.chaqueta.id] ?? spec.chaqueta.id) : '';
  if (spec.chaqueta && existe(cat.chaquetas, chaquetaVieja)) r.chaqueta = { id: chaquetaVieja, color: color(spec.chaqueta.color, azar.colorArriba) };
  // La mascota no depende del catálogo de ropa: se conserva tal cual (el servidor la valida con el catálogo de mascotas).
  if (spec.mascota && typeof spec.mascota === 'object') r.mascota = spec.mascota;
  return validarAvatar(r, cat) === null ? r : azar;
}
