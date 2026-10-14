import type { ObjetoCatalogo } from '../arte';
import { CUATRO, HV, MADERAS, SILLA, U, def } from '../inventario-def';

/**
 * Lote 9: asientos, mesas, escritorios y almacenaje de Gather v2, cada uno con su dibujo propio (atlas `objetos-v10`).
 * Ver `arte/GUIA-OBJETOS-V2.md`. Los tamaños en casillas de las mesas (3 de ancho por 1, 2 o 3 de fondo) y de los escritorios
 * (3 de ancho) vienen de Gather; el resto se estimó por función y se anota en la guía.
 *
 * Reglas del lote (las revisa `arte/tests/objetos-lote9.test.ts`):
 *  - Asientos: `interaccion: 'sentarse'`, cuatro orientaciones (hacia dónde mira quien se sienta), salvo el puf saco.
 *  - Escritorios: categoría `puestos`, 3 casillas de ancho, igual que los del lote 8.
 *  - Mesas: categoría `mesas`, orientaciones `S` y `E` (el lado largo horizontal o vertical).
 *  - Almacenaje: categoría `decoracion` (NO `puestos`: lo que está en `puestos` cuenta como escritorio para asignar puestos).
 */

const TAPIZ = ['base', 'rojo', 'azul', 'verde', 'negro'];
const METAL = ['base', 'rojo', 'azul', 'negro'];
/** Para bases oscuras (negro): el blanco sí cambia y el negro no. */
const OSCURO = ['base', 'rojo', 'azul', 'blanco'];
const ESCRITORIO = ['base', 'madera', 'negro', 'rojo'];

// ---------- Asientos ----------
const asiento = (id: string, nombre: string, etiquetas: string[], o: { ancho?: number; alto?: number; sobresale?: number; variantes?: string[]; unico?: boolean } = {}): ObjetoCatalogo =>
  def({
    id,
    nombre,
    categoria: 'asientos',
    ancho: o.ancho ?? 1,
    alto: o.alto ?? 1,
    sobresale: o.sobresale ?? 0,
    orientaciones: o.unico === true ? U : CUATRO,
    variantes: o.variantes ?? TAPIZ,
    interaccion: 'sentarse',
    etiquetas: ['asiento', ...etiquetas],
    lote: 9,
  });

