/**
 * Decoración del lote 1: plantas, cuadro grande, lámpara de pie, estantería y alfombra grande.
 *
 * Estilo Gather: plantas grandes y frondosas, muy verdes, en macetas azul grisáceo (la grande) y de barro (la
 * mediana); cuadros con marco claro; estantería azul grisáceo con libros de colores; alfombra lavanda con
 * zigzag. Contorno azul marino de 1 px en todo lo que se levanta del piso. La alfombra es plana: no lleva
 * contorno ni sombra.
 */

import { Lienzo, mapaEntreRampas, rampa } from '../nucleo';
import { azar, cerrar, registrarObjeto, type Cuadros } from './l1-comun';
import { laminaLateral } from './l1-tecnologia';

const AZ = (n: 0 | 1 | 2 | 3 | 4) => `azul-oficina-${n}` as const;
const PL = (n: 0 | 1 | 2 | 3 | 4) => `planta-${n}` as const;
const HP = (n: 0 | 1 | 2 | 3 | 4) => `hoja-pastel-${n}` as const;
const MT = (n: 0 | 1 | 2 | 3) => `maceta-terracota-${n}` as const;
const NE = (n: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7) => `neutro-${n}` as const;
const TC = (n: 0 | 1 | 2 | 3) => `tela-calida-${n}` as const;
const VI = (n: 0 | 1 | 2 | 3) => `vidrio-${n}` as const;
const RO = (n: 0 | 1 | 2 | 3 | 4) => `rojo-${n}` as const;
const MC = (n: 0 | 1 | 2 | 3 | 4) => `madera-clara-${n}` as const;
const TONOS_HOJA = [PL(1), PL(2), PL(3), PL(4)] as const;
const TONOS_PASTEL = [HP(1), HP(2), HP(3), HP(4)] as const;

type Hoja = readonly [readonly [number, number], readonly [number, number], number];

/**
 * Hoja ancha y ovalada (ficus, ave del paraíso): una elipse sombreada que va de la base a la punta, con nervadura.
 * Más redonda y blanda que `hoja()`, que da hojas de punta afilada.
 */
function hojaAncha(l: Lienzo, base: readonly [number, number], punta: readonly [number, number], ancho: number, tonos: readonly string[]): void {
  const dx = punta[0] - base[0];
  const dy = punta[1] - base[1];
  const largo = Math.hypot(dx, dy);
  const angulo = (Math.atan2(dy, dx) * 180) / Math.PI;
  const cx = (base[0] + punta[0]) / 2;
  const cy = (base[1] + punta[1]) / 2;
  // Cada hoja se dibuja aparte con su propio contorno verde oscuro, para que se separen las que se tapan entre sí.
  const hojaSola = new Lienzo(l.ancho, l.alto);
  hojaSola.elipseSombreada(cx, cy, largo / 2, ancho / 2, tonos, { angulo });
  const ux = dx / largo;
  const uy = dy / largo;
  hojaSola.linea(Math.round(base[0] + ux * 2), Math.round(base[1] + uy * 2), Math.round(punta[0] - ux * 2), Math.round(punta[1] - uy * 2), tonos[0] as string);
  hojaSola.contorno(PL(0));
  l.pegar(hojaSola, 0, 0);
}

/** Roseta de hojas: de atrás hacia adelante, cada hoja con su nervadura. */
function roseta(l: Lienzo, hojas: readonly Hoja[], tonos: readonly string[] = TONOS_HOJA, ancha = false): void {
  for (const [base, punta, ancho] of hojas) {
    if (ancha) hojaAncha(l, base, punta, ancho, tonos);
    else l.hoja([base[0], base[1]], [punta[0], punta[1]], ancho, tonos, { nervadura: ancho >= 9 });
  }
}

