/**
 * Música del lote 5: rockola, piano, guitarra en su soporte y el disco de vinilo gigante del suelo.
 *
 * Todo es de suelo (sombra proyectada en dos tonos, con una mancha de contacto bajo la base) menos el vinilo, que va
 * plano sobre el piso y solo lleva contorno. La rockola emite luz rosada: sus tubos de neón van en los tonos más claros.
 * Las orientaciones `E` se dibujan con la cara larga hacia el este y las partes que "asoman" (teclado, frente de la
 * rockola) como una franja a la derecha, igual que la máquina arcade del lote 3B.
 */

import { Lienzo } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { bloque, cerrarSinSombra, cerrarSuelo, columna, registrar, rellenarArco, tonosDe } from './l5-comun';
import type { Cuadros } from './l5-comun';

// ---------------------------------------------------------------------------
// Rockola (1 x 1, sobresale 24: mide 32 x 56)
// ---------------------------------------------------------------------------

const CARCASA: readonly ColorEntrada[] = ['rojo-suave-0', 'rojo-suave-1', 'rojo-suave-2', 'rojo-suave-3'];

/** ¿El píxel cae dentro de un arco de medio punto con tope redondo? `cy` es donde termina la parte redonda. */
function enArco(x: number, y: number, cx: number, cy: number, rx: number, ry: number, yFin: number): boolean {
  if (y > yFin) return false;
  if (y >= cy) return Math.abs(x + 0.5 - cx) <= rx;
  const u = (x + 0.5 - cx) / rx;
  const v = (y + 0.5 - cy) / ry;
  return u * u + v * v <= 1;
}

/** Botones de selección: cuatro cuadritos de colores y la ranura de monedas. */
function selector(l: Lienzo, x: number, y: number): void {
  bloque(l, x, y, 18, 5, tonosDe('metal', 1, 2, 3));
  const colores: ColorEntrada[] = ['tela-calida-3', 'rojo-3', 'vidrio-2', 'planta-3'];
  colores.forEach((c, i) => {
    l.rect(x + 2 + i * 3, y + 1, 2, 2, c);
    l.px(x + 2 + i * 3, y + 1, 'neutro-7');
  });
  l.rect(x + 14, y + 1, 3, 1, 'neutro-1');
  l.rect(x + 14, y + 3, 3, 1, 'metal-1');
}

export function dibujarRockolaS(): Lienzo {
  const l = new Lienzo(32, 56);
  const cuerpo = (x: number, y: number): boolean => enArco(x, y, 16, 14, 13, 13, 50);
  rellenarArco(l, cuerpo, 2, 29, 1, 50, CARCASA);
  // Tubo de neón rosado que sigue el arco y baja por los dos lados.
  const neon = (x: number, y: number): boolean => {
    if (y < 14) {
      const d = Math.hypot((x + 0.5 - 16) / 1, y + 0.5 - 14);
      return d >= 9.6 && d <= 11.4;
    }
    return y <= 38 && ((x >= 5 && x <= 6) || (x >= 25 && x <= 26));
  };
  for (let y = 1; y <= 40; y++) for (let x = 3; x <= 28; x++) if (neon(x, y) && cuerpo(x, y)) l.px(x, y, 'rojo-suave-4');
  // Brillos del neón y bombillas amarillas a intervalos.
  for (const [x, y] of [[9, 5], [16, 2], [23, 5], [6, 20], [25, 28], [6, 33]] as const) l.px(x, y, 'neutro-7');
  for (const [x, y] of [[5, 9], [26, 9], [12, 3], [20, 3]] as const) l.px(x, y, 'tela-calida-3');
  // Ventana de cristal con el disco y el brazo.
  const cristal = (x: number, y: number): boolean => enArco(x, y, 16, 14, 8, 8, 30);
  rellenarArco(l, cristal, 7, 25, 6, 30, ['azul-oficina-0', 'azul-oficina-1', 'azul-oficina-1', 'azul-oficina-2']);
  l.elipse(15.5, 19.5, 6, 6, 'neutro-1');
  l.elipse(15.5, 19.5, 5, 5, 'neutro-2');
  l.elipse(15.5, 19.5, 3, 3, 'neutro-1');
  l.elipse(15.5, 19.5, 2, 2, 'rojo-3');
  l.px(15, 19, 'neutro-7');
  for (const [x, y] of [[11, 15], [12, 14], [13, 14], [10, 17]] as const) l.px(x, y, 'neutro-4');
  l.linea(23, 9, 19, 16, 'metal-3');
  l.px(23, 8, 'metal-2');
  // Franja amarilla de títulos y el selector.
  l.rect(8, 31, 16, 2, 'tela-calida-3');
  l.rect(8, 31, 16, 1, 'neutro-7');
  l.rect(8, 33, 16, 1, 'tela-calida-1');
  selector(l, 7, 35);
  // Rejilla del altavoz con listones dorados.
  l.rect(7, 41, 18, 8, 'neutro-1');
  for (const y of [42, 44, 46, 48]) l.rect(8, y, 16, 1, 'madera-clara-1');
  l.rect(7, 41, 18, 1, 'tela-calida-2');
  // Zócalo.
  l.rect(4, 49, 24, 3, 'rojo-suave-0');
  l.rect(4, 49, 24, 1, 'rojo-suave-1');
  return cerrarSuelo(l, { contacto: [17, 53, 11, 1] });
}

