/**
 * Transcripción literal de los perfiles con pelo y chaqueta roja del arte base de Jaime Orozco (archivos 15 y 16).
 * Generado por `arte/herramientas/transcribir-perfiles-pelo.ts`: no se edita a mano. Cada figura mide 21 columnas por 34 filas de píxeles de juego.
 * El 15 lleva el ojo medio cerrado (espabilar) y el 16 el ojo abierto. Letras = `LEYENDA` de `datos-disenador.ts` más W X Y Z (los 4 rojos de la chaqueta, de oscuro a claro).
 */

/** Los 4 tonos de la chaqueta roja, del más oscuro al más claro (las demás letras son las de LEYENDA). */
export const LEYENDA_ROJA: Readonly<Record<string, string>> = { W: '#681E2A', X: '#8E2C36', Y: '#B9434B', Z: '#D46071' };
export const COLORES_PNG_PELO: Readonly<Record<string, string>> = {"#F0C19B":"b","#CD8C64":"c","#222033":"d","#6E442F":"e","#ECE9EF":"f","#FFFEFD":"g","#603B33":"h","#C38F65":"i","#E58A65":"j","#9193A4":"k","#C7C2D0":"l","#A16643":"m","#FFFFFF":"n","#000000":"a","#383137":"o","#443E4F":"p","#2C2832":"q","#5F545D":"r","#681E2A":"W","#8E2C36":"X","#B9434B":"Y","#D46071":"Z"};
export const FONDO_PNG_PELO = '#DDEEDC';

export const PERFIL_PELO_IZQUIERDO: readonly string[] = [
  '....aaaaaaaaaaaa.....',
  '...apoqqopppppooaaa..',
  '....aqoppqoopppppooa.',
  '...aoppppoppoppppppoa',
  '..aoppppoppppppopppoa',
  '..apppppopppppporpppa',
  '.apqprpqpppopppporpra',
  'apoprpqproqpppprpopra',
  '.adrpodrodoproprrpopa',
  '..apqodpodopproprrpoa',
  '..apodbdpodoppqopppoa',
  '..aodbbcddbdopqeoopoa',
  '...adbbbbbbbdodbeoooa',
  '....abbcbbbbbdcbeooa.',
  '....abidddebbbcbeooa.',
  '....aibhhgbbbceeooa..',
  '....abibijjbbcdooa...',
  '.....abibibmXXdaa....',
  '......aaamXXZYYWa....',
  '........aXZZWWWWa....',
  '.......afWWWXXXXXa...',
  '.......anldXYYWXYYa..',
  '.......affldXYXWYZWa.',
  '.......aWWWdXYXWXZZa.',
  '.......aWWebdXXXWYZWa',
  '.......aWXebdXYYWWWYa',
  '.......aWXebbdXYXWYZa',
  '.......aXWXeedXYXWWa.',
  '........aWXXWdXYYWa..',
  '........aYWXXXdXXa...',
  '.......aYXdYYYaaa....',
  '.......aWdZZYXa......',
  '........aZYXWWa......',
  '........aaaaaaa......',
];
export const BORDES_X_PELO_IZQUIERDO: readonly number[] = [34,38,44,50,54,60,66,72,76,82,88,92,98,104,108,114,120,124,130,136,142,146];
export const BORDES_Y_PELO_IZQUIERDO: readonly number[] = [14,20,26,30,36,42,48,52,58,64,68,74,80,86,90,96,102,106,112,118,122,128,134,140,144,150,156,160,166,172,176,182,188,194,198];

export const PERFIL_PELO_DERECHO: readonly string[] = [
  '.....aaaaaaaaaaaa....',
  '..aaaoopppppoqqopa...',
  '.aoopppppooqppoqa....',
  'aoppppppoppoppppoa...',
  'aopppoppppppoppppoa..',
  'appproppppppopppppa..',
  'arproppppopppqprpqpa.',
  'arpoprppppqorpqprpopa',
  'apoprrporpodordoprda.',
  'aoprrporppodopdoqpa..',
  'aopppoqppodopdbdooa..',
  'aopooeqpodbddcbdoa...',
  'aoooebdodbbbbbdoa....',
  '.aooebcdbbbddddda....',
  '.aooebcbbbeldgiba....',
  '..aooeecbbeghhbia....',
  '...aoodcbbjjibiba....',
  '....aadXXmbibiba.....',
  '....aWYYZXXmaaa......',
  '....aWWWWZZXa........',
  '...aXXXXXWWWfa.......',
  '..aYYXWYYXdlna.......',
  '.aWZYWXYXdlffa.......',
  '.aZZXWXYXdWWWa.......',
  'aWZYWXXXdbeWWa.......',
  'aYWWWYYXdbeXWa.......',
  'aZYWXYXdbbeXWa.......',
  '.aWWXYXdeeXWXa.......',
  '..aWYYXdWXXWa........',
  '...aXXdXXXWYa........',
  '....aaaYYYdXYa.......',
  '......aXYZZdWa.......',
  '......aWWXYZa........',
  '......aaaaaaa........',
];
export const BORDES_X_PELO_DERECHO: readonly number[] = [44,48,54,60,66,70,76,82,86,92,98,102,108,114,118,124,130,134,140,146,152,156];
export const BORDES_Y_PELO_DERECHO: readonly number[] = [16,22,28,32,38,44,50,54,60,66,70,76,82,88,92,98,104,108,114,120,124,130,136,142,146,152,158,162,168,174,178,184,190,196,200];