/** Maceta de barro: borde ancho con luz, cuerpo que se angosta hacia abajo y tierra oscura. Mide 16 de ancho y 16 de alto. */
function macetaDeBarro(l: Lienzo, fondo: number): void {
  const y0 = fondo - 15;
  l.rectRedondeado(8, y0, 16, 7, 2, MT(3));
  for (let y = y0 + 7; y < y0 + 16; y++) {
    const recorte = Math.floor((y - y0 - 7) / 4);
    l.rect(9 + recorte, y, 14 - 2 * recorte, 1, MT(2));
  }
  l.rect(9, y0 + 7, 3, 9, MT(3));
  l.rect(19, y0 + 7, 4, 9, MT(1));
  l.rect(19, y0 + 1, 5, 6, MT(2));
  l.rect(8, y0, 16, 1, MT(3));
  l.rectRedondeado(10, y0 + 1, 12, 3, 2, 'madera-oscura-1');
  l.rect(11, y0 + 1, 5, 1, 'madera-oscura-2');
}

/** Maceta gris azulada, redonda y baja, como las de las oficinas de Gather. Ocupa de la fila `fondo - 13` a `fondo`. */
function macetaGris(l: Lienzo, fondo: number): void {
  const y0 = fondo - 13;
  l.elipse(15.5, y0 + 10, 9.5, 3.5, AZ(1));
  l.rect(6, y0 + 3, 20, 8, AZ(2));
  l.rect(6, y0 + 3, 3, 8, AZ(3));
  l.rect(23, y0 + 3, 3, 8, AZ(1));
  l.elipse(15.5, y0 + 4, 10.5, 3.5, AZ(3));
  l.elipse(15.5, y0 + 4, 8.5, 2.5, 'madera-oscura-1');
  l.rect(9, y0 + 3, 8, 1, 'madera-oscura-2');
}

/**
 * Planta grande (1 x 1, sobresale 32): una roseta frondosa de hojas largas y anchas que salen de la maceta,
 * con las hojas del frente en un verde más claro. Llena casi todo el cuadro de 32 x 64.
 */
function plantaGrande(): Lienzo {
  const l = new Lienzo(32, 64);
  roseta(l, [
    [[16, 50], [16, 4], 9],
    [[15, 50], [7, 8], 9],
    [[17, 50], [25, 8], 9],
    [[14, 50], [2, 22], 9],
    [[18, 50], [30, 22], 9],
    [[14, 51], [3, 36], 8],
    [[18, 51], [29, 36], 8],
  ], TONOS_HOJA, true);
  roseta(l, [
    [[15, 52], [12, 14], 8],
    [[17, 52], [20, 14], 8],
    [[14, 52], [8, 30], 8],
    [[18, 52], [24, 30], 8],
  ], [PL(2), PL(3), PL(4), HP(4)], true);
  macetaGris(l, 62);
  return cerrar(l);
}

/**
 * Planta mediana (1 x 1, sobresale 16): un abanico de hojas largas en maceta de barro. Es más baja y de hojas
 * más claras que la grande.
 */
function plantaMediana(): Lienzo {
  const l = new Lienzo(32, 48);
  roseta(l, [
    [[16, 32], [16, 2], 9],
    [[15, 32], [5, 6], 9],
    [[17, 32], [27, 6], 9],
    [[14, 33], [2, 17], 9],
    [[18, 33], [29, 17], 9],
    [[13, 34], [4, 27], 8],
    [[19, 34], [27, 27], 8],
  ]);
  roseta(l, [[[16, 34], [10, 14], 8], [[16, 34], [22, 14], 8]], TONOS_PASTEL);
  macetaDeBarro(l, 44);
  return cerrar(l);
}

// ---------------------------------------------------------------------------
// Cuadro grande (2 x 1, sobresale 0, montado): arte abstracto con marco
// ---------------------------------------------------------------------------

type EstiloCuadro = 'base' | 'rojo' | 'negro';

/**
 * Obra de 46 x 11: un sol, un horizonte y barras de color. Cada estilo usa su propia paleta de la rampa:
 * el original es azul y lavanda con acentos rojo y amarillo, el rojo es una obra rojiza y el negro es en escala de grises.
 */
