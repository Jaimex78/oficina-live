import type { ColeccionId, ObjetoCatalogo } from '../arte';
import { CALIDA, U, def, luz } from '../inventario-def';

/**
 * Lote 10: decoración de Gather v2, cada pieza con su dibujo propio (atlas `objetos-v11`). Plantas y macetas, lámparas y velas,
 * piezas de museo, jarrones y atriles, aparatos y objetos de oficina y hogar, deportes y juguetes. Ver `arte/GUIA-OBJETOS-V2.md`.
 *
 * Reglas del lote (las revisa `arte/tests/objetos-lote10.test.ts`):
 *  - Orientación única (`U`) en todo el lote.
 *  - Lo pequeño (`apoyado: true`) va sobre un escritorio o una mesa y no bloquea. Lo de piso bloquea su huella, salvo las
 *    pelotas, los palos y los carteles de piso, que se pisan.
 *  - Los tamaños en casillas se estimaron por función (Gather no los publica): todo es de 1 x 1 salvo lo largo (jardineras,
 *    divisores, contenedores, radiador, mesas), la planta carnívora gigante (2 x 2) y la pared de escalada.
 *  - Quedan fuera las piezas de fiestas religiosas o de otros países (Hanukkah, Kwanzaa, Eid, Año Nuevo Lunar, Shofar, Ofrenda,
 *    Tzedakah, Hagadá, olla de oro, cuerno de la abundancia, gavillas, tallos de maíz, calabazas decorativas y vuvuzela).
 *  - Las piezas de Halloween, Navidad y Pascua que no estaban en el lote 6 van en `temporada`, con su colección.
 *  - Equivalentes que ya existían y no se redibujan: pecera y acuario (Small y Large Fishtank), dispensador de agua, máquina
 *    expendedora, mini nevera y nevera, cono, pato de goma, reloj de pie, guitarra, piano, arcade, mesa de billar, balón de
 *    fútbol, mesa de ping pong (`mesa-pingpong`) y futbolín (`futbolin`), oso de peluche, caldero, árbol de Navidad, calabazas, escoba, cuadernos, lámparas de escritorio, trofeos,
 *    audífonos, cámara en trípode, panel divisor y bicicletero.
 */

const POT = ['base', 'blanco', 'negro', 'azul'];
const FLOR = ['base', 'amarillo', 'morado', 'blanco'];
const COLOR = ['base', 'azul', 'verde', 'amarillo'];
const LUZ_VELA = luz(CALIDA, 2.2, 0.6);
const LUZ_LAMPARA = luz(CALIDA, 3, 0.7);

interface Op {
  ancho?: number;
  alto?: number;
  s?: number;
  /** Apoyado sobre un escritorio o una mesa. */
  ap?: boolean;
  /** Se puede pisar. */
  libre?: boolean;
  v?: string[];
  luz?: ReturnType<typeof luz>;
  bloquea?: [number, number][];
  /** Capa de dibujo (por defecto `objeto`). */
  capa?: 'suelo' | 'objeto' | 'sobre';
}

const d = (id: string, nombre: string, etiquetas: string[], o: Op = {}, extra: { categoria?: 'decoracion' | 'juegos' | 'temporada'; coleccion?: ColeccionId } = {}): ObjetoCatalogo =>
  def({
    id,
    nombre,
    categoria: extra.categoria ?? 'decoracion',
    ancho: o.ancho ?? 1,
    alto: o.alto ?? 1,
    sobresale: o.s ?? 0,
    ...(o.ap === true ? { apoyado: true, bloquea: 'nada' as const } : {}),
    ...(o.libre === true ? { bloquea: 'nada' as const } : {}),
    ...(o.bloquea !== undefined ? { bloquea: o.bloquea } : {}),
    orientaciones: U,
    variantes: o.v ?? ['base'],
    ...(o.luz !== undefined ? { emisor: o.luz } : {}),
    ...(o.capa !== undefined ? { capa: o.capa } : {}),
    ...(extra.coleccion !== undefined ? { coleccion: extra.coleccion } : {}),
    etiquetas,
    lote: 10,
  });

