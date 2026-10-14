import type { CategoriaId, ColeccionId, ObjetoCatalogo } from '../arte';
import { CALIDA, MURO, U, def, luz } from '../inventario-def';

/**
 * Lote 13: exterior y juegos interactivos de Gather v2, cada pieza con su dibujo propio (atlas `objetos-v14`). Árboles, agua y
 * plantas de jardín, troncos, fogatas, parrillas, carros de comida y otros objetos de patio; luego los 13 juegos que abren un
 * enlace (mesas de juego, pizarras, gong, minigolf...) y tres objetos inteligentes de adorno. Ver `arte/GUIA-OBJETOS-V2.md`.
 *
 * Reglas del lote (las revisa `arte/tests/objetos-lote13.test.ts`):
 *  - Orientación única (`U`), salvo la pizarra de pared, que es un colgante (`MURO`: S, E y O).
 *  - Los árboles grandes son de 2 x 2 con `sobresale` 64 y bloquean solo la fila del tronco, como `pino` y `abedul`.
 *  - Los juegos llevan `interaccion: 'enlace'`: el enlace lo pone la administración en las propiedades de cada objeto colocado.
 *    Son dibujos GENÉRICOS (sin marcas ni juegos de terceros) y sus nombres están en español.
 *  - Los objetos inteligentes (bandeja de entrada, monitor de estado y bombilla de estado) son de adorno por ahora: luego se
 *    conectarán a datos. Van apoyados sobre un escritorio, en `colaboracion`.
 *  - Fuera por religiosa: la menorá pública de Hanukkah.
 *  - Equivalentes que ya existían y no se redibujan: abedul, pino grande (`pino`), `fuente`, calabazas (grande, chicas, apiladas y
 *    en racimo: `calabaza-grande`, `calabazas`), lápidas (`tumba`), muñeco de nieve, espantapájaros, `cerca` y `arbol-seco`.
 */

const FLORES = ['base', 'amarillo', 'morado', 'blanco'];
const LUZ_FUEGO = luz('#FF9A4A', 3, 0.7, 'siempre', true);
const LUZ_ANTORCHA = luz('#FFB35C', 2.4, 0.6, 'noche', true);

interface Op {
  ancho?: number;
  alto?: number;
  s?: number;
  v?: string[];
  luz?: ReturnType<typeof luz>;
  bloquea?: [number, number][] | 'nada';
  capa?: 'suelo' | 'objeto' | 'sobre';
  ap?: boolean;
  col?: ColeccionId;
  cat?: CategoriaId;
}

const d = (id: string, nombre: string, etiquetas: string[], o: Op = {}): ObjetoCatalogo =>
  def({
    id,
    nombre,
    categoria: o.cat ?? 'exterior',
    ancho: o.ancho ?? 1,
    alto: o.alto ?? 1,
    sobresale: o.s ?? 0,
    ...(o.ap === true ? { apoyado: true, bloquea: 'nada' as const } : {}),
    ...(o.bloquea !== undefined ? { bloquea: o.bloquea } : {}),
    orientaciones: U,
    variantes: o.v ?? ['base'],
    ...(o.luz !== undefined ? { emisor: o.luz } : {}),
    ...(o.capa !== undefined ? { capa: o.capa } : {}),
    ...(o.col !== undefined ? { coleccion: o.col } : {}),
    etiquetas,
    lote: 13,
  });

/** Árbol grande: 2 x 2, 64 de alto sobre la huella; solo bloquea la fila del tronco. */
const GRANDE: Op = { ancho: 2, alto: 2, s: 64, bloquea: [[0, 1], [1, 1]] };

// ---------- Árboles ----------
export const LOTE_13_ARBOLES: readonly ObjetoCatalogo[] = [
  d('arce', 'Arce', ['árbol', 'arce', 'otoño', 'exterior'], { ...GRANDE, v: ['base', 'naranja', 'rojo'] }),
  d('sauce-lloron', 'Sauce llorón', ['árbol', 'sauce', 'exterior'], GRANDE),
  d('cerezo', 'Cerezo en flor', ['árbol', 'cerezo', 'flores', 'exterior'], { ...GRANDE, v: ['base', 'blanco'] }),
  d('palmera-coco', 'Palmera de coco', ['árbol', 'palmera', 'coco', 'playa', 'exterior'], GRANDE),
  d('arbol-invierno', 'Árbol de invierno', ['árbol', 'invierno', 'nieve', 'exterior'], GRANDE),
  d('pino-chico', 'Pino pequeño', ['árbol', 'pino', 'exterior'], { s: 64 }),
  d('pino-chico-nevado', 'Pino pequeño nevado', ['árbol', 'pino', 'nieve', 'invierno', 'exterior'], { s: 64 }),
  d('pino-nevado', 'Pino grande nevado', ['árbol', 'pino', 'nieve', 'invierno', 'exterior'], GRANDE),
];

