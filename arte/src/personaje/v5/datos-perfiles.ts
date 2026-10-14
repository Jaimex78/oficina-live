/**
 * Transcripción literal de los perfiles del cuerpo base del arte base de Jaime Orozco (archivos 12 y 13).
 * Generado por `arte/herramientas/transcribir-perfiles.ts`: no se edita a mano. Cada figura mide 16 columnas x 33 filas de píxeles de juego
 * (la misma altura que el frente del 09). `BORDES_X` y `BORDES_Y` son los bordes de celda en el PNG original (píxeles de pantalla)
 * y sirven para reconstruir el raster y comprobar la diferencia. Letras = colores de `LEYENDA` de `datos-disenador.ts`.
 */

export const COLORES_PNG: Readonly<Record<string, string>> = {"#F0C19B":"b","#CD8C64":"c","#222033":"d","#6E442F":"e","#ECE9EF":"f","#FFFEFD":"g","#603B33":"h","#C38F65":"i","#E58A65":"j","#9193A4":"k","#C7C2D0":"l","#A16643":"m","#FFFFFF":"n","#000000":"a"};
export const FONDO_PNG = '#E4F1E2';

export const PERFIL_IZQUIERDO: readonly string[] = [
  '.....aaaaaa.....',
  '...aabbbbbbaa...',
  '..abbbbbbbbbba..',
  '.abbbbbbbbbbbba.',
  '.abbbbbbbbbbbba.',
  'abbbbbbbbbbbbbba',
  'abbbbbbbbbbbbbba',
  'abbbbbbbbbbbbbba',
  'abbbbbbbbbbbbbba',
  'abbbbbbbbbbbbbca',
  'abbcccbbbbmeccca',
  'abbbbbbbbbbbecca',
  'abbdddbbbbcbeca.',
  'abigdlebbbcbeca.',
  'aibhhgebbceeca..',
  'abibijjbbccca...',
  '.abibibmmcaa....',
  '..aaammllla.....',
  '....allibca.....',
  '...affmbiba.....',
  '...anlmcbbma....',
  '...afflmbbma....',
  '...afflebbma....',
  '...allebbbea....',
  '...allebbbea....',
  '...aklebbca.....',
  '...amkkeeea.....',
  '....amkllka.....',
  '....ameccca.....',
  '...ammeccca.....',
  '...amacccca.....',
  '....aacccca.....',
  '......aaaa......',
];
export const BORDES_X_IZQUIERDO: readonly number[] = [68,76,82,88,96,102,108,116,122,128,136,142,148,156,162,168,176];
export const BORDES_Y_IZQUIERDO: readonly number[] = [32,38,44,52,58,64,71,78,85,92,98,104,110,118,124,130,138,144,150,158,164,170,176,184,190,196,204,210,216,224,230,236,242,250];

export const PERFIL_DERECHO: readonly string[] = [
  '.....aaaaaa.....',
  '...aabbbbbbaa...',
  '..abbbbbbbbbba..',
  '.abbbbbbbbbbbba.',
  '.abbbbbbbbbbbba.',
  'abbbbbbbbbbbbbba',
  'abbbbbbbbbbbbbba',
  'abbbbbbbbbbbbbba',
  'abbbbbbbbbbbbbba',
  'acbbbbbbbbbbbbba',
  'acccembbbbcccbba',
  'accebbbbbbbbbbba',
  '.acebcbbbbdddbba',
  '.acebcbbbeldgiba',
  '..aceecbbeghhbia',
  '...acccbbjjibiba',
  '....aacmmbibiba.',
  '.....alllmmaaa..',
  '.....acbicla....',
  '.....abibmffa...',
  '....ambbcmlna...',
  '....ambbmlffa...',
  '....ambbelffa...',
  '....aebbbella...',
  '....aebbbella...',
  '.....acbbelka...',
  '.....aeeekkma...',
  '.....akllkma....',
  '.....acccema....',
  '.....acccemma...',
  '.....accccama...',
  '.....accccaa....',
  '......aaaa......',
];
export const BORDES_X_DERECHO: readonly number[] = [48,56,62,68,76,82,88,96,102,108,116,122,128,136,142,148,154];
export const BORDES_Y_DERECHO: readonly number[] = [26,32,38,46,52,58,65,72,79,86,92,98,104,112,118,124,132,138,144,152,158,164,170,178,184,190,198,204,210,218,224,230,236,244];