const ASIENTOS: readonly ObjetoCatalogo[] = [
  asiento('silla-espacial', 'Silla espacial', ['silla', 'futurista', 'cápsula'], { sobresale: 8, variantes: METAL }),
  asiento('silla-z', 'Silla en Z', ['silla', 'diseño', 'voladizo'], { variantes: SILLA }),
  asiento('silla-jardin-plegable', 'Silla de jardín plegable', ['silla', 'jardín', 'exterior', 'plegable']),
  asiento('silla-giratoria-industrial', 'Silla giratoria industrial', ['silla', 'giratoria', 'industrial', 'taller'], { variantes: OSCURO }),
  asiento('silla-simple', 'Silla simple', ['silla', 'madera', 'comedor'], { variantes: MADERAS }),
  asiento('silla-chippendale', 'Silla Chippendale', ['silla', 'antigua', 'tallada'], { sobresale: 8 }),
  asiento('silla-salon-antigua', 'Silla de salón antigua', ['silla', 'antigua', 'salón'], { sobresale: 8 }),
  asiento('sillon-lounger', 'Sillón lounger de diseño', ['sillón', 'descanso', 'diseño', 'cuero'], { sobresale: 8 }),
  asiento('sofa-cuero-moderno', 'Sofá de cuero de mediados de siglo', ['sofá', 'cuero', 'descanso', 'moderno'], { ancho: 3, sobresale: 8 }),
  asiento('silla-director', 'Silla de director', ['silla', 'director', 'plegable', 'set'], { sobresale: 8 }),
  asiento('banca-parque', 'Banca de parque', ['banca', 'parque', 'exterior'], { ancho: 2, variantes: MADERAS }),
  asiento('butaca-art-deco', 'Butaca art déco', ['butaca', 'art déco', 'descanso'], { sobresale: 8 }),
  asiento('modular-segmento', 'Módulo de sofá (segmento)', ['sofá', 'modular', 'segmento', 'descanso'], { sobresale: 8 }),
  asiento('banca-jardin', 'Banca de jardín', ['banca', 'jardín', 'exterior'], { ancho: 2 }),
  asiento('butaca-knoll', 'Butaca de diseño con patas finas', ['butaca', 'diseño', 'descanso'], { sobresale: 8 }),
  asiento('banca-con-cojin', 'Banca con cojín', ['banca', 'cojín', 'recibidor'], { ancho: 2 }),
  asiento('sillon-huevo', 'Sillón huevo', ['sillón', 'huevo', 'diseño', 'descanso'], { sobresale: 16 }),
  asiento('butaca-aviador', 'Butaca de aviador', ['butaca', 'aviador', 'cuero', 'descanso'], { sobresale: 8 }),
  asiento('modular-exterior-segmento', 'Módulo de sofá exterior (segmento)', ['sofá', 'modular', 'exterior', 'segmento'], { sobresale: 8 }),
  asiento('silla-wabi-sabi', 'Silla wabi-sabi', ['silla', 'japonesa', 'rústica', 'madera'], { variantes: MADERAS }),
  asiento('silla-cafe', 'Silla de café', ['silla', 'café', 'bistró'], { variantes: SILLA }),
  asiento('butaca-nube', 'Butaca nube', ['butaca', 'nube', 'mullida', 'descanso'], { sobresale: 8 }),
  asiento('silla-adirondack', 'Silla Adirondack', ['silla', 'exterior', 'jardín', 'descanso'], { sobresale: 8, variantes: MADERAS }),
  asiento('sofa-antiguo', 'Sofá antiguo', ['sofá', 'antiguo', 'tapizado', 'descanso'], { ancho: 3, sobresale: 8 }),
  asiento('sofa-knoll', 'Sofá de diseño de patas finas', ['sofá', 'diseño', 'descanso'], { ancho: 2, sobresale: 8 }),
  asiento('silla-columpio', 'Silla columpio', ['silla', 'columpio', 'colgante', 'descanso'], { sobresale: 24 }),
  asiento('silla-comedor-industrial', 'Silla de comedor industrial', ['silla', 'comedor', 'industrial', 'metal'], { variantes: SILLA }),
  asiento('silla-plastica', 'Silla de plástico', ['silla', 'plástico', 'sala'], { variantes: SILLA }),
  asiento('butaca-acogedora', 'Butaca acogedora', ['butaca', 'acogedora', 'descanso'], { sobresale: 8 }),
  asiento('modular-exterior-esquina', 'Módulo de sofá exterior (esquina)', ['sofá', 'modular', 'exterior', 'esquina'], { sobresale: 8 }),
  asiento('silla-barcelona', 'Silla de cuero con patas en X', ['silla', 'cuero', 'diseño', 'descanso'], { sobresale: 8 }),
  asiento('butaca-en-u', 'Butaca en U', ['butaca', 'diseño', 'descanso'], { sobresale: 8 }),
  asiento('puf-saco', 'Puf saco', ['puf', 'saco', 'descanso', 'ocio'], { unico: true }),
  asiento('sillon-huevo-mimbre', 'Sillón huevo de mimbre', ['sillón', 'huevo', 'mimbre', 'colgante'], { sobresale: 24, variantes: MADERAS }),
  asiento('sofa-lecorbusier', 'Sofá de cubo con marco tubular', ['sofá', 'diseño', 'cuero', 'descanso'], { ancho: 3, sobresale: 8 }),
  asiento('sofa-art-deco', 'Sofá art déco', ['sofá', 'art déco', 'descanso'], { ancho: 2, sobresale: 8 }),
  asiento('silla-auxiliar-moderna', 'Silla auxiliar moderna', ['silla', 'moderna', 'auxiliar'], { variantes: SILLA }),
  asiento('chaise-antigua', 'Chaise antigua', ['chaise', 'diván', 'antigua', 'descanso'], { alto: 2, sobresale: 8 }),
  asiento('silla-malla-ergonomica', 'Silla de malla ergonómica', ['silla', 'ergonómica', 'oficina', 'malla'], { sobresale: 8, variantes: SILLA }),
  asiento('sofa-aviador', 'Sofá de aviador', ['sofá', 'aviador', 'cuero', 'descanso'], { ancho: 3, sobresale: 8 }),
  asiento('silla-giratoria-madera', 'Silla giratoria de madera', ['silla', 'giratoria', 'madera', 'oficina'], { variantes: MADERAS }),
  asiento('silla-oficina-delgada', 'Silla de oficina delgada', ['silla', 'oficina', 'delgada'], { variantes: OSCURO }),
  asiento('silla-camping', 'Silla de camping', ['silla', 'camping', 'plegable', 'exterior']),
  asiento('modular-esquina', 'Módulo de sofá (esquina)', ['sofá', 'modular', 'esquina', 'descanso'], { sobresale: 8 }),
  asiento('silla-ratan', 'Silla de ratán', ['silla', 'ratán', 'terraza'], { sobresale: 8, variantes: MADERAS }),
  asiento('butaca-lecorbusier', 'Butaca de cubo con marco tubular', ['butaca', 'diseño', 'cuero', 'descanso'], { sobresale: 8 }),
  asiento('silla-roble-curvo', 'Silla de roble con respaldo curvo', ['silla', 'roble', 'curva', 'comedor'], { variantes: MADERAS }),
  asiento('silla-modernista', 'Silla modernista', ['silla', 'modernista', 'madera'], { sobresale: 8, variantes: MADERAS }),
  asiento('silla-perezosa', 'Silla perezosa reclinable', ['silla', 'reclinable', 'descanso', 'lectura'], { sobresale: 8 }),
];

