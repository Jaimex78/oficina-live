import type { ObjetoCatalogo } from '../arte';
import type { CategoriaId, ColeccionId } from '../arte';
import { CALIDA, MURO, def, luz } from '../inventario-def';

/**
 * Lote 12: objetos de pared de Gather v2, cada pieza con su dibujo propio (atlas `objetos-v13`). Relojes, cuadros y pinturas,
 * ventanas, luces, plantas de pared, paneles, banderas y otros colgantes. Ver `arte/GUIA-OBJETOS-V2.md`.
 *
 * Reglas del lote (las revisa `arte/tests/objetos-lote12.test.ts`):
 *  - Todo lleva las tres orientaciones de pared (`MURO`: S, E y O). Lo colgado (`montado`) no bloquea; las ventanas son
 *    aberturas de la pared (`pared: 'abertura'`, 1 casilla, sobresale 32) como `pared-ventana`.
 *  - Las ventanas van en la categoría `paredes`; el resto, en `decoracion`, salvo las banderas y piezas de fiesta
 *    (`temporada`, con su colección).
 *  - Quedan fuera: el trofeo de ciervo y el murciélago disecado (animales), los banderines y banderas de otros países (Canadá,
 *    EE. UU., Irlanda, Juneteenth), las festividades religiosas (Eid, la cruz, el Año Nuevo Lunar y sus estandartes), el mapa de
 *    Japón, el póster del Tío Sam y las banderas de orgullo distintas del arcoíris y del progreso.
 *  - Equivalentes que ya existían y no se redibujan: reloj de pared básico (`reloj-pared`), TV de pared (`tv-pared`), corcho
 *    (`corcho`), cuadros genéricos (`cuadro-chico`, `cuadro-grande`), cuadro de mariposas grande (`cuadro-mariposas`), corona,
 *    guirnalda y calcetines de Navidad (lote 6), espejo (`espejo`) y cortinas (`cortinas`).
 */

const COLORES = ['base', 'azul', 'rojo', 'verde'];

interface Op {
  /** Casillas de ancho (1 por defecto). */
  a?: number;
  /** Filas que sobresale el cuadro por arriba (8 en 8). */
  s?: number;
  v?: string[];
  cat?: CategoriaId;
  col?: ColeccionId;
  luz?: ReturnType<typeof luz>;
}

const d = (id: string, nombre: string, etiquetas: string[], o: Op = {}): ObjetoCatalogo =>
  def({
    id,
    nombre,
    categoria: o.cat ?? 'decoracion',
    montado: true,
    bloquea: 'nada',
    ancho: o.a ?? 1,
    sobresale: o.s ?? 0,
    orientaciones: MURO,
    variantes: o.v ?? ['base'],
    ...(o.luz !== undefined ? { emisor: o.luz } : {}),
    ...(o.col !== undefined ? { coleccion: o.col } : {}),
    etiquetas,
    lote: 12,
  });

// ---------- Ventanas (aberturas de la pared) ----------
const ventana = (id: string, nombre: string, etiquetas: string[], conLuz = true): ObjetoCatalogo =>
  def({
    id,
    nombre,
    categoria: 'paredes',
    pared: 'abertura',
    ventana: true,
    sobresale: 32,
    orientaciones: MURO,
    ...(conLuz ? { emisor: luz('#EAF4FF', 2.2, 0.35, 'siempre') } : {}),
    etiquetas: ['ventana', 'pared', ...etiquetas],
    lote: 12,
  });

