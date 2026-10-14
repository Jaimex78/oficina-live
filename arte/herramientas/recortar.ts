/**
 * Recorta y amplía una parte de un PNG de revisión: `npx tsx arte/herramientas/recortar.ts entrada.png salida.png x y w h [escala]`
 * (píxeles de la imagen original; escala 3 por defecto). Sirve para mirar el detalle de una hoja o una plantilla.
 */
import { escribirPng, leerPng } from '../src/nucleo';

const [entrada, salida, x, y, w, h, esc] = process.argv.slice(2);
if (!entrada || !salida || !x || !y || !w || !h) throw new Error('uso: recortar.ts entrada.png salida.png x y w h [escala]');
escribirPng(leerPng(entrada).recortar(Number(x), Number(y), Number(w), Number(h)).escalar(Number(esc ?? 3)), salida);
