import type { ObjetoCatalogo } from '../arte';
import { CALIDA, U, def, luz } from '../inventario-def';

/**
 * Lote 11: comida y bebida de Gather v2, cada pieza con su dibujo propio (atlas `objetos-v12`). Cafeteras y teteras, tazas y
 * termos, bebidas, comida de almuerzo, frutas y postres, y platos colombianos (extras nuestros). Ver `arte/GUIA-OBJETOS-V2.md`.
 *
 * Reglas del lote (las revisa `arte/tests/objetos-lote11.test.ts`):
 *  - Orientación única (`U`) en todo el lote y categoría `cocina`.
 *  - Todo es de 1 x 1 y va apoyado sobre una mesa o un mesón (`apoyado: true`, no bloquea), salvo la estación de espresso, que
 *    es de piso y bloquea su casilla.
 *  - Quedan fuera las piezas de festividades religiosas o de otros países: jalá, sufganiyot, plato del Séder, matzá, latkes,
 *    copa del Kidush, miel de Rosh Hashaná, taza de la Unidad (Kwanzaa), pasteles de luna, banh chung, pan de Pascua con cruz,
 *    conejo de chocolate, pastel y jarabe de arce de Canadá y knafeh.
 *  - Equivalentes que ya existían y no se redibujan: taza regular, ancha y alta y vaso para llevar (lote 8), manzana (lote 3),
 *    bombones de San Valentín (`caja-chocolates`), bandeja de comida (`bowl-comida`), frutero y cafetera (lote 2).
 */

const LATA = ['base', 'azul', 'verde', 'negro'];

interface Op {
  /** Filas que sobresale el cuadro por arriba (8 en 8). */
  s?: number;
  v?: string[];
  /** Objeto de piso (bloquea su casilla). */
  piso?: boolean;
  luz?: ReturnType<typeof luz>;
}

const d = (id: string, nombre: string, etiquetas: string[], o: Op = {}): ObjetoCatalogo =>
  def({
    id,
    nombre,
    categoria: 'cocina',
    sobresale: o.s ?? 0,
    ...(o.piso === true ? {} : { apoyado: true, bloquea: 'nada' as const }),
    orientaciones: U,
    variantes: o.v ?? ['base'],
    ...(o.luz !== undefined ? { emisor: o.luz } : {}),
    etiquetas,
    lote: 11,
  });

// ---------- Cafeteras, teteras, tazas y termos ----------
export const LOTE_11_CAFETERIA: readonly ObjetoCatalogo[] = [
  d('maquina-espresso', 'Máquina de espresso', ['espresso', 'café', 'cafetería'], { s: 8, v: ['base', 'rojo', 'negro'] }),
  d('cafetera-individual', 'Cafetera individual de cápsulas', ['cafetera', 'café', 'cápsulas'], { s: 8, v: ['base', 'rojo', 'blanco', 'verde'] }),
  d('molinillo-cafe', 'Molinillo de café', ['molinillo', 'café', 'grano'], { s: 8 }),
  d('prensa-francesa', 'Prensa francesa', ['prensa', 'café', 'cafetería'], { s: 8 }),
  d('cafetera-filtro', 'Cafetera de filtro', ['cafetera', 'café', 'filtro'], { s: 8 }),
  d('percolador', 'Percolador', ['percolador', 'café', 'camping'], { s: 8 }),
  d('urna-cafe', 'Urna de café', ['urna', 'café', 'eventos'], { s: 16 }),
  d('cafe-filtrado', 'Café filtrado a mano', ['café', 'filtrado', 'pour-over'], { s: 8 }),
  d('tetera-clasica', 'Tetera clásica', ['tetera', 'té', 'porcelana'], { s: 8, v: ['base', 'rojo', 'verde', 'amarillo'] }),
  d('tetera-zen', 'Tetera zen', ['tetera', 'té', 'hierro'], { s: 8 }),
  d('filtro-vietnamita', 'Café vietnamita con filtro', ['café', 'filtro', 'vietnamita'], { s: 8 }),
  d('taza-te', 'Taza de té con plato', ['taza', 'té', 'plato'], { v: ['base', 'rojo', 'azul'] }),
  d('tazon-te', 'Tazón de té', ['tazón', 'té', 'matcha']),
  d('vaso-termico', 'Vaso térmico grande', ['vaso', 'térmico', 'hidratación'], { s: 8, v: ['base', 'rojo', 'verde', 'amarillo'] }),
  d('termo', 'Termo de acero', ['termo', 'botella', 'hidratación'], { s: 8, v: ['base', 'rojo', 'azul', 'negro'] }),
  d('botella-agua', 'Botella de agua', ['botella', 'agua', 'hidratación'], { s: 8 }),
  d('estacion-espresso', 'Estación de espresso', ['espresso', 'café', 'barra'], { s: 16, piso: true, luz: luz(CALIDA, 1.4, 0.4, 'siempre') }),
];