export const LOTE_12_VENTANAS: readonly ObjetoCatalogo[] = [
  ventana('ventana-batiente', 'Ventana batiente', ['batiente', 'casement']),
  ventana('ventana-guillotina', 'Ventana de guillotina', ['guillotina', 'sash']),
  ventana('ventana-guillotina-abierta', 'Ventana de guillotina abierta', ['guillotina', 'abierta']),
  ventana('ventana-cortinas', 'Ventana con cortinas', ['cortinas', 'tela']),
  ventana('ventana-escalonada', 'Ventana escalonada', ['escalonada', 'paneles']),
  ventana('ventana-curva', 'Ventana de arco', ['curva', 'arco']),
  ventana('ventana-redonda', 'Ventana redonda', ['redonda', 'ojo de buey']),
  ventana('ventana-redonda-hiedra', 'Ventana redonda con hiedra', ['redonda', 'hiedra', 'plantas']),
  ventana('ventana-hexagonal', 'Ventana hexagonal', ['hexagonal', 'panorámica']),
  ventana('ventana-moderna', 'Ventana moderna', ['moderna', 'minimalista']),
  ventana('ventana-antigua', 'Ventana antigua', ['antigua', 'clásica', 'madera']),
  ventana('ventana-aire-acondicionado', 'Ventana con aire acondicionado', ['aire acondicionado', 'clima'], false),
];

// ---------- Relojes, cuadros y pinturas ----------
export const LOTE_12_ARTE: readonly ObjetoCatalogo[] = [
  d('reloj-minimalista', 'Reloj de pared minimalista', ['reloj', 'pared', 'minimalista'], { v: ['base', 'rojo', 'negro', 'blanco'] }),
  d('reloj-estandar', 'Reloj de pared estándar', ['reloj', 'pared', 'números'], { v: ['base', 'rojo', 'negro'] }),
  d('reloj-pendulo', 'Reloj de péndulo de pared', ['reloj', 'péndulo', 'pared'], { s: 16 }),
  d('cuadro-mondrian', 'Pintura estilo Mondrian', ['cuadro', 'mondrian', 'arte'], { s: 8 }),
  d('cuadro-abstracto-rectangulos', 'Pintura abstracta de rectángulos', ['cuadro', 'abstracto', 'rectángulos'], { a: 2, v: ['base', 'rojo', 'verde'] }),
  d('cuadro-abstracto-circulos', 'Pintura abstracta de círculos', ['cuadro', 'abstracto', 'círculos'], { a: 2, v: ['base', 'azul', 'verde'] }),
  d('cuadro-cubista', 'Pintura cubista', ['cuadro', 'cubismo', 'arte'], { s: 8 }),
  d('retrato-dama', 'Retrato al óleo de una dama', ['retrato', 'óleo', 'clásico'], { s: 8 }),
  d('retrato-caballero', 'Retrato al óleo de un caballero', ['retrato', 'óleo', 'clásico'], { s: 8 }),
  d('paisaje-rio', 'Paisaje de río', ['paisaje', 'río', 'óleo'], { a: 2 }),
  d('cuadro-barco', 'Pintura de un barco', ['barco', 'mar', 'óleo'], { a: 2 }),
  d('naturaleza-muerta', 'Naturaleza muerta', ['bodegón', 'frutas', 'óleo'], { a: 2 }),
  d('mariposas-enmarcadas-chico', 'Mariposas enmarcadas pequeño', ['mariposas', 'enmarcado', 'naturaleza']),
  d('cuadros-siluetas', 'Cuadros de siluetas', ['siluetas', 'cuadros', 'arte'], { a: 2 }),
  d('ilustracion-botanica', 'Ilustración botánica', ['botánica', 'plantas', 'lámina'], { s: 8 }),
  d('poster-tierra', 'Póster de la Tierra', ['póster', 'tierra', 'planeta'], { s: 8 }),
  d('poster-parques', 'Póster de parques nacionales', ['póster', 'parques', 'naturaleza'], { s: 8 }),
  d('poster-motivacional', 'Póster motivacional', ['póster', 'motivación', 'oficina']),
  d('diploma-enmarcado', 'Diploma enmarcado', ['diploma', 'título', 'oficina']),
  d('plano-enmarcado', 'Plano enmarcado', ['plano', 'blueprint', 'arquitectura'], { s: 8 }),
  d('mapa-mundi', 'Mapa del mundo', ['mapa', 'mundo', 'viajes'], { a: 2 }),
  d('foto-ciudad', 'Fotografía de la ciudad', ['foto', 'ciudad', 'skyline'], { a: 2 }),
  d('arte-engranajes', 'Arte de engranajes', ['engranajes', 'industrial', 'arte'], { s: 8 }),
  d('arte-urbano', 'Arte urbano', ['grafiti', 'urbano', 'arte'], { s: 8 }),
  d('estrella-mar-enmarcada', 'Estrella de mar enmarcada', ['estrella de mar', 'mar', 'enmarcado']),
  d('estampado-shibori', 'Estampado shibori', ['shibori', 'tela', 'índigo'], { s: 8 }),
  d('estampado-hojas', 'Estampado de hojas', ['hojas', 'estampado', 'lámina'], { s: 8 }),
  d('macrame-cerrado', 'Macramé colgante cerrado', ['macramé', 'tejido', 'bohemio'], { s: 8 }),
  d('macrame-abierto', 'Macramé colgante abierto', ['macramé', 'tejido', 'bohemio'], { s: 8 }),
  d('canastas-pared', 'Canastas decorativas de pared', ['canastas', 'mimbre', 'bohemio'], { a: 2 }),
  d('telefono-pared-antiguo', 'Teléfono antiguo de pared', ['teléfono', 'antiguo', 'retro'], { s: 8 }),
];