export function dibujarRockolaE(): Lienzo {
  const l = new Lienzo(32, 56);
  // Costado: arco más angosto con el tubo de neón siguiendo la curva.
  const cuerpo = (x: number, y: number): boolean => enArco(x, y, 13.5, 11, 9.5, 10, 50);
  rellenarArco(l, cuerpo, 3, 24, 1, 50, CARCASA);
  const neon = (x: number, y: number): boolean => {
    if (y < 11) {
      const d = Math.hypot((x + 0.5 - 13.5) * (10 / 9.5), y + 0.5 - 11);
      return d >= 6.4 && d <= 8.2;
    }
    return y <= 40 && x >= 8 && x <= 9;
  };
  for (let y = 1; y <= 42; y++) for (let x = 3; x <= 24; x++) if (neon(x, y) && cuerpo(x, y)) l.px(x, y, 'rojo-suave-4');
  for (const [x, y] of [[8, 5], [13, 2], [17, 5], [8, 24], [8, 36]] as const) l.px(x, y, 'neutro-7');
  for (const [x, y] of [[6, 9], [19, 9], [10, 3]] as const) l.px(x, y, 'tela-calida-3');
  // Panel liso del costado con un adorno cromado.
  l.rect(12, 14, 10, 24, 'rojo-suave-1');
  l.rect(12, 14, 1, 24, 'rojo-suave-2');
  l.rect(21, 14, 1, 24, 'rojo-suave-0');
  l.rect(14, 18, 6, 1, 'metal-3');
  l.rect(14, 19, 6, 1, 'metal-1');
  // Frente que asoma a la derecha: ventana, selector y rejilla vistos de canto.
  l.rect(24, 8, 4, 23, 'azul-oficina-1');
  l.rect(24, 8, 1, 23, 'azul-oficina-2');
  l.rect(25, 13, 2, 11, 'neutro-1');
  l.rect(26, 15, 1, 3, 'rojo-3');
  l.rect(24, 31, 4, 2, 'tela-calida-3');
  l.rect(24, 33, 4, 6, 'metal-2');
  l.rect(24, 33, 4, 1, 'metal-3');
  l.px(25, 35, 'rojo-3').px(26, 35, 'tela-calida-3');
  l.rect(24, 40, 4, 9, 'neutro-1');
  for (const y of [41, 43, 45, 47]) l.rect(25, y, 3, 1, 'madera-clara-1');
  l.rect(24, 40, 4, 1, 'tela-calida-2');
  // Zócalo.
  l.rect(4, 49, 24, 3, 'rojo-suave-0');
  l.rect(4, 49, 24, 1, 'rojo-suave-1');
  return cerrarSuelo(l, { contacto: [17, 53, 11, 1] });
}