function obraAbstracta(l: Lienzo, x: number, y: number, estilo: EstiloCuadro): void {
  const c =
    estilo === 'base'
      ? { fondo: VI(2), cielo: 'lavanda-4', sol: RO(3), mar: VI(1), suelo: 'planta-2', barra: TC(3), rayas: 'blanco' }
      : estilo === 'rojo'
        ? { fondo: RO(1), cielo: RO(2), sol: RO(4), mar: RO(1), suelo: RO(0), barra: 'blanco', rayas: RO(3) }
        : { fondo: NE(3), cielo: NE(4), sol: NE(7), mar: NE(2), suelo: NE(1), barra: NE(6), rayas: NE(5) };
  l.rect(x, y, 46, 11, c.fondo);
  l.rect(x, y, 46, 6, c.cielo);
  l.rect(x, y + 6, 46, 3, c.mar);
  l.rect(x, y + 9, 46, 2, c.suelo);
  l.elipse(x + 14, y + 5, 4, 4, c.sol);
  l.rect(x + 10, y + 5, 9, 1, c.mar);
  l.rect(x + 10, y + 6, 9, 3, c.mar);
  l.rect(x + 28, y + 2, 6, 3, c.barra);
  l.rect(x + 36, y + 3, 7, 1, c.rayas);
  l.rect(x + 30, y + 7, 12, 1, c.rayas);
  l.rect(x + 2, y + 1, 5, 1, c.rayas);
}

function colorMarco(estilo: EstiloCuadro): { luz: string; medio: string; oscuro: string } {
  return estilo === 'base' ? { luz: MC(4), medio: MC(3), oscuro: MC(1) } : estilo === 'rojo' ? { luz: 'blanco', medio: NE(6), oscuro: NE(4) } : { luz: AZ(3), medio: AZ(1), oscuro: AZ(0) };
}

function cuadroGrandeS(estilo: EstiloCuadro): Lienzo {
  const l = new Lienzo(64, 32);
  const marco = colorMarco(estilo);
  l.rect(6, 1, 52, 17, marco.medio);
  l.rect(6, 1, 52, 1, marco.luz);
  l.rect(6, 1, 1, 17, marco.luz);
  l.rect(57, 2, 1, 16, marco.oscuro);
  l.rect(7, 17, 50, 1, marco.oscuro);
  l.rect(8, 3, 48, 13, estilo === 'negro' ? NE(6) : 'blanco');
  obraAbstracta(l, 9, 4, estilo);
  return cerrar(l);
}

function cuadroGrandeLateral(mira: 'E' | 'O', estilo: EstiloCuadro): Lienzo {
  const l = new Lienzo(32, 64);
  const marco = colorMarco(estilo);
  const borde = estilo === 'base' ? VI(2) : estilo === 'rojo' ? RO(3) : NE(5);
  laminaLateral(l, mira, 14, 50, 4, { ...marco, borde });
  return cerrar(l);
}

// ---------------------------------------------------------------------------
// Lámpara de pie (1 x 1, sobresale 24, luz de noche)
// ---------------------------------------------------------------------------

/**
 * Lámpara de pie con pantalla de tambor. La pantalla es lo que emite: se dibuja con los tonos más claros de
 * `tela-calida` y la boca de arriba en blanco, para que se lea encendida con las luces apagadas.
 */
function lamparaDePie(): Lienzo {
  const l = new Lienzo(32, 56);
  // Base redonda y varilla azul grisáceo.
  l.elipse(15.5, 51, 8.5, 3, AZ(1));
  l.elipse(15.5, 50, 8.5, 2.5, AZ(2));
  l.rect(10, 49, 6, 1, AZ(3));
  l.rect(14, 20, 4, 30, AZ(2));
  l.rect(14, 20, 1, 30, AZ(3));
  l.rect(17, 20, 1, 30, AZ(1));
  l.rect(13, 34, 6, 2, AZ(1));
  l.rect(13, 34, 6, 1, AZ(3));
  // Pantalla de tambor: más ancha abajo que arriba.
  for (let y = 5; y <= 19; y++) {
    const medio = 8 + Math.floor(((y - 5) * 3) / 14);
    l.rect(16 - medio, y, medio * 2, 1, TC(3));
    l.rect(16 - medio, y, 2, 1, 'blanco');
    l.rect(16 + medio - 3, y, 3, 1, TC(2));
  }
  l.rect(5, 19, 22, 1, TC(1));
  l.rect(6, 18, 20, 1, TC(2));
  l.elipse(15.5, 5, 8.5, 2.5, TC(2));
  l.elipse(15.5, 5, 6.5, 1.5, 'blanco');
  return cerrar(l);
}