// ---------- Plantas y macetas ----------
export const LOTE_10_PLANTAS: readonly ObjetoCatalogo[] = [
  d('hosta-chica', 'Hosta pequeña en maceta', ['planta', 'hosta', 'escritorio'], { s: 8, ap: true }),
  d('hosta-grande', 'Hosta grande', ['planta', 'hosta', 'verde'], { s: 16, v: POT }),
  d('monstera', 'Monstera', ['planta', 'monstera', 'verde'], { s: 32, v: POT }),
  d('maceta-ceramica', 'Maceta de cerámica', ['maceta', 'cerámica', 'planta'], { s: 16, v: POT }),
  d('maceta-bambu', 'Bambú en maceta', ['planta', 'bambú', 'maceta'], { s: 32 }),
  d('ficus-lira', 'Ficus lira', ['planta', 'ficus', 'verde'], { s: 32, v: POT }),
  d('ave-paraiso-en-flor', 'Ave del paraíso en flor', ['planta', 'flor', 'tropical'], { s: 32 }),
  d('jardinera-enredadera', 'Jardinera con enredadera', ['planta', 'enredadera', 'jardinera'], { s: 32, v: FLOR }),
  d('planta-espaldera', 'Planta con espaldera', ['planta', 'espaldera', 'verde'], { s: 32 }),
  d('brote', 'Brote', ['planta', 'brote', 'escritorio'], { s: 8, ap: true }),
  d('aloe-vera', 'Aloe vera', ['planta', 'sábila', 'escritorio'], { s: 8, ap: true }),
  d('planta-serpiente', 'Lengua de suegra', ['planta', 'sansevieria', 'verde'], { s: 24, v: POT }),
  d('potos-maceta', 'Potos en maceta', ['planta', 'potos', 'colgante'], { s: 16, v: POT }),
  d('jardinera-larga', 'Jardinera larga rectangular', ['planta', 'jardinera', 'larga'], { ancho: 2, s: 16 }),
  d('helecho-maceta', 'Helecho en maceta', ['planta', 'helecho', 'verde'], { s: 16, v: POT }),
  d('girasoles-maceta', 'Girasoles en maceta', ['planta', 'girasol', 'flor'], { s: 32 }),
  d('calendulas-maceta', 'Caléndulas en maceta', ['planta', 'caléndula', 'flor'], { s: 16 }),
  d('crisantemos', 'Crisantemos', ['planta', 'flor', 'crisantemo'], { s: 8, v: FLOR }),
  d('regadera-maceta', 'Regadera con plantas', ['planta', 'regadera', 'jardín'], { s: 8, v: COLOR }),
  d('planta-en-flor', 'Planta en flor', ['planta', 'flor', 'verde'], { s: 16, v: FLOR }),
  d('hierba-pampa', 'Hierba de la pampa', ['planta', 'pampa', 'seca'], { s: 32 }),
  d('rama-decorativa', 'Rama decorativa', ['planta', 'rama', 'jarrón'], { s: 32 }),
  d('bambu-suerte', 'Bambú de la suerte', ['planta', 'bambú', 'escritorio'], { s: 8, ap: true }),
  d('lirio-paz', 'Lirio de la paz', ['planta', 'lirio', 'blanca'], { s: 16, v: POT }),
  d('filodendro', 'Filodendro', ['planta', 'filodendro', 'verde'], { s: 24, v: POT }),
  d('ficus', 'Ficus', ['planta', 'ficus', 'árbol'], { s: 40, v: POT }),
  d('palma-maceta', 'Palma en maceta', ['planta', 'palma', 'tropical'], { s: 40, v: POT }),
  d('pasto-ornamental', 'Pasto ornamental', ['planta', 'pasto', 'maceta'], { s: 16, v: POT }),
  d('bonsai', 'Bonsái', ['planta', 'bonsái', 'escritorio'], { s: 8, ap: true }),
  d('cactus-diminuto', 'Cactus diminuto', ['planta', 'cactus', 'escritorio'], { s: 8, ap: true }),
  d('planta-carnivora', 'Planta carnívora gigante', ['planta', 'carnívora', 'curiosidad'], { ancho: 2, alto: 2, s: 32, bloquea: [[0, 1], [1, 1]] }),
  d('cajon-siembra', 'Cajón de siembra', ['planta', 'cajón', 'huerta'], { ancho: 2, s: 8 }),
  d('barrera-plantas', 'Barrera de plantas', ['planta', 'seto', 'divisor'], { ancho: 2, s: 24 }),
  d('terrario', 'Terrario', ['planta', 'terrario', 'vidrio'], { s: 8, ap: true }),
  d('muro-bambu', 'Muro de bambú en maceta', ['planta', 'bambú', 'divisor'], { ancho: 2, s: 32 }),
];

