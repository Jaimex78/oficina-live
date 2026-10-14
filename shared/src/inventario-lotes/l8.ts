import type { ObjetoCatalogo } from '../arte';
import { CALIDA, CUATRO, PANTALLA, SILLA, TELA, def, luz } from '../inventario-def';

/**
 * Lote 8: el molde del estilo Gather v2 (atlas `objetos-v9`). Puestos de trabajo completos: escritorios de 3 casillas, silla
 * de oficina, los 29 computadores y aparatos de la categoría «Computadores y tecnología» de Gather (cada uno con su
 * equivalente propio) y los accesorios de escritorio. Ver `arte/GUIA-ESTILO-GATHER-V2.md` y `arte/GUIA-OBJETOS-V2.md`.
 *
 * Reglas del lote (se cumplen todas en `arte/tests/objetos-lote8.test.ts`):
 *  - Un objeto apoyado en un escritorio mide `ancho * 32` por `32 + sobresale` y tiene SOLO la orientación `S`, salvo los
 *    que ya existían con cuatro (`monitor`, `portatil`), que la conservan para no invalidar mapas guardados.
 *  - Las pantallas se dibujan de frente y encendidas: llevan `emisor` en modo `siempre`.
 *  - Los objetos que ya existían con el mismo tamaño se redibujan con el MISMO id (`silla-oficina`, `monitor`,
 *    `portatil`, `pc-gamer`, `pc-doble`, `torre-pc`, `mochila`, `audifonos-escritorio`, `lampara-escritorio`,
 *    `planta-chica`): los mapas guardados siguen funcionando y cambian de aspecto.
 */

const lampara = luz(CALIDA, 1.8, 0.55);
const pantalla = (radio: number, intensidad = 0.5): ReturnType<typeof luz> => luz(PANTALLA, radio, intensidad, 'siempre');
const MUGS = ['base', 'rojo', 'azul', 'verde', 'amarillo', 'negro'];
const ESCRITORIO = ['base', 'madera', 'negro', 'rojo'];
const LUCES_PC = ['base', 'azul', 'rojo', 'morado'];