// ---------------------------------------------------------------------------
// Piano (2 x 1, sobresale 16: mide 64 x 48 en S y 32 x 80 en E)
// ---------------------------------------------------------------------------

const LACA = tonosDe('neutro', 1, 2, 3);

/** Teclas blancas de 3 px separadas por una línea gris, con las negras en su patrón de 2 y 3. */
function teclasS(l: Lienzo, x: number, y: number, blancas: number, alto: number): void {
  l.rect(x, y, blancas * 3, alto, 'neutro-7');
  l.rect(x, y, blancas * 3, 1, 'neutro-5');
  l.rect(x, y + alto - 1, blancas * 3, 1, 'neutro-6');
  for (let i = 1; i < blancas; i++) l.rect(x + i * 3 - 1, y + 1, 1, alto - 1, 'neutro-5');
  for (let i = 0; i < blancas - 1; i++) {
    if (![0, 1, 3, 4, 5].includes(i % 7)) continue;
    l.rect(x + (i + 1) * 3 - 1, y + 1, 2, 5, 'neutro-1');
    l.px(x + (i + 1) * 3 - 1, y + 1, 'neutro-3');
  }
}

export function dibujarPianoS(): Lienzo {
  const l = new Lienzo(64, 48);
  // Tapa: cara superior brillante y canto.
  bloque(l, 2, 1, 60, 6, { sombra: 'neutro-1', medio: 'neutro-2', luz: 'neutro-4' });
  l.rect(4, 2, 28, 1, 'neutro-5');
  l.rect(2, 6, 60, 1, 'neutro-1');
  // Panel alto con el atril y la partitura.
  l.rect(3, 7, 58, 13, 'neutro-2');
  l.rect(3, 7, 58, 1, 'neutro-3');
  l.rect(3, 7, 1, 13, 'neutro-3');
  l.rect(60, 7, 1, 13, 'neutro-1');
  l.rect(8, 9, 48, 9, 'neutro-1');
  l.rect(9, 9, 46, 1, 'neutro-3');
  l.rect(20, 10, 24, 7, 'neutro-7');
  l.rect(20, 10, 24, 1, 'neutro-6');
  for (const y of [11, 13, 15]) l.rect(21, y, 22, 1, 'neutro-4');
  for (const x of [23, 27, 30, 34, 38]) l.px(x, 12 + (x % 3), 'neutro-1');
  l.rect(28, 18, 8, 1, 'tela-calida-2');
  // Candeleros a los lados del atril.
  for (const x of [12, 48]) {
    l.rect(x, 12, 3, 5, 'metal-2');
    l.rect(x, 12, 1, 5, 'metal-3');
    l.px(x + 1, 11, 'tela-calida-3');
  }
  // Tapa del teclado y teclas.
  l.rect(2, 20, 60, 2, 'neutro-1');
  l.rect(2, 20, 60, 1, 'neutro-3');
  teclasS(l, 4, 22, 19, 8);
  // Cajón del teclado y cuerpo inferior con su tablero hundido.
  l.rect(3, 30, 58, 2, 'neutro-2');
  l.rect(3, 30, 58, 1, 'neutro-3');
  l.rect(3, 32, 58, 10, 'neutro-2');
  l.rect(3, 32, 1, 10, 'neutro-3');
  l.rect(60, 32, 1, 10, 'neutro-1');
  l.rect(3, 41, 58, 1, 'neutro-1');
  l.rect(9, 34, 46, 6, 'neutro-1');
  l.rect(9, 34, 46, 1, 'neutro-3');
  l.rect(9, 34, 1, 6, 'neutro-2');
  // Pedales dorados y patas.
  for (const x of [27, 31, 35]) {
    l.rect(x, 42, 2, 2, 'tela-calida-2');
    l.px(x, 42, 'tela-calida-3');
  }
  for (const x of [5, 54]) {
    columna(l, x, 41, 5, 4, LACA);
    l.rect(x, 44, 5, 1, 'neutro-1');
  }
  return cerrarSuelo(l, { contacto: [32, 45, 24, 1] });
}