// ---------- Lámparas y velas ----------
export const LOTE_10_LAMPARAS: readonly ObjetoCatalogo[] = [
  d('lampara-arco', 'Lámpara de arco', ['lámpara', 'arco', 'luz'], { s: 40, luz: luz(CALIDA, 3.8, 0.8) }),
  d('lampara-molecular', 'Lámpara molecular', ['lámpara', 'molécula', 'luz'], { s: 8, ap: true, luz: LUZ_LAMPARA }),
  d('lampara-maceta-panton', 'Lámpara maceta de diseño', ['lámpara', 'diseño', 'luz'], { s: 8, ap: true, v: ['base', 'rojo', 'blanco', 'negro'], luz: LUZ_LAMPARA }),
  d('lampara-tuberia', 'Lámpara de tubería industrial', ['lámpara', 'industrial', 'tubería'], { s: 16, ap: true, luz: LUZ_LAMPARA }),
  d('lampara-floral', 'Lámpara floral', ['lámpara', 'flores', 'luz'], { s: 8, ap: true, luz: LUZ_LAMPARA }),
  d('lampara-lava', 'Lámpara de lava', ['lámpara', 'lava', 'retro'], { s: 8, ap: true, v: ['base', 'azul', 'verde', 'morado'], luz: luz('#FF8FA8', 2.2, 0.6, 'siempre') }),
  d('lampara-tiffany', 'Lámpara Tiffany', ['lámpara', 'vitral', 'antigua'], { s: 8, ap: true, luz: LUZ_LAMPARA }),
  d('lampara-flecos', 'Lámpara de pie con flecos', ['lámpara', 'flecos', 'pie'], { s: 24, v: ['base', 'rojo', 'azul', 'verde'], luz: luz(CALIDA, 3.4, 0.75) }),
  d('candelero-pie', 'Candelero de pie', ['vela', 'candelero', 'pie'], { s: 24, luz: LUZ_VELA }),
  d('candelero-mesa', 'Candelero de mesa', ['vela', 'candelero', 'mesa'], { s: 8, ap: true, luz: LUZ_VELA }),
  d('candelabro-mesa', 'Candelabro de mesa', ['vela', 'candelabro', 'mesa'], { s: 8, ap: true, luz: luz(CALIDA, 2.6, 0.7) }),
  d('candelabro-pie', 'Candelabro de pie', ['vela', 'candelabro', 'pie'], { s: 24, luz: luz(CALIDA, 3, 0.75) }),
  d('farol-marroqui', 'Farol marroquí', ['farol', 'marroquí', 'luz'], { s: 8, luz: LUZ_VELA, v: ['base', 'rojo', 'azul', 'verde'] }),
  d('farol-papel-mesa', 'Farol de papel de escritorio', ['farol', 'papel', 'escritorio'], { s: 8, ap: true, v: ['base', 'rojo', 'azul', 'verde'], luz: luz(CALIDA, 2, 0.55) }),
  d('incienso-varillas', 'Incienso de varillas', ['incienso', 'aroma', 'escritorio'], { s: 8, ap: true }),
];