// ---------- Luces ----------
const CAL = luz(CALIDA, 2, 0.45, 'noche');
export const LOTE_12_LUCES: readonly ObjetoCatalogo[] = [
  d('luces-cuerda-colores', 'Cuerda de luces multicolor', ['luces', 'cuerda', 'colores'], { a: 2, luz: luz('#FFD79A', 2.4, 0.5, 'noche', true) }),
  d('luces-cuerda-color', 'Cuerda de luces de un color', ['luces', 'cuerda'], { a: 2, v: COLORES, luz: luz(CALIDA, 2.4, 0.5, 'noche', true) }),
  d('linterna-papel-pastel', 'Linterna de papel pastel', ['linterna', 'papel', 'pastel'], { s: 8, v: ['base', 'azul', 'verde', 'amarillo', 'morado'], luz: CAL }),
  d('farol-marroqui-pared', 'Farol marroquí de pared', ['farol', 'marroquí', 'metal'], { s: 8, luz: luz('#FFB35C', 2.2, 0.5, 'noche', true) }),
  d('luz-industrial-pared', 'Luz industrial de pared', ['luz', 'industrial', 'granja'], { s: 8, luz: luz(CALIDA, 2.6, 0.55, 'noche') }),
  d('lampara-pared', 'Lámpara de pared', ['lámpara', 'aplique', 'pared'], { s: 8, v: ['base', 'rojo', 'negro'], luz: luz(CALIDA, 2.4, 0.5, 'noche') }),
  d('luces-hexagonales', 'Paneles de luz hexagonales', ['luces', 'hexágonos', 'gamer'], { a: 2, s: 8, v: ['base', 'azul', 'rojo', 'verde'], luz: luz(CALIDA, 2.4, 0.5, 'noche') }),
];

// ---------- Plantas de pared, paneles y otros colgantes ----------
export const LOTE_12_PLANTAS: readonly ObjetoCatalogo[] = [
  d('muro-musgo', 'Muro de musgo', ['musgo', 'plantas', 'pared'], { a: 2, s: 8 }),
  d('muro-plantas', 'Muro de plantas', ['plantas', 'jardín vertical', 'pared'], { a: 2, s: 16 }),
  d('planta-pared-chica', 'Planta de pared pequeña', ['planta', 'pared', 'maceta'], { s: 8 }),
  d('potos-colgante', 'Poto colgante', ['poto', 'planta', 'colgante'], { s: 16 }),
  d('jardinera-pared', 'Jardinera de pared', ['jardinera', 'aplique', 'plantas'], { s: 8 }),
  d('jardinera-ventana', 'Jardinera de ventana', ['jardinera', 'ventana', 'flores'], { v: ['base', 'rojo', 'amarillo'] }),
  d('paneles-acusticos', 'Paneles acústicos', ['paneles', 'acústica', 'oficina'], { a: 2, s: 8, v: ['base', 'gris', 'rojo'] }),
];