export function dibujarPianoE(): Lienzo {
  const l = new Lienzo(32, 80);
  // Tapa larga vista desde arriba, con el atril sobre ella.
  bloque(l, 2, 1, 21, 60, { sombra: 'neutro-1', medio: 'neutro-2', luz: 'neutro-4' });
  l.rect(4, 3, 1, 22, 'neutro-5');
  l.rect(10, 6, 8, 12, 'neutro-7');
  l.rect(10, 6, 8, 1, 'neutro-6');
  for (const y of [9, 11, 13, 15]) l.rect(11, y, 6, 1, 'neutro-4');
  l.rect(10, 18, 8, 1, 'neutro-1');
  // Extremo sur: costado del piano con su tablero y la pata.
  l.rect(2, 60, 21, 14, 'neutro-2');
  l.rect(2, 60, 21, 1, 'neutro-1');
  l.rect(2, 61, 1, 13, 'neutro-3');
  l.rect(22, 61, 1, 13, 'neutro-1');
  l.rect(2, 73, 21, 1, 'neutro-1');
  l.rect(6, 63, 13, 8, 'neutro-1');
  l.rect(6, 63, 13, 1, 'neutro-3');
  l.rect(6, 63, 1, 8, 'neutro-2');
  // Teclado que asoma a la derecha: teclas vistas desde arriba, de norte a sur.
  l.rect(23, 6, 8, 54, 'neutro-1');
  for (let y = 7; y < 59; y += 3) {
    l.rect(24, y, 6, 2, 'neutro-7');
    l.rect(24, y + 2, 6, 1, 'neutro-5');
  }
  for (let i = 0; i < 17; i++) {
    if (![0, 1, 3, 4, 5].includes(i % 7)) continue;
    l.rect(24, 7 + (i + 1) * 3 - 2, 3, 2, 'neutro-1');
  }
  l.rect(23, 59, 8, 3, 'neutro-2');
  // Pata y pedal.
  columna(l, 4, 73, 5, 4, LACA);
  columna(l, 17, 73, 5, 4, LACA);
  l.rect(4, 76, 5, 1, 'neutro-1');
  l.rect(17, 76, 5, 1, 'neutro-1');
  l.rect(12, 74, 2, 2, 'tela-calida-2');
  return cerrarSuelo(l, { contacto: [14, 77, 9, 1] });
}

// ---------------------------------------------------------------------------
// Guitarra en su soporte (1 x 1, sobresale 16: mide 32 x 48)
// ---------------------------------------------------------------------------

export function dibujarGuitarra(): Lienzo {
  const l = new Lienzo(32, 48);
  // Soporte: yugo que sujeta el cuerpo y tres patas de metal.
  l.linea(16, 42, 8, 45, 'metal-2');
  l.linea(16, 42, 24, 45, 'metal-1');
  l.rect(16, 42, 1, 3, 'metal-2');
  l.rect(12, 40, 9, 2, 'metal-2');
  l.rect(12, 40, 9, 1, 'metal-3');
  for (const x of [7, 16, 24]) l.rect(x, 45, 2, 1, 'neutro-2');
  // Mástil con sus trastes y la cabeza con las clavijas.
  l.rect(15, 6, 3, 17, 'madera-oscura-2');
  l.rect(15, 6, 1, 17, 'madera-oscura-3');
  l.rect(17, 6, 1, 17, 'madera-oscura-1');
  for (const y of [8, 11, 14, 17, 20]) l.rect(15, y, 3, 1, 'metal-2');
  l.rect(14, 1, 5, 6, 'madera-oscura-1');
  l.rect(14, 1, 1, 6, 'madera-oscura-2');
  for (const y of [2, 4]) {
    l.px(13, y, 'metal-3');
    l.px(19, y, 'metal-3');
  }
  // Cuerpo: dos óvulos de roble, con luz arriba a la izquierda.
  l.elipse(16, 24.5, 6, 5, 'madera-clara-1');
  l.elipse(15, 24, 5, 4, 'madera-clara-2');
  l.elipse(14, 23, 3, 2, 'madera-clara-3');
  l.elipse(16, 33, 8, 7, 'madera-clara-1');
  l.elipse(15, 32, 7, 6, 'madera-clara-2');
  l.elipse(13, 30, 4, 3, 'madera-clara-3');
  l.rect(11, 27, 10, 3, 'madera-clara-2');
  // Boca, puente y cuerda.
  l.elipse(16, 28, 2, 2, 'madera-oscura-0');
  l.elipse(16, 28, 3, 3, 'madera-oscura-2');
  l.elipse(16, 28, 2, 2, 'madera-oscura-0');
  l.rect(12, 36, 8, 2, 'madera-oscura-1');
  l.rect(12, 36, 8, 1, 'madera-oscura-3');
  l.rect(16, 7, 1, 29, 'neutro-5');
  l.px(16, 28, 'madera-oscura-0');
  return cerrarSuelo(l, { contacto: [16, 44, 8, 1], largo: 2 });
}

