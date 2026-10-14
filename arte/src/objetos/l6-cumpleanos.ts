/**
 * Cumpleaños (lote 6): torta con velas y sombreros de fiesta. 2 cuadros.
 *
 * Luz: la torta emite siempre (llama que parpadea), así que las llamas llevan los tonos más claros y saturados.
 * Sombras: los dos objetos van sobre una mesa (reborde de 1 px).
 */

import { Lienzo } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { B, cerrarApoyado, conBorde, registrar } from './l6-comun';
import type { Cuadros } from './l6-comun';

/** Torta de cumpleaños de capas, con crema blanca que chorrea, grajeas y tres velas encendidas. Va sobre una mesa. 32 x 32, base en la fila 15. */
export function dibujarTortaCumpleanos(): Lienzo {
  const l = new Lienzo(32, 32);
  // Cuerpo: cilindro con luz a la izquierda y sombra a la derecha, y capas de crema entre el bizcocho.
  for (let y = 9; y <= B; y++) {
    for (let x = 4; x <= 27; x++) {
      if (y === B && (x < 6 || x > 25)) continue;
      let c: ColorEntrada = x < 9 ? 'rojo-suave-4' : x > 22 ? 'rojo-suave-2' : 'rojo-suave-3';
      if (y === 14) c = x < 9 ? 'neutro-7' : x > 22 ? 'neutro-5' : 'neutro-6';
      if (y === B) c = x > 22 ? 'rojo-suave-0' : 'rojo-suave-1';
      l.px(x, y, c);
    }
  }
  // Grajeas de colores.
  for (const [x, c] of [[6, 'tela-calida-3'], [10, 'vidrio-2'], [14, 'neutro-7'], [18, 'planta-4'], [22, 'tela-calida-3'], [25, 'vidrio-2']] as const) {
    l.px(x, 12, c);
    l.px(x + 1, 13, c);
  }
  // Cubierta: elipse blanca con chorreones que bajan por el costado.
  l.elipse(15.5, 8.5, 12, 2.7, 'neutro-7');
  l.rect(5, 9, 22, 1, 'neutro-7');
  for (const [x, h] of [[5, 2], [9, 3], [13, 1], [18, 3], [22, 2], [25, 1]] as const) {
    l.rect(x, 10, 2, h, 'neutro-7');
    l.px(x + 1, 10 + h - 1, 'neutro-6');
  }
  l.rect(5, 10, 22, 1, 'neutro-6');
  for (const [x, h] of [[5, 2], [9, 3], [13, 1], [18, 3], [22, 2], [25, 1]] as const) l.rect(x, 10, 2, h, 'neutro-7');
  // Velas con rayas y llama encendida (tonos claros: emite luz).
  const velas: Array<[number, ColorEntrada, ColorEntrada]> = [[9, 'vidrio-2', 'vidrio-1'], [14, 'rojo-3', 'rojo-2'], [19, 'tela-calida-3', 'tela-calida-2']];
  for (const [x, c, sombra] of velas) {
    conBorde(l, 'azul-oficina-1', (p) => {
      p.rect(x, 4, 2, 4, c);
      p.rect(x + 1, 4, 1, 4, sombra);
      p.px(x, 5, 'neutro-7');
      p.px(x + 1, 6, 'neutro-7');
    });
    l.px(x, 1, 'tela-calida-3');
    l.px(x, 2, 'tela-calida-3');
    l.px(x + 1, 2, 'tela-calida-3');
    l.px(x, 3, 'neutro-7');
    l.px(x + 1, 3, 'tela-calida-3');
  }
  return cerrarApoyado(l, { diagonales: true });
}

/** Un sombrero de fiesta cónico con motivo y pompón. */
function cono(l: Lienzo, cx: number, yPunta: number, yBase: number, mitad: number, tonos: readonly [ColorEntrada, ColorEntrada, ColorEntrada], motivo: ColorEntrada, tipo: 'rayas' | 'puntos' | 'cruz', borde: ColorEntrada, pompon: ColorEntrada): void {
  conBorde(l, borde, (p) => {
    for (let y = yPunta; y <= yBase; y++) {
      const m = (mitad * (y - yPunta + 0.5)) / (yBase - yPunta + 1);
      const x0 = Math.round(cx - m);
      const x1 = Math.round(cx + m) - 1;
      for (let x = x0; x <= x1; x++) {
        const u = (x - x0) / Math.max(1, x1 - x0);
        let c: ColorEntrada = u < 0.3 ? tonos[0] : u < 0.72 ? tonos[1] : tonos[2];
        if (tipo === 'rayas' && (x + y) % 6 < 2) c = motivo;
        if (tipo === 'puntos' && (x * 2 + y * 3) % 7 === 0) c = motivo;
        if (tipo === 'cruz' && (y - yPunta) % 3 === 1 && (x + y) % 2 === 0) c = motivo;
        p.px(x, y, c);
      }
    }
    // Cinta del borde de abajo y pompón pequeño.
    p.rect(Math.round(cx - mitad) + 1, yBase, Math.round(mitad * 2) - 2, 1, motivo);
    p.rect(Math.round(cx - mitad), yBase - 1, 1, 2, tonos[0]);
    p.rect(Math.round(cx + mitad) - 1, yBase - 1, 1, 2, tonos[2]);
    p.elipse(cx - 0.5, yPunta - 0.5, 1, 1, pompon);
    p.px(Math.round(cx - 1.5), yPunta - 1, 'neutro-7');
  }, { diagonales: true });
}

/** Tres sombreros de fiesta cónicos, rojo con rayas, azul con puntos y dorado con cruces, con pompones. Van sobre una mesa. 32 x 32. */
export function dibujarSombrerosFiesta(): Lienzo {
  const l = new Lienzo(32, 32);
  cono(l, 7, 4, 13, 6, ['rojo-4', 'rojo-3', 'rojo-2'], 'neutro-7', 'rayas', 'rojo-0', 'tela-calida-3');
  cono(l, 25, 4, 13, 6, ['tela-calida-3', 'tela-calida-2', 'tela-calida-1'], 'rojo-3', 'cruz', 'tela-calida-0', 'rojo-3');
  cono(l, 16, 3, 13, 6.5, ['vidrio-2', 'vidrio-1', 'vidrio-0'], 'neutro-7', 'puntos', 'azul-oficina-1', 'neutro-7');
  return cerrarApoyado(l, { diagonales: true });
}

export function cuadrosCumpleanos(): Cuadros {
  const c: Cuadros = new Map();
  registrar(c, 'torta-cumpleanos', 'U', dibujarTortaCumpleanos());
  registrar(c, 'sombreros-fiesta', 'U', dibujarSombrerosFiesta());
  return c;
}