export const LOTE_12_OTROS: readonly ObjetoCatalogo[] = [
  d('tablero-corcho-grande', 'Tablero de corcho grande', ['corcho', 'tablero', 'anuncios'], { a: 2, s: 8 }),
  d('extintor', 'Extintor', ['extintor', 'seguridad', 'incendio'], { s: 8 }),
  d('boton-emergencia', 'Botón de emergencia', ['emergencia', 'seguridad', 'alarma']),
  d('armario-pared', 'Armario de pared', ['armario', 'pared', 'almacenaje'], { a: 2, s: 8, v: ['base', 'madera', 'blanco'] }),
  d('repisa-flotante', 'Repisa flotante con libros', ['repisa', 'libros', 'flotante'], { a: 2 }),
  d('chimenea-antigua', 'Chimenea antigua', ['chimenea', 'fuego', 'antigua'], { a: 2, s: 24, luz: luz('#FF9A3C', 3, 0.65, 'noche', true) }),
  d('aire-acondicionado-pared', 'Aire acondicionado de pared', ['aire acondicionado', 'clima', 'split'], { a: 2 }),
  d('tuberias', 'Tuberías industriales', ['tuberías', 'industrial', 'loft'], { a: 2, s: 8 }),
  d('pared-ladrillo', 'Pared de ladrillo expuesto', ['ladrillo', 'loft', 'pared'], { a: 2, s: 16 }),
  d('espejo-chippendale', 'Espejo Chippendale', ['espejo', 'clásico', 'marco'], { s: 16 }),
  d('timon-barco', 'Timón de barco', ['timón', 'barco', 'náutico'], { s: 8 }),
  d('placa-trofeo', 'Trofeo de pared', ['trofeo', 'placa', 'premio'], { s: 8 }),
  d('letrero-oficina-live', 'Letrero Oficina Live', ['letrero', 'marca', 'oficina live'], { a: 3, s: 8, luz: luz('#FFFFFF', 2.4, 0.3, 'siempre') }),
  d('bandera-orgullo', 'Bandera del orgullo', ['bandera', 'orgullo', 'arcoíris'], { s: 8 }),
  d('bandera-progreso', 'Bandera del progreso', ['bandera', 'orgullo', 'progreso'], { s: 8 }),
  d('bandera-piratas', 'Bandera pirata', ['bandera', 'pirata', 'calavera'], { s: 8 }),
  d('bandera-colombia-pared', 'Bandera de Colombia de pared', ['bandera', 'colombia', 'tricolor'], { s: 8, cat: 'temporada', col: 'colombia' }),
  d('banderines-halloween', 'Banderines de Halloween', ['halloween', 'banderines', 'pared'], { a: 2, cat: 'temporada', col: 'halloween' }),
  d('trenza-ajo', 'Trenza de ajos', ['ajo', 'halloween', 'vampiro'], { s: 8, cat: 'temporada', col: 'halloween' }),
  d('copos-pared', 'Copos de nieve de pared', ['copos', 'nieve', 'navidad'], { s: 8, cat: 'temporada', col: 'navidad' }),
];

export const LOTE_12: readonly ObjetoCatalogo[] = [...LOTE_12_VENTANAS, ...LOTE_12_ARTE, ...LOTE_12_LUCES, ...LOTE_12_PLANTAS, ...LOTE_12_OTROS];