// ---------- Bebidas ----------
export const LOTE_11_BEBIDAS: readonly ObjetoCatalogo[] = [
  d('gaseosa-lata', 'Gaseosa en lata', ['gaseosa', 'lata', 'bebida'], { v: LATA }),
  d('energizante-lata', 'Bebida energizante', ['energizante', 'lata', 'bebida'], { v: ['base', 'azul', 'rojo', 'naranja'] }),
  d('cerveza-lata', 'Cerveza en lata', ['cerveza', 'lata', 'bar'], { v: LATA }),
  d('cerveza-botella', 'Cerveza en botella', ['cerveza', 'botella', 'bar'], { s: 8, v: ['base', 'verde'] }),
  d('cerveza-pinta', 'Pinta de cerveza', ['cerveza', 'pinta', 'bar'], { v: ['base', 'negro'] }),
  d('vino-copa', 'Copa de vino', ['vino', 'copa', 'bar'], { s: 8, v: ['base', 'amarillo'] }),
  d('vino-botella', 'Botella de vino', ['vino', 'botella', 'bar'], { s: 8, v: ['base', 'rojo', 'negro'] }),
  d('champana', 'Champaña en hielera', ['champaña', 'brindis', 'hielera'], { s: 8 }),
  d('jugo', 'Jugo', ['jugo', 'vaso', 'fruta'], { v: ['base', 'verde', 'rojo', 'morado'] }),
  d('limonada', 'Limonada con menta', ['limonada', 'vaso', 'limón'], { s: 8 }),
  d('bebida-coco', 'Bebida tropical en coco', ['coco', 'tropical', 'bebida'], { s: 8 }),
  d('coctel-tiki', 'Cóctel tropical', ['cóctel', 'tiki', 'tropical'], { s: 8 }),
  d('te-boba', 'Té boba', ['boba', 'té', 'tapioca'], { s: 8, v: ['base', 'morado', 'verde'] }),
  d('cafe-helado', 'Café helado', ['café', 'helado', 'vaso'], { s: 8 }),
  d('mate', 'Mate con bombilla', ['mate', 'yerba', 'infusión'], { s: 8 }),
  d('chocolate-caliente', 'Chocolate caliente', ['chocolate', 'taza', 'bebida']),
  d('set-whisky', 'Set de whisky', ['whisky', 'decantador', 'bar'], { s: 8 }),
  d('sidra-caliente', 'Sidra de manzana caliente', ['sidra', 'manzana', 'taza']),
  d('latte-especiado', 'Latte de temporada', ['latte', 'café', 'especias']),
  d('chai-barro', 'Chai en vasito de barro', ['chai', 'té', 'barro']),
  d('tinto-tacita', 'Tinto en tacita', ['tinto', 'café', 'colombiano']),
];