// ---------------------------------------------------------------------------
// Disco de vinilo gigante (2 x 2, plano en el suelo: mide 64 x 64)
// ---------------------------------------------------------------------------

export function dibujarVinilo(): Lienzo {
  const l = new Lienzo(64, 64);
  const c = 31.5;
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const d = Math.hypot(x - c, y - c);
      if (d > 30.6) continue;
      const ang = (Math.atan2(y - c, x - c) * 180) / Math.PI;
      // Dos reflejos opuestos, uno arriba a la izquierda (el fuerte) y otro abajo a la derecha.
      const brillo1 = Math.abs(((ang + 135 + 540) % 360) - 180) < 14 || Math.abs(((ang + 135 + 540) % 360) - 180) > 346;
      const a2 = ((ang - 45 + 540) % 360) - 180;
      const brillo2 = Math.abs(a2) < 10;
      let color: ColorEntrada;
      if (d < 1.6) color = 'neutro-1';
      else if (d < 12) color = d < 3.5 ? 'tela-calida-3' : d < 10.5 ? 'rojo-3' : 'rojo-2';
      else if (d < 14) color = 'neutro-3';
      else {
        // Surcos: bandas concéntricas de dos tonos, con un par de pistas más anchas.
        const banda = Math.floor(d - 14);
        const pista = d > 22.5 && d < 24 ? true : d > 27 && d < 28.2;
        if (pista) color = 'neutro-3';
        else color = banda % 3 === 0 ? 'neutro-2' : 'neutro-1';
        if (brillo1 && d > 15) color = banda % 3 === 0 ? 'neutro-4' : 'neutro-3';
        else if (brillo2 && d > 15) color = banda % 3 === 0 ? 'neutro-3' : 'neutro-2';
      }
      l.px(x, y, color);
    }
  }
  // Etiqueta: anillo claro, rayas de texto y el agujero del centro.
  l.elipse(c, c, 6.5, 6.5, 'rojo-2');
  l.elipse(c - 0.5, c - 0.5, 6, 6, 'rojo-3');
  l.rect(26, 28, 10, 1, 'neutro-7');
  l.rect(27, 30, 8, 1, 'rojo-4');
  l.rect(26, 33, 10, 1, 'neutro-7');
  l.rect(28, 35, 6, 1, 'rojo-4');
  l.elipse(c, c, 2, 2, 'neutro-6');
  l.elipse(c, c, 1, 1, 'neutro-1');
  l.px(30, 30, 'neutro-7');
  return cerrarSinSombra(l);
}

// ---------------------------------------------------------------------------
// Registro
// ---------------------------------------------------------------------------

export function cuadrosMusica(): Cuadros {
  const c: Cuadros = new Map();
  registrar(c, 'jukebox', 'S', dibujarRockolaS());
  registrar(c, 'jukebox', 'E', dibujarRockolaE());
  registrar(c, 'piano', 'S', dibujarPianoS());
  registrar(c, 'piano', 'E', dibujarPianoE());
  registrar(c, 'guitarra', 'U', dibujarGuitarra());
  registrar(c, 'vinilo-alfombra', 'U', dibujarVinilo());
  return c;
}