// ---------- Peceras, relojes, piezas de museo y arte ----------
export const LOTE_10_ARTE: readonly ObjetoCatalogo[] = [
  d('busto-mujer', 'Busto de mármol (mujer)', ['busto', 'mármol', 'escultura'], { s: 16 }),
  d('busto-hombre', 'Busto de mármol (hombre)', ['busto', 'mármol', 'escultura'], { s: 16 }),
  d('urna-griega-baja', 'Urna griega baja', ['urna', 'griega', 'museo'], { s: 8 }),
  d('urna-griega-alta', 'Urna griega alta', ['urna', 'griega', 'museo'], { s: 24 }),
  d('jarron-meiji', 'Jarrón japonés (Meiji)', ['jarrón', 'japonés', 'porcelana'], { s: 16, ap: true }),
  d('jarron-edo', 'Jarrón japonés (Edo)', ['jarrón', 'japonés', 'cerámica'], { s: 8, ap: true }),
  d('jarron-moderno', 'Jarrón moderno', ['jarrón', 'moderno', 'diseño'], { s: 16, ap: true, v: ['base', 'rojo', 'azul', 'negro'] }),
  d('jarron-moderno-redondo', 'Jarrón moderno redondo', ['jarrón', 'moderno', 'redondo'], { s: 8, ap: true, v: ['base', 'rojo', 'azul', 'negro'] }),
  d('jarron-monumental', 'Jarrón monumental', ['jarrón', 'monumental', 'museo'], { s: 40 }),
  d('jarron-rosas', 'Jarrón con rosas', ['jarrón', 'rosas', 'flores'], { s: 16, ap: true, v: FLOR }),
  d('jarron-lirios', 'Jarrón con lirios', ['jarrón', 'lirios', 'flores'], { s: 16, ap: true, v: ['base', 'rojo', 'amarillo', 'morado'] }),
  d('atril-antiguo', 'Atril antiguo', ['atril', 'antiguo', 'madera'], { s: 24 }),
  d('atril-moderno', 'Atril moderno', ['atril', 'moderno', 'conferencia'], { s: 24 }),
  d('estatuilla-alce', 'Estatuilla de alce', ['estatuilla', 'alce', 'figura'], { s: 8, ap: true }),
  d('estatuilla-ciervo', 'Estatuilla de ciervo', ['estatuilla', 'ciervo', 'figura'], { s: 8, ap: true }),
  d('barco-modelo', 'Barco a escala', ['barco', 'maqueta', 'modelo'], { s: 16, ap: true }),
  d('bola-cristal', 'Bola de cristal', ['bola', 'cristal', 'adivinación'], { s: 8, ap: true }),
  d('globo-terraqueo', 'Globo terráqueo', ['globo', 'mundo', 'geografía'], { s: 16, ap: true }),
];