// ---------------------------------------------------------------------------
// Estantería con libros (2 x 1, sobresale 32)
// ---------------------------------------------------------------------------

const COLORES_LIBRO = ['rojo-3', 'rojo-suave-2', 'vidrio-1', 'vidrio-2', 'tela-calida-2', 'tela-calida-3', 'planta-2', 'morado-2', 'naranja-2', 'lavanda-2'] as const;

/** Hilera de libros de lomos de colores, de 2 a 4 px de ancho y de 6 a 10 de alto, apoyados en `base` (fila de abajo). */
function hileraDeLibros(l: Lienzo, x0: number, x1: number, base: number, semilla: number): void {
  const rnd = azar(semilla);
  let x = x0;
  while (x < x1 - 2) {
    const ancho = 2 + Math.floor(rnd() * 3);
    const alto = 6 + Math.floor(rnd() * 5);
    if (rnd() < 0.12) {
      x += 2 + Math.floor(rnd() * 3);
      continue;
    }
    const color = COLORES_LIBRO[Math.floor(rnd() * COLORES_LIBRO.length)] ?? 'rojo-3';
    const w = Math.min(ancho, x1 - x);
    l.rect(x, base - alto, w, alto, color);
    l.rect(x, base - alto, w, 1, 'blanco');
    l.rect(x, base - alto + 1, 1, alto - 1, 'blanco');
    l.rect(x, base - alto + 2, w, 1, AZ(1));
    if (w >= 3 && alto >= 8) l.rect(x + 1, base - 3, w - 1, 1, 'blanco');
    x += w;
  }
}

/** Colores de una estantería: el marco con luz y sombra, la tapa, el fondo y las baldas. */
interface MaterialEstanteria {
  luz: string;
  marco: string;
  sombra: string;
  tapa: string;
  fondo: string;
  balda: string;
  baldaSombra: string;
}

const ESTANTERIAS: Record<string, MaterialEstanteria> = {
  base: { luz: AZ(4), marco: AZ(3), sombra: AZ(2), tapa: AZ(4), fondo: AZ(1), balda: AZ(4), baldaSombra: AZ(2) },
  madera: { luz: MC(4), marco: MC(3), sombra: MC(1), tapa: MC(4), fondo: 'madera-oscura-1', balda: MC(4), baldaSombra: MC(1) },
  blanco: { luz: NE(7), marco: NE(6), sombra: NE(5), tapa: NE(7), fondo: NE(4), balda: NE(7), baldaSombra: NE(5) },
  negro: { luz: NE(3), marco: NE(2), sombra: NE(1), tapa: NE(3), fondo: NE(0), balda: NE(3), baldaSombra: NE(1) },
};

function estanteriaS(m: MaterialEstanteria): Lienzo {
  const l = new Lienzo(64, 64);
  l.rect(2, 2, 60, 6, m.tapa);
  l.rect(2, 7, 60, 2, m.marco);
  l.rect(2, 8, 60, 1, m.sombra);
  l.rect(2, 9, 60, 53, m.marco);
  l.rect(2, 9, 2, 53, m.luz);
  l.rect(59, 9, 3, 53, m.sombra);
  l.rect(4, 9, 55, 50, m.fondo);
  [20, 33, 46, 59].forEach((y, i) => {
    l.rect(4, y, 55, 1, m.balda);
    l.rect(4, y + 1, 55, 1, m.marco);
    l.rect(4, y + 2, 55, 1, m.baldaSombra);
    hileraDeLibros(l, 6, 57, y, 80 + i * 7);
  });
  l.rect(2, 59, 60, 3, m.marco);
  l.rect(2, 61, 60, 1, m.sombra);
  return cerrar(l);
}