// ---------- Mesas (3 de ancho; 1, 2 o 3 de fondo) ----------
const FAMILIAS_MESA: ReadonlyArray<readonly [string, string, string[]]> = [
  ['tronco', 'Mesa de tronco', ['tronco', 'rústica', 'madera']],
  ['chippendale', 'Mesa Chippendale', ['chippendale', 'antigua', 'tallada']],
  ['industrial', 'Mesa industrial', ['industrial', 'metal', 'taller']],
  ['simple', 'Mesa simple', ['simple', 'madera', 'comedor']],
  ['pesada', 'Mesa pesada', ['pesada', 'maciza', 'rústica']],
  ['octagonal', 'Mesa octagonal', ['octagonal', 'reunión', 'ocho lados']],
  ['conferencia', 'Mesa de conferencia', ['conferencia', 'reunión', 'sala']],
];

const mesasFamilia: ObjetoCatalogo[] = FAMILIAS_MESA.flatMap(([clave, nombre, etiquetas]) =>
  [1, 2, 3].map((fondo) =>
    def({ id: `mesa-${clave}-3x${fondo}`, nombre: `${nombre} (3 x ${fondo})`, categoria: 'mesas', ancho: 3, alto: fondo, sobresale: 10, orientaciones: HV, variantes: MADERAS, etiquetas: ['mesa', ...etiquetas], lote: 9 }),
  ),
);

const mesa = (id: string, nombre: string, ancho: number, alto: number, etiquetas: string[], sobresale = 10, orientaciones = HV, variantes = MADERAS): ObjetoCatalogo =>
  def({ id, nombre, categoria: 'mesas', ancho, alto, sobresale, orientaciones, variantes, etiquetas: ['mesa', ...etiquetas], lote: 9 });