// ---------- Aparatos, instrumentos y objetos de oficina y hogar ----------
export const LOTE_10_PIEZAS: readonly ObjetoCatalogo[] = [
  d('tocadiscos-antiguo', 'Tocadiscos antiguo', ['tocadiscos', 'gramófono', 'música'], { s: 16, ap: true }),
  d('tocadiscos-moderno', 'Tocadiscos de mediados de siglo', ['tocadiscos', 'vinilo', 'música'], { s: 8, ap: true }),
  d('radio-antigua', 'Radio antigua de pie', ['radio', 'antigua', 'música'], { s: 24 }),
  d('microfono-brazo', 'Micrófono de estudio con brazo', ['micrófono', 'estudio', 'podcast'], { s: 16, ap: true }),
  d('microfono-pie', 'Micrófono con pie', ['micrófono', 'pie', 'música'], { s: 32 }),
  d('microfono-escritorio', 'Micrófono de escritorio', ['micrófono', 'escritorio', 'audio'], { s: 8, ap: true }),
  d('maquina-escribir', 'Máquina de escribir', ['máquina', 'escribir', 'retro'], { s: 8, ap: true }),
  d('telefono-disco', 'Teléfono de disco', ['teléfono', 'retro', 'escritorio'], { ap: true, v: ['base', 'rojo', 'azul', 'amarillo'] }),
  d('libro-cerrado', 'Libro cerrado', ['libro', 'lectura', 'escritorio'], { ap: true, v: ['base', 'azul', 'verde', 'amarillo'] }),
  d('libro-abierto', 'Libro abierto', ['libro', 'lectura', 'escritorio'], { ap: true }),
  d('documento', 'Documento', ['documento', 'papel', 'escritorio'], { ap: true }),
  d('documentos-pila', 'Pila de documentos', ['documentos', 'papeles', 'escritorio'], { ap: true }),
  d('notas-artista', 'Notas de artista', ['notas', 'dibujo', 'escritorio'], { ap: true }),
  d('notas-pluma', 'Notas con pluma y tintero', ['notas', 'pluma', 'escritorio'], { ap: true }),
  d('plano-azul', 'Plano arquitectónico', ['plano', 'arquitectura', 'escritorio'], { ap: true }),
  d('caballete-cartel', 'Caballete con cartel', ['caballete', 'cartel', 'presentación'], { s: 32 }),
  d('radiador', 'Radiador', ['radiador', 'calefacción', 'hogar'], { ancho: 2 }),
  d('calefactor', 'Calefactor eléctrico', ['calefactor', 'calefacción', 'hogar'], { s: 8, luz: luz('#FF9A5A', 1.8, 0.5, 'siempre') }),
  d('aire-portatil', 'Aire acondicionado portátil', ['aire', 'clima', 'hogar'], { s: 16 }),
  d('ventilador-giratorio', 'Ventilador giratorio', ['ventilador', 'clima', 'hogar'], { s: 24 }),
  d('minibar', 'Minibar', ['minibar', 'bebidas', 'bar'], { s: 16 }),
  d('contenedores-reciclaje', 'Contenedores de reciclaje', ['reciclaje', 'basura', 'oficina'], { ancho: 2, s: 8 }),
  d('hielera-bebidas', 'Hielera con bebidas', ['hielera', 'bebidas', 'fiesta'], { s: 8, v: ['base', 'rojo', 'verde', 'amarillo'] }),
  d('cesta-picnic', 'Cesta de picnic', ['cesta', 'picnic', 'mimbre'], { ap: true }),
  d('cesta', 'Cesta', ['cesta', 'mimbre', 'hogar'], { ap: true }),
  d('cesta-manzanas', 'Cesta de manzanas', ['cesta', 'manzanas', 'fruta'], { ap: true }),
  d('barril-chico', 'Barril chico', ['barril', 'madera', 'bodega'], { s: 8 }),
  d('barril-grande', 'Barril grande', ['barril', 'madera', 'bodega'], { s: 16 }),
  d('flecha-flotante', 'Flecha flotante', ['flecha', 'señal', 'guía'], { s: 16, libre: true, v: ['base', 'rojo', 'azul', 'verde'] }),
  d('flecha-piso', 'Flecha de piso', ['flecha', 'señal', 'guía'], { libre: true, capa: 'suelo', v: ['base', 'rojo', 'azul', 'verde'] }),
  d('biombo-floral', 'Biombo floral', ['biombo', 'floral', 'divisor'], { ancho: 2, s: 24 }),
  d('biombo-seda', 'Biombo de seda', ['biombo', 'seda', 'divisor'], { ancho: 2, s: 24 }),
  d('divisor-industrial', 'Divisor industrial', ['divisor', 'industrial', 'metal'], { ancho: 2, s: 24 }),
];

// ---------- Deportes y juegos ----------
const dj = (id: string, nombre: string, etiquetas: string[], o: Op = {}): ObjetoCatalogo => d(id, nombre, ['deporte', ...etiquetas], o, { categoria: 'juegos' });