// ---------- Comida de almuerzo ----------
export const LOTE_11_ALMUERZO: readonly ObjetoCatalogo[] = [
  d('dona', 'Dona glaseada', ['dona', 'postre', 'panadería'], { v: ['base', 'azul', 'amarillo'] }),
  d('caja-donas', 'Caja de donas', ['donas', 'caja', 'postre']),
  d('pizza', 'Pizza', ['pizza', 'almuerzo', 'comida']),
  d('hamburguesa-papas', 'Hamburguesa con papas', ['hamburguesa', 'papas', 'almuerzo']),
  d('ensalada', 'Ensalada', ['ensalada', 'almuerzo', 'saludable']),
  d('bandeja-sushi', 'Bandeja de sushi', ['sushi', 'almuerzo', 'japonés']),
  d('ramen', 'Ramen', ['ramen', 'sopa', 'japonés']),
  d('fideos-llevar', 'Fideos para llevar', ['fideos', 'para llevar', 'almuerzo']),
  d('dumplings', 'Dumplings al vapor', ['dumplings', 'vapor', 'almuerzo']),
  d('kebab', 'Brocheta de kebab', ['kebab', 'brocheta', 'almuerzo']),
  d('panini', 'Sándwich panini', ['panini', 'sándwich', 'almuerzo']),
  d('tabla-quesos', 'Tabla de quesos y charcutería', ['quesos', 'charcutería', 'tabla']),
  d('pan-rustico', 'Pan rústico', ['pan', 'rústico', 'panadería']),
  d('bolsa-almuerzo', 'Bolsa de almuerzo', ['bolsa', 'almuerzo', 'papel']),
  d('macarrones-queso', 'Macarrones con queso', ['macarrones', 'queso', 'almuerzo']),
  d('bowl-acai', 'Bowl de açaí', ['açaí', 'bowl', 'saludable']),
  d('sopa-almejas', 'Sopa cremosa de almejas', ['sopa', 'crema', 'almuerzo']),
  d('sopa-tomate', 'Crema de tomate', ['sopa', 'tomate', 'almuerzo']),
  d('coxinha', 'Coxinha', ['coxinha', 'brasileño', 'pasabocas']),
  d('tabule', 'Tabule', ['tabule', 'ensalada', 'libanés']),
  d('jamon-horneado', 'Jamón horneado', ['jamón', 'horneado', 'almuerzo']),
  d('costillar-cordero', 'Costillar de cordero', ['cordero', 'costillar', 'almuerzo']),
  d('carne-ahumada', 'Carne ahumada en rodajas', ['carne', 'ahumada', 'almuerzo']),
  d('pavo-asado', 'Pavo asado', ['pavo', 'asado', 'almuerzo'], { s: 8 }),
  d('pan-de-maiz', 'Pan de maíz en sartén', ['pan', 'maíz', 'sartén']),
  d('verduras-salteadas', 'Verduras salteadas', ['verduras', 'sartén', 'almuerzo']),
];

// ---------- Frutas, postres y platos colombianos ----------
export const LOTE_11_DULCES: readonly ObjetoCatalogo[] = [
  d('naranjas', 'Naranjas', ['naranjas', 'fruta', 'cítricos']),
  d('pina', 'Piña', ['piña', 'fruta', 'tropical'], { s: 8 }),
  d('sandia-bandeja', 'Sandía en bandeja', ['sandía', 'fruta', 'bandeja']),
  d('granada', 'Granada', ['granada', 'fruta']),
  d('canasta-bayas', 'Canasta de bayas', ['bayas', 'fruta', 'canasta']),
  d('manzana-caramelo', 'Manzana caramelizada', ['manzana', 'caramelo', 'dulce']),
  d('pastel-calabaza', 'Pastel de calabaza', ['pastel', 'calabaza', 'postre']),
  d('torta-bandeja', 'Torta de bandeja', ['torta', 'postre', 'cumpleaños']),
  d('arepa', 'Arepa con queso', ['arepa', 'colombiano', 'desayuno']),
  d('empanadas', 'Empanadas', ['empanadas', 'colombiano', 'pasabocas']),
  d('pandebono', 'Pandebono', ['pandebono', 'colombiano', 'panadería']),
  d('ajiaco', 'Ajiaco en cuenco', ['ajiaco', 'colombiano', 'sopa']),
  d('bandeja-paisa', 'Bandeja paisa', ['bandeja paisa', 'colombiano', 'almuerzo']),
  d('bunuelos', 'Buñuelos', ['buñuelos', 'colombiano', 'dulce']),
];

export const LOTE_11: readonly ObjetoCatalogo[] = [...LOTE_11_CAFETERIA, ...LOTE_11_BEBIDAS, ...LOTE_11_ALMUERZO, ...LOTE_11_DULCES];