const MESAS_SUELTAS: readonly ObjetoCatalogo[] = [
  mesa('mesa-lateral-moderna', 'Mesa lateral de mediados de siglo', 1, 1, ['lateral', 'moderna', 'redonda'], 8, U),
  mesa('mesa-centro-redonda', 'Mesa de centro redonda', 2, 2, ['centro', 'redonda', 'descanso'], 8, U),
  mesa('mesa-elegante-marmol', 'Mesa elegante de mármol', 1, 1, ['elegante', 'mármol', 'redonda'], 8, U, ['base', 'rojo', 'verde', 'negro']),
  mesa('mesa-elegante-redonda', 'Mesa elegante redonda', 1, 1, ['elegante', 'redonda', 'tallada'], 8, U),
  mesa('mesa-piedra', 'Mesa de piedra', 2, 1, ['piedra', 'jardín', 'rústica']),
  mesa('mesa-cuadrada', 'Mesa cuadrada', 2, 2, ['cuadrada', 'comedor', 'café']),
  mesa('mesa-centro-antigua', 'Mesa de centro antigua', 2, 1, ['centro', 'antigua', 'descanso'], 8),
  mesa('mesa-centro-tronco', 'Mesa de centro de tronco', 2, 1, ['centro', 'tronco', 'rústica'], 8),
  mesa('mesa-redonda-grande', 'Mesa redonda grande', 3, 3, ['redonda', 'reunión', 'comedor'], 10, U),
  mesa('mesa-centro-simple', 'Mesa de centro simple', 2, 1, ['centro', 'simple', 'descanso'], 8),
  mesa('soporte-plantas', 'Soporte para plantas', 1, 1, ['soporte', 'plantas', 'pedestal'], 8, U),
];

// ---------- Escritorios (puestos, 3 de ancho) ----------
const escritorio = (id: string, nombre: string, etiquetas: string[], variantes = MADERAS): ObjetoCatalogo =>
  def({ id, nombre, categoria: 'puestos', ancho: 3, sobresale: 10, orientaciones: CUATRO, variantes, etiquetas: ['escritorio', 'puesto', ...etiquetas], lote: 9 });

const ESCRITORIOS: readonly ObjetoCatalogo[] = [
  escritorio('escritorio-simple', 'Escritorio simple', ['simple', 'madera']),
  escritorio('escritorio-chippendale', 'Escritorio Chippendale', ['chippendale', 'antiguo', 'tallado']),
  escritorio('escritorio-zen', 'Escritorio zen', ['zen', 'japonés', 'minimalista']),
  escritorio('escritorio-ovalado', 'Escritorio ovalado', ['ovalado', 'moderno'], ESCRITORIO),
  escritorio('escritorio-industrial', 'Escritorio industrial', ['industrial', 'metal', 'taller']),
  escritorio('escritorio-ejecutivo-antiguo', 'Escritorio ejecutivo antiguo', ['ejecutivo', 'antiguo', 'cuero']),
  escritorio('escritorio-oficina', 'Escritorio de oficina', ['oficina', 'cajones']),
  escritorio('escritorio-bauhaus', 'Escritorio Bauhaus', ['bauhaus', 'tubular', 'diseño'], ['base', 'madera', 'blanco', 'rojo']),
  escritorio('escritorio-patas-nelson', 'Escritorio de patas curvas', ['mediados de siglo', 'patas', 'diseño']),
  escritorio('escritorio-ejecutivo-moderno', 'Escritorio ejecutivo moderno', ['ejecutivo', 'moderno', 'cristal']),
  escritorio('mesa-de-dibujo', 'Mesa de dibujo', ['dibujo', 'arquitectura', 'inclinada']),
  escritorio('escritorio-transportador', 'Escritorio de ingeniería', ['transportador', 'ingeniería', 'dibujo técnico']),
  escritorio('escritorio-madera-recuperada', 'Escritorio de madera recuperada', ['madera recuperada', 'rústico', 'reciclado']),
];

// ---------- Almacenaje (decoración) ----------
const guardar = (id: string, nombre: string, etiquetas: string[], o: { ancho?: number; sobresale?: number; variantes?: string[] } = {}): ObjetoCatalogo =>
  def({ id, nombre, categoria: 'decoracion', ancho: o.ancho ?? 1, sobresale: o.sobresale ?? 0, orientaciones: CUATRO, variantes: o.variantes ?? MADERAS, etiquetas: ['almacenaje', ...etiquetas], lote: 9 });