// ---------- Agua, piedra y plantas de jardín ----------
export const LOTE_13_JARDIN: readonly ObjetoCatalogo[] = [
  d('estanque-koi', 'Estanque con peces koi', ['estanque', 'agua', 'peces', 'koi', 'exterior'], { ancho: 2, alto: 2 }),
  d('cascada', 'Cascada', ['cascada', 'agua', 'roca', 'exterior'], { ancho: 2, alto: 2, s: 32 }),
  d('jardin-zen', 'Jardín zen con roca', ['zen', 'arena', 'roca', 'exterior'], { ancho: 2, alto: 2, s: 8 }),
  d('linterna-piedra', 'Linterna de piedra', ['linterna', 'piedra', 'zen', 'exterior'], { s: 32, luz: luz(CALIDA, 2.2, 0.5, 'noche') }),
  d('arbusto', 'Arbusto', ['arbusto', 'verde', 'exterior'], { s: 8 }),
  d('arbusto-flores', 'Arbusto con flores', ['arbusto', 'flores', 'exterior'], { s: 8, v: FLORES }),
  d('helecho-jardin', 'Helecho de jardín', ['helecho', 'planta', 'jardín', 'exterior'], { s: 16 }),
  d('hosta-jardin', 'Hosta de jardín', ['hosta', 'planta', 'jardín', 'exterior'], { s: 8 }),
  d('equinacea', 'Equinácea', ['equinácea', 'flor', 'jardín', 'exterior'], { s: 16, v: FLORES }),
  d('rosal', 'Rosal', ['rosal', 'rosa', 'flor', 'jardín', 'exterior'], { s: 16, v: FLORES }),
  d('girasol-jardin', 'Girasoles de jardín', ['girasol', 'flor', 'jardín', 'exterior'], { s: 32 }),
];

// ---------- El resto del exterior ----------
export const LOTE_13_EXTERIOR: readonly ObjetoCatalogo[] = [
  d('tronco-largo', 'Tronco largo', ['tronco', 'madera', 'leña', 'exterior'], { ancho: 2 }),
  d('tronco-corto', 'Tronco corto', ['tronco', 'madera', 'leña', 'exterior']),
  d('tocon', 'Tocón', ['tocón', 'tronco', 'madera', 'exterior'], { s: 8 }),
  d('fogata-pozo', 'Fogata en pozo', ['fogata', 'fuego', 'campamento', 'exterior'], { s: 16, luz: LUZ_FUEGO }),
  d('fogata-abierta', 'Fogata abierta', ['fogata', 'fuego', 'campamento', 'exterior'], { s: 16, luz: LUZ_FUEGO }),
  d('parrilla-parque', 'Parrilla de parque', ['parrilla', 'asado', 'parque', 'exterior'], { s: 24 }),
  d('parrilla-bola', 'Parrilla de bola', ['parrilla', 'asado', 'exterior'], { s: 24 }),
  d('carro-hot-dogs', 'Carro de perros calientes', ['carro', 'comida', 'perros calientes', 'exterior'], { ancho: 2, s: 32, v: ['base', 'azul', 'amarillo'] }),
  d('carro-piragua', 'Carro de piragua', ['carro', 'comida', 'piragua', 'raspado', 'exterior'], { ancho: 2, s: 32, v: ['base', 'azul', 'amarillo'] }),
  d('antorcha-tiki', 'Antorcha tiki', ['antorcha', 'tiki', 'fuego', 'exterior'], { s: 32, luz: LUZ_ANTORCHA }),
  d('carretilla', 'Carretilla', ['carretilla', 'jardín', 'exterior'], { s: 8 }),
  d('tendedero', 'Tendedero', ['tendedero', 'ropa', 'exterior'], { ancho: 3, s: 32, bloquea: [[0, 0], [2, 0]] }),
  d('flamingo-cesped', 'Flamingo de césped', ['flamingo', 'césped', 'adorno', 'exterior'], { s: 16 }),
  d('paca-heno', 'Paca de heno', ['heno', 'granja', 'otoño', 'exterior'], { s: 8 }),
  d('panel-solar', 'Panel solar', ['panel', 'solar', 'energía', 'exterior'], { ancho: 2, s: 24 }),
  d('turbina-viento', 'Turbina de viento', ['turbina', 'viento', 'energía', 'exterior'], { ancho: 2, s: 96, bloquea: [[0, 0], [1, 0]] }),
  d('condensador-aire', 'Condensador de aire acondicionado', ['aire acondicionado', 'condensador', 'exterior'], { s: 8 }),
  d('arco-otono', 'Arco de otoño', ['arco', 'otoño', 'hojas', 'exterior'], { ancho: 3, s: 48, bloquea: [[0, 0], [2, 0]] }),
  d('mojon', 'Mojón de piedra', ['mojón', 'poste', 'piedra', 'exterior'], { s: 8 }),
  d('mastil-cintas', 'Mástil de cintas', ['mástil', 'cintas', 'fiesta', 'exterior'], { s: 64 }),
  d('caja-fuegos', 'Caja de fuegos artificiales', ['fuegos artificiales', 'pólvora', 'fiesta', 'ano nuevo'], { s: 8, cat: 'temporada', col: 'ano-nuevo' }),
  d('cohete-fuegos', 'Cohete de fuegos artificiales', ['fuegos artificiales', 'cohete', 'fiesta', 'ano nuevo'], { s: 32, cat: 'temporada', col: 'ano-nuevo' }),
];