export const LOTE_10_DEPORTES: readonly ObjetoCatalogo[] = [
  dj('raqueta-tenis', 'Raqueta de tenis', ['tenis', 'raqueta'], { s: 8, libre: true }),
  dj('bolsa-golf', 'Bolsa de golf', ['golf', 'palos'], { s: 24 }),
  dj('palo-golf', 'Palo de golf', ['golf', 'palo'], { s: 8, libre: true }),
  dj('palo-hockey', 'Palo de hockey', ['hockey', 'palo'], { s: 8, libre: true }),
  dj('bate-beisbol', 'Bate de béisbol', ['béisbol', 'bate'], { s: 8, libre: true }),
  dj('pelota-beisbol', 'Pelota de béisbol', ['béisbol', 'pelota'], { libre: true }),
  dj('balon-baloncesto', 'Balón de baloncesto', ['baloncesto', 'balón'], { libre: true }),
  dj('balon-voleibol', 'Balón de voleibol', ['voleibol', 'balón'], { libre: true }),
  dj('balon-americano', 'Balón de fútbol americano', ['fútbol americano', 'balón'], { libre: true }),
  dj('pelota-criquet', 'Pelota de críquet', ['críquet', 'pelota'], { libre: true }),
  dj('pelota-tenis', 'Pelota de tenis', ['tenis', 'pelota'], { libre: true }),
  dj('balon-playa', 'Balón de playa', ['playa', 'balón'], { libre: true, v: ['base', 'azul', 'verde', 'morado'] }),
  dj('tabla-surf', 'Tabla de surf', ['surf', 'tabla'], { s: 32, libre: true, v: ['base', 'azul', 'rojo', 'verde'] }),
  dj('tabla-surf-soporte', 'Tabla de surf en soporte', ['surf', 'tabla', 'soporte'], { s: 32, v: ['base', 'azul', 'rojo', 'verde'] }),
  dj('pared-escalada', 'Pared de escalada', ['escalada', 'pared'], { ancho: 2, s: 32 }),
  dj('aro-croquet', 'Aro de croquet', ['croquet', 'jardín'], { libre: true }),
];

// ---------- Temporada: piezas de Halloween, Navidad y Pascua que faltaban ----------
const dt = (id: string, nombre: string, coleccion: ColeccionId, etiquetas: string[], o: Op = {}): ObjetoCatalogo => d(id, nombre, [...etiquetas, 'evento'], o, { categoria: 'temporada', coleccion });

export const LOTE_10_TEMPORADA: readonly ObjetoCatalogo[] = [
  dt('calavera', 'Calavera', 'halloween', ['calavera', 'halloween'], { ap: true }),
  dt('ataud-tenebroso', 'Ataúd tenebroso', 'halloween', ['ataúd', 'halloween'], { s: 32 }),
  dt('mesa-de-bruja', 'Mesa de bruja', 'halloween', ['bruja', 'pociones', 'halloween'], { s: 16 }),
  dt('cubeta-dulces', 'Cubeta de dulces', 'halloween', ['dulces', 'halloween'], { ap: true, v: ['base', 'verde', 'morado', 'azul'] }),
  dt('cascanueces', 'Cascanueces', 'navidad', ['cascanueces', 'navidad'], { s: 16 }),
  dt('cascanueces-gigante', 'Cascanueces gigante', 'navidad', ['cascanueces', 'navidad', 'gigante'], { s: 48 }),
  dt('cartel-polo-norte', 'Cartel del Polo Norte', 'navidad', ['cartel', 'navidad'], { s: 24 }),
  dt('cartel-polo-norte-nevado', 'Cartel del Polo Norte nevado', 'navidad', ['cartel', 'navidad', 'nieve'], { s: 24 }),
  dt('regalo-gigante', 'Regalo gigante', 'navidad', ['regalo', 'navidad', 'gigante'], { s: 16, v: ['base', 'azul', 'verde', 'amarillo'] }),
  dt('canasta-pascua', 'Canasta de pascua', 'pascua', ['canasta', 'pascua'], { ap: true }),
];

export const LOTE_10: readonly ObjetoCatalogo[] = [
  ...LOTE_10_PLANTAS,
  ...LOTE_10_LAMPARAS,
  ...LOTE_10_ARTE,
  ...LOTE_10_PIEZAS,
  ...LOTE_10_DEPORTES,
  ...LOTE_10_TEMPORADA,
];