const ALMACENAJE: readonly ObjetoCatalogo[] = [
  guardar('mueble-planos', 'Mueble de planos', ['planos', 'cajones', 'archivo'], { ancho: 2, sobresale: 8 }),
  guardar('librero-alto', 'Librero alto', ['librero', 'libros', 'estante'], { ancho: 2, sobresale: 32 }),
  guardar('archivador-metalico', 'Archivador metálico', ['archivador', 'archivo', 'oficina'], { sobresale: 16, variantes: METAL }),
  guardar('aparador-moderno', 'Aparador de mediados de siglo', ['aparador', 'credenza', 'moderno'], { ancho: 3, sobresale: 8 }),
  guardar('estante-conservas', 'Estante de conservas', ['estante', 'frascos', 'conservas', 'cocina'], { ancho: 2, sobresale: 24 }),
  guardar('estante-madera-recuperada', 'Estante de madera recuperada', ['estante', 'rústico', 'tablones'], { ancho: 2, sobresale: 24 }),
  guardar('librero-chippendale', 'Librero Chippendale', ['librero', 'antiguo', 'libros'], { ancho: 2, sobresale: 32 }),
  guardar('estante-cubiculo', 'Estante de cubos', ['estante', 'cubos', 'oficina'], { ancho: 2, sobresale: 16 }),
  guardar('baul-vapor', 'Baúl de viaje', ['baúl', 'viaje', 'antiguo'], { ancho: 2, sobresale: 8 }),
  guardar('gabinete-curiosidades', 'Gabinete de curiosidades', ['gabinete', 'vitrina', 'colección'], { ancho: 2, sobresale: 32 }),
  guardar('estante-cocina', 'Estante de cocina', ['estante', 'cocina', 'platos'], { ancho: 2, sobresale: 24 }),
  guardar('librero-mediano', 'Librero mediano', ['librero', 'libros', 'estante'], { ancho: 2, sobresale: 16 }),
  guardar('fichero-tarjetas', 'Fichero de tarjetas', ['fichero', 'biblioteca', 'cajones'], { sobresale: 16 }),
  guardar('taquillas-bajas', 'Taquillas bajas', ['taquilla', 'locker', 'vestuario'], { ancho: 2, sobresale: 16, variantes: METAL }),
  guardar('gabinete-oficina', 'Gabinete de oficina', ['gabinete', 'oficina', 'puertas'], { ancho: 2, sobresale: 16, variantes: METAL }),
  guardar('taquillas-altas', 'Taquillas altas', ['taquilla', 'locker', 'vestuario'], { ancho: 2, sobresale: 32, variantes: METAL }),
  guardar('andamio', 'Andamio', ['andamio', 'obra', 'taller'], { ancho: 2, sobresale: 32, variantes: METAL }),
  guardar('gabinete-cocina-pequeno', 'Gabinete de cocina pequeño', ['gabinete', 'cocina', 'mesón'], { sobresale: 8 }),
  guardar('comoda-alta', 'Cómoda alta', ['cómoda', 'cajones', 'dormitorio'], { sobresale: 24 }),
  guardar('gabinete-cocina-grande', 'Gabinete de cocina grande', ['gabinete', 'cocina', 'mesón'], { ancho: 2, sobresale: 8 }),
  guardar('carrito-herramientas', 'Carrito de herramientas', ['carrito', 'herramientas', 'taller'], { sobresale: 8, variantes: METAL }),
];

export const LOTE_9: readonly ObjetoCatalogo[] = [...ASIENTOS, ...mesasFamilia, ...MESAS_SUELTAS, ...ESCRITORIOS, ...ALMACENAJE];

/** Los ids de cada categoría del lote 9, por si hace falta contarlos. */
export const LOTE_9_ASIENTOS: readonly string[] = ASIENTOS.map((o) => o.id);
export const LOTE_9_MESAS: readonly string[] = [...mesasFamilia, ...MESAS_SUELTAS, ...ESCRITORIOS].map((o) => o.id);
export const LOTE_9_ALMACENAJE: readonly string[] = ALMACENAJE.map((o) => o.id);