export const LOTE_8: readonly ObjetoCatalogo[] = [
  // ---------- Puestos de trabajo: escritorios y silla ----------
  def({ id: 'escritorio-3x1', nombre: 'Escritorio de 3 puestos', categoria: 'puestos', ancho: 3, sobresale: 10, orientaciones: CUATRO, variantes: ESCRITORIO, etiquetas: ['escritorio', 'puesto', 'equipo', 'oficina'], lote: 8 }),
  def({ id: 'escritorio-3x2', nombre: 'Escritorio grande de equipo', categoria: 'puestos', ancho: 3, alto: 2, sobresale: 10, orientaciones: CUATRO, variantes: ESCRITORIO, etiquetas: ['escritorio', 'puesto', 'equipo', 'doble'], lote: 8 }),
  def({ id: 'silla-oficina', nombre: 'Silla de oficina', categoria: 'asientos', orientaciones: CUATRO, variantes: SILLA, interaccion: 'sentarse', etiquetas: ['silla', 'asiento', 'oficina'], lote: 8 }),

  // ---------- Computadores y tecnología (los 29 de Gather, apoyados en el escritorio) ----------
  def({ id: 'laptop-dock', nombre: 'Portátil con base de conexión', categoria: 'tecnologia', sobresale: 8, bloquea: 'nada', apoyado: true, orientaciones: ['S'], emisor: pantalla(1.4, 0.4), etiquetas: ['portátil', 'base', 'dock', 'puesto'], lote: 8 }),
  def({ id: 'portatil', nombre: 'Portátil', categoria: 'tecnologia', sobresale: 10, bloquea: 'nada', apoyado: true, orientaciones: CUATRO, emisor: pantalla(1.2, 0.4), etiquetas: ['portátil', 'computador'], lote: 8 }),
  def({ id: 'portatil-resistente', nombre: 'Portátil resistente', categoria: 'tecnologia', sobresale: 8, bloquea: 'nada', apoyado: true, orientaciones: ['S'], emisor: pantalla(1.2, 0.4), etiquetas: ['portátil', 'resistente', 'campo'], lote: 8 }),
  def({ id: 'consola-portatil', nombre: 'Consola portátil', categoria: 'tecnologia', bloquea: 'nada', apoyado: true, orientaciones: ['S'], emisor: pantalla(0.9, 0.3), etiquetas: ['consola', 'juego', 'portátil'], lote: 8 }),
  def({ id: 'telefono-conferencia', nombre: 'Teléfono de conferencia', categoria: 'tecnologia', bloquea: 'nada', apoyado: true, orientaciones: ['S'], emisor: luz('#7CFFB2', 0.9, 0.3, 'siempre'), etiquetas: ['teléfono', 'conferencia', 'reunión'], lote: 8 }),
  def({ id: 'tableta-soporte', nombre: 'Tableta con soporte', categoria: 'tecnologia', sobresale: 8, bloquea: 'nada', apoyado: true, orientaciones: ['S'], emisor: pantalla(1, 0.35), etiquetas: ['tableta', 'soporte'], lote: 8 }),
  def({ id: 'tableta-y-telefono', nombre: 'Tableta y teléfono', categoria: 'tecnologia', bloquea: 'nada', apoyado: true, orientaciones: ['S'], emisor: pantalla(0.9, 0.3), etiquetas: ['tableta', 'teléfono', 'móvil'], lote: 8 }),
  def({ id: 'monitor', nombre: 'Monitor extra', categoria: 'tecnologia', sobresale: 16, bloquea: 'nada', apoyado: true, orientaciones: CUATRO, emisor: pantalla(1.4, 0.45), etiquetas: ['monitor', 'pantalla'], lote: 8 }),
  def({ id: 'todo-en-uno', nombre: 'Computador todo en uno', categoria: 'tecnologia', sobresale: 16, bloquea: 'nada', apoyado: true, orientaciones: ['S'], emisor: pantalla(1.5, 0.45), etiquetas: ['computador', 'todo en uno', 'imac'], lote: 8 }),
  def({ id: 'computador-moderno', nombre: 'Computador de escritorio moderno', categoria: 'tecnologia', ancho: 2, sobresale: 24, bloquea: 'nada', apoyado: true, orientaciones: ['S'], emisor: pantalla(2, 0.5), etiquetas: ['computador', 'moderno', 'escritorio'], lote: 8 }),
  def({ id: 'computador-escritorio', nombre: 'Computador de escritorio', categoria: 'tecnologia', ancho: 2, sobresale: 24, bloquea: 'nada', apoyado: true, orientaciones: ['S'], emisor: pantalla(2, 0.5), etiquetas: ['computador', 'torre', 'escritorio'], lote: 8 }),
  def({ id: 'computador-retro-90s', nombre: 'Computador retro de los años 90', categoria: 'tecnologia', ancho: 2, sobresale: 24, bloquea: 'nada', apoyado: true, orientaciones: ['S'], emisor: luz('#B6E8A0', 1.8, 0.4, 'siempre'), etiquetas: ['computador', 'retro', '90s', 'crt'], lote: 8 }),
  def({ id: 'computador-retro-compacto', nombre: 'Computador retro compacto', categoria: 'tecnologia', sobresale: 16, bloquea: 'nada', apoyado: true, orientaciones: ['S'], emisor: luz('#B6E8A0', 1.2, 0.35, 'siempre'), etiquetas: ['computador', 'retro', 'compacto', 'macintosh'], lote: 8 }),
  def({ id: 'pc-doble', nombre: 'Computador con dos monitores', categoria: 'tecnologia', ancho: 2, sobresale: 24, bloquea: 'nada', apoyado: true, orientaciones: ['S'], emisor: pantalla(2, 0.5), etiquetas: ['computador', 'monitor', 'puesto', 'doble'], lote: 8 }),
  def({ id: 'pc-gamer', nombre: 'Computador gamer', categoria: 'tecnologia', ancho: 2, sobresale: 24, bloquea: 'nada', apoyado: true, orientaciones: ['S'], variantes: LUCES_PC, emisor: luz('#B58CFF', 2.2, 0.55, 'siempre', true), etiquetas: ['computador', 'gamer', 'pc', 'rgb'], lote: 8 }),
  def({ id: 'pc-desarrollador', nombre: 'Computador de desarrollo de software', categoria: 'tecnologia', ancho: 2, sobresale: 24, bloquea: 'nada', apoyado: true, orientaciones: ['S'], emisor: pantalla(2.2, 0.55), etiquetas: ['computador', 'código', 'desarrollo', 'monitores'], lote: 8 }),
  def({ id: 'pc-artista-digital', nombre: 'Computador de artista digital', categoria: 'tecnologia', ancho: 2, sobresale: 24, bloquea: 'nada', apoyado: true, orientaciones: ['S'], emisor: pantalla(2.2, 0.5), etiquetas: ['computador', 'arte', 'tableta gráfica', 'ilustración'], lote: 8 }),
  def({ id: 'pc-diseno-grafico', nombre: 'Computador de diseño gráfico', categoria: 'tecnologia', ancho: 2, sobresale: 24, bloquea: 'nada', apoyado: true, orientaciones: ['S'], emisor: pantalla(2.2, 0.5), etiquetas: ['computador', 'diseño', 'gráfico', 'color'], lote: 8 }),
  def({ id: 'pc-hardware', nombre: 'Computador de desarrollo de hardware', categoria: 'tecnologia', ancho: 2, sobresale: 24, bloquea: 'nada', apoyado: true, orientaciones: ['S'], emisor: luz('#7CFFB2', 2, 0.5, 'siempre'), etiquetas: ['computador', 'hardware', 'electrónica', 'osciloscopio'], lote: 8 }),
  def({ id: 'pc-musico', nombre: 'Computador de músico', categoria: 'tecnologia', ancho: 2, sobresale: 24, bloquea: 'nada', apoyado: true, orientaciones: ['S'], emisor: pantalla(2, 0.5), etiquetas: ['computador', 'música', 'teclado midi', 'producción'], lote: 8 }),
  def({ id: 'pc-audiofilo', nombre: 'Computador de audiófilo', categoria: 'tecnologia', ancho: 2, sobresale: 24, bloquea: 'nada', apoyado: true, orientaciones: ['S'], emisor: luz('#FFD79A', 1.8, 0.45, 'siempre'), etiquetas: ['computador', 'audio', 'parlantes', 'música'], lote: 8 }),
  def({ id: 'impresora-3d-cerrada', nombre: 'Impresora 3D cerrada', categoria: 'tecnologia', sobresale: 16, bloquea: 'nada', apoyado: true, orientaciones: ['S'], emisor: luz('#9CC8FF', 1.2, 0.35, 'siempre'), etiquetas: ['impresora 3d', 'prototipos', 'taller'], lote: 8 }),
  def({ id: 'impresora-3d-abierta', nombre: 'Impresora 3D abierta', categoria: 'tecnologia', sobresale: 16, bloquea: 'nada', apoyado: true, orientaciones: ['S'], emisor: luz('#FFB070', 1.1, 0.3, 'siempre'), etiquetas: ['impresora 3d', 'prototipos', 'taller'], lote: 8 }),
  def({ id: 'impresora-oficina', nombre: 'Impresora multifunción', categoria: 'tecnologia', ancho: 2, sobresale: 16, orientaciones: ['S'], emisor: luz('#9CC8FF', 1.2, 0.3, 'siempre'), etiquetas: ['impresora', 'fotocopiadora', 'oficina'], lote: 8 }),
  def({ id: 'impresora-gran-formato', nombre: 'Impresora de gran formato', categoria: 'tecnologia', ancho: 3, sobresale: 16, orientaciones: ['S'], emisor: luz('#9CC8FF', 1.4, 0.3, 'siempre'), etiquetas: ['impresora', 'plotter', 'planos', 'gran formato'], lote: 8 }),
  def({ id: 'maquina-cnc', nombre: 'Máquina CNC', categoria: 'tecnologia', ancho: 2, alto: 2, sobresale: 16, orientaciones: ['S'], emisor: luz('#FFB070', 1.4, 0.35, 'siempre'), etiquetas: ['cnc', 'taller', 'fabricación'], lote: 8 }),
  def({ id: 'robot-garra', nombre: 'Brazo robótico de garra', categoria: 'tecnologia', sobresale: 32, orientaciones: ['S'], emisor: luz('#7CFFB2', 1.2, 0.35, 'siempre'), etiquetas: ['robot', 'brazo', 'garra', 'industrial'], lote: 8 }),
  def({ id: 'robot-herramienta', nombre: 'Brazo robótico con herramienta', categoria: 'tecnologia', sobresale: 32, orientaciones: ['S'], emisor: luz('#FFB070', 1.2, 0.35, 'siempre'), etiquetas: ['robot', 'brazo', 'herramienta', 'industrial'], lote: 8 }),
  def({ id: 'maquina-pick-and-place', nombre: 'Máquina de montaje de componentes', categoria: 'tecnologia', ancho: 2, alto: 2, sobresale: 16, orientaciones: ['S'], emisor: luz('#7CFFB2', 1.4, 0.35, 'siempre'), etiquetas: ['pick and place', 'electrónica', 'fábrica'], lote: 8 }),

  // ---------- Torre y accesorios de escritorio ----------
  def({ id: 'torre-pc', nombre: 'Torre de computador', categoria: 'tecnologia', sobresale: 16, orientaciones: ['S'], variantes: LUCES_PC, emisor: luz('#5CC8FF', 1.6, 0.4, 'siempre', true), etiquetas: ['torre', 'computador', 'gamer'], lote: 8 }),
  def({ id: 'audifonos-escritorio', nombre: 'Audífonos sobre el escritorio', categoria: 'tecnologia', sobresale: 8, bloquea: 'nada', apoyado: true, orientaciones: ['S'], etiquetas: ['audífonos', 'música', 'puesto'], lote: 8 }),
  def({ id: 'control-videojuegos', nombre: 'Control de videojuegos', categoria: 'tecnologia', bloquea: 'nada', apoyado: true, orientaciones: ['S'], variantes: ['base', 'rojo', 'azul'], etiquetas: ['control', 'videojuegos', 'juego'], lote: 8 }),
  def({ id: 'telefono-escritorio', nombre: 'Teléfono de escritorio', categoria: 'tecnologia', bloquea: 'nada', apoyado: true, orientaciones: ['S'], variantes: ['base', 'blanco'], etiquetas: ['teléfono', 'oficina', 'escritorio'], lote: 8 }),
  def({ id: 'lampara-escritorio', nombre: 'Lámpara de escritorio', categoria: 'decoracion', sobresale: 8, bloquea: 'nada', apoyado: true, emisor: lampara, variantes: ['base', 'rojo', 'blanco'], etiquetas: ['lámpara', 'luz', 'escritorio'], lote: 8 }),
  def({ id: 'lampara-pantalla', nombre: 'Lámpara de escritorio con pantalla', categoria: 'decoracion', sobresale: 8, bloquea: 'nada', apoyado: true, emisor: lampara, etiquetas: ['lámpara', 'luz', 'escritorio', 'pantalla'], lote: 8 }),
  def({ id: 'cuaderno-cerrado', nombre: 'Cuaderno cerrado', categoria: 'decoracion', bloquea: 'nada', apoyado: true, variantes: ['base', 'azul', 'verde', 'amarillo'], etiquetas: ['cuaderno', 'notas', 'escritorio'], lote: 8 }),
  def({ id: 'cuaderno-abierto', nombre: 'Cuaderno abierto', categoria: 'decoracion', bloquea: 'nada', apoyado: true, etiquetas: ['cuaderno', 'notas', 'escritorio'], lote: 8 }),
  def({ id: 'planta-chica', nombre: 'Planta chica', categoria: 'decoracion', sobresale: 8, bloquea: 'nada', apoyado: true, etiquetas: ['planta', 'verde'], lote: 8 }),
  def({ id: 'mochila', nombre: 'Mochila', categoria: 'decoracion', bloquea: 'nada', variantes: ['base', 'verde', 'azul', 'rojo'], etiquetas: ['mochila', 'puesto'], lote: 8 }),
  def({ id: 'taza-regular', nombre: 'Taza', categoria: 'cocina', bloquea: 'nada', apoyado: true, variantes: MUGS, etiquetas: ['taza', 'café', 'escritorio'], lote: 8 }),
  def({ id: 'taza-ancha', nombre: 'Taza ancha', categoria: 'cocina', bloquea: 'nada', apoyado: true, variantes: MUGS, etiquetas: ['taza', 'café', 'escritorio'], lote: 8 }),
  def({ id: 'taza-alta', nombre: 'Taza alta', categoria: 'cocina', bloquea: 'nada', apoyado: true, variantes: MUGS, etiquetas: ['taza', 'café', 'escritorio'], lote: 8 }),
  def({ id: 'vaso-para-llevar', nombre: 'Vaso para llevar', categoria: 'cocina', bloquea: 'nada', apoyado: true, variantes: ['base', 'blanco', 'rojo'], etiquetas: ['vaso', 'café', 'escritorio', 'para llevar'], lote: 8 }),
];

/** Los objetos del lote que antes vivían en lotes anteriores y ahora se redibujan con el mismo id. */
export const REDIBUJADOS_EN_EL_LOTE_8: readonly string[] = ['silla-oficina', 'monitor', 'portatil', 'pc-doble', 'pc-gamer', 'torre-pc', 'audifonos-escritorio', 'lampara-escritorio', 'planta-chica', 'mochila'];

void TELA;