// ---------- Juegos interactivos (abren un enlace) ----------
const j = (id: string, nombre: string, etiquetas: string[], o: Op = {}): ObjetoCatalogo =>
  def({
    id,
    nombre,
    categoria: 'juegos',
    ancho: o.ancho ?? 1,
    alto: o.alto ?? 1,
    sobresale: o.s ?? 0,
    ...(o.bloquea !== undefined ? { bloquea: o.bloquea } : {}),
    orientaciones: U,
    variantes: ['base'],
    interaccion: 'enlace',
    etiquetas: ['juego', 'interactivo', ...etiquetas],
    lote: 13,
  });

export const LOTE_13_JUEGOS: readonly ObjetoCatalogo[] = [
  def({
    id: 'pizarra-pared',
    nombre: 'Pizarra de pared',
    categoria: 'juegos',
    montado: true,
    bloquea: 'nada',
    ancho: 2,
    sobresale: 8,
    orientaciones: MURO,
    interaccion: 'enlace',
    etiquetas: ['juego', 'interactivo', 'pizarra', 'colaboración', 'pared'],
    lote: 13,
  }),
  j('pizarra-pie', 'Pizarra de pie', ['pizarra', 'colaboración'], { ancho: 2, s: 32 }),
  j('mesa-palabras', 'Mesa de palabras secretas', ['palabras', 'equipos', 'tablero'], { ancho: 2, s: 8 }),
  j('mesa-lobos', 'Mesa de pueblo y lobos', ['roles', 'lobos', 'cartas'], { ancho: 2, s: 8 }),
  j('mesa-patrones', 'Mesa de cartas de patrones', ['cartas', 'patrones', 'mesa'], { ancho: 2, s: 8 }),
  j('mesa-mazos', 'Mesa de construcción de mazos', ['cartas', 'mazos', 'estrategia'], { ancho: 2, s: 8 }),
  j('juego-bloques', 'Juego de bloques que caen', ['bloques', 'arcade', 'pantalla'], { s: 32 }),
  j('juego-dibujo', 'Juego de dibujo en equipo', ['dibujo', 'equipos', 'caballete'], { s: 32 }),
  j('juego-adivinar', 'Juego de adivinar', ['adivinar', 'preguntas', 'pregunta'], { s: 32 }),
  j('torneo-cuatro', 'Torneo de cuatro', ['torneo', 'cuadro', 'trofeo'], { ancho: 2, s: 32 }),
  j('minigolf', 'Minigolf', ['golf', 'deporte', 'pista'], { ancho: 3, s: 16, bloquea: 'nada' }),
  j('gong', 'Gong', ['gong', 'campana', 'celebración'], { s: 32 }),
  j('dock-repositorio', 'Dock de repositorio de código', ['código', 'repositorio', 'desarrollo'], { s: 32 }),
];

// ---------- Objetos inteligentes de adorno ----------
const i = (id: string, nombre: string, etiquetas: string[], o: Op = {}): ObjetoCatalogo =>
  d(id, nombre, ['inteligente', 'estado', ...etiquetas], { ...o, cat: 'colaboracion', ap: true });

export const LOTE_13_INTELIGENTES: readonly ObjetoCatalogo[] = [
  i('bandeja-entrada', 'Bandeja de entrada', ['bandeja', 'correo', 'pendientes'], { s: 8 }),
  i('monitor-estado', 'Monitor de estado', ['monitor', 'bot', 'servicios'], { s: 16, luz: luz('#9CC8FF', 1.4, 0.3, 'siempre') }),
  i('bombilla-estado', 'Bombilla de estado', ['bombilla', 'luz', 'disponibilidad'], { s: 16, v: ['base', 'verde', 'rojo', 'azul'], luz: luz('#FFE6A0', 1.6, 0.4, 'siempre') }),
];

export const LOTE_13: readonly ObjetoCatalogo[] = [
  ...LOTE_13_ARBOLES,
  ...LOTE_13_JARDIN,
  ...LOTE_13_EXTERIOR,
  ...LOTE_13_JUEGOS,
  ...LOTE_13_INTELIGENTES,
];