/** De lado (E u O): se ve la tapa y el costado macizo de la estantería, con un panel hundido. */
function estanteriaLateral(m: MaterialEstanteria): Lienzo {
  const l = new Lienzo(32, 96);
  l.rect(3, 4, 26, 34, m.tapa);
  l.rect(28, 5, 1, 33, m.balda);
  l.rect(3, 38, 26, 2, m.marco);
  l.rect(3, 40, 26, 52, m.marco);
  l.rect(3, 40, 2, 52, m.luz);
  l.rect(28, 41, 1, 51, m.sombra);
  l.rect(7, 45, 18, 40, m.marco);
  l.rect(7, 45, 18, 1, m.sombra);
  l.rect(7, 45, 1, 40, m.sombra);
  l.rect(7, 84, 18, 1, m.luz);
  l.rect(24, 46, 1, 38, m.luz);
  l.rect(3, 89, 26, 3, m.sombra);
  return cerrar(l);
}

// ---------------------------------------------------------------------------
// Alfombra grande (3 x 2, capa suelo): lavanda con zigzag
// ---------------------------------------------------------------------------

/**
 * Alfombra lavanda con rayas en zigzag, como las salas de Gather: el campo alterna dos tonos en franjas que
 * suben y bajan, rodeado por un borde oscuro con un filete claro. Va en la capa del suelo, así que no lleva
 * contorno ni sombra. Se dibuja con `lavanda` y las variantes recolorean tono a tono.
 */
function alfombraGrande(): Lienzo {
  const l = new Lienzo(96, 64);
  l.rectRedondeado(1, 2, 94, 60, 3, 'lavanda-0');
  l.rectRedondeado(2, 3, 92, 57, 3, 'lavanda-1');
  // Campo en zigzag: franjas verticales de 8 px que se quiebran cada 4 filas.
  for (let y = 6; y < 58; y++) {
    const quiebre = (y % 8 < 4 ? y % 8 : 8 - (y % 8)) * 2;
    for (let x = 6; x < 90; x++) l.px(x, y, (Math.floor((x + quiebre) / 8) & 1) === 0 ? 'lavanda-2' : 'lavanda-3');
  }
  // Filete claro y esquinas.
  l.rectBorde(4, 5, 88, 54, 'lavanda-4');
  l.rectBorde(5, 6, 86, 52, 'lavanda-1');
  l.rect(2, 60, 92, 2, 'lavanda-0');
  return l;
}

export function dibujarDecoracion(salida: Cuadros): void {
  registrarObjeto(salida, 'planta-grande', () => plantaGrande());
  registrarObjeto(salida, 'planta-mediana', () => plantaMediana());
  registrarObjeto(salida, 'cuadro-grande', (clave) => (clave === 'S' ? cuadroGrandeS('base') : cuadroGrandeLateral(clave === 'E' ? 'E' : 'O', 'base')), {
    variante: (_base, variante, clave) => {
      const estilo: EstiloCuadro = variante === 'rojo' ? 'rojo' : 'negro';
      return clave === 'S' ? cuadroGrandeS(estilo) : cuadroGrandeLateral(clave === 'E' ? 'E' : 'O', estilo);
    },
  });
  registrarObjeto(salida, 'lampara-pie', () => lamparaDePie());
  registrarObjeto(salida, 'estanteria-libros', (clave) => (clave === 'S' ? estanteriaS(ESTANTERIAS.base as MaterialEstanteria) : estanteriaLateral(ESTANTERIAS.base as MaterialEstanteria)), {
    variante: (_base, variante, clave) => {
      const m = ESTANTERIAS[variante];
      if (!m) return undefined;
      return clave === 'S' ? estanteriaS(m) : estanteriaLateral(m);
    },
  });
  const destinos: Record<string, string> = { rojo: 'rojo-suave', azul: 'vidrio', verde: 'planta', negro: 'neutro' };
  registrarObjeto(salida, 'alfombra-grande', () => alfombraGrande(), {
    variante: (base, variante) => {
      const destino = destinos[variante];
      if (!destino) return undefined;
      const alto = rampa(destino);
      // Cinco tonos de la lavanda a cinco tonos del destino (las rampas de 4 tonos repiten el más claro).
      const tonos = [0, 1, 2, 3, 4].map((i) => alto[Math.min(i, alto.length - 1)] as string);
      return base.recolorear(mapaEntreRampas('lavanda', tonos));
    },
  });
}
