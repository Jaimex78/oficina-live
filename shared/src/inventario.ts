import { SENTADO_AJUSTES } from './sentado';
import type { Direccion, ObjetoCatalogo } from './arte';
import { CALIDA, CUATRO, HV, MADERAS, MURO, PANTALLA, SILLA, TELA, TELA2, U, def, luz } from './inventario-def';
import { LOTES_EXTRA } from './inventario-lotes';

export { COLORES_VARIANTE, MASCARAS_PARED, framesDe } from './inventario-def';

/**
 * Inventario de objetos de la oficina: la fuente única de metadatos.
 * El pipeline de arte solo dibuja: cada objeto, orientación y variante se pinta con el id de frame canónico
 * (`idFrame`) y el catálogo publicado se arma de aquí. El mundo, el editor y el servidor leen estos mismos datos.
 *
 * Los lotes 1 a 7 viven en este archivo (`INVENTARIO_BASE`). Desde el lote 8 cada lote nuevo vive en su propio archivo
 * de `inventario-lotes/` y se suma al final con una línea en `inventario-lotes/index.ts`. Las piezas para definir
 * objetos (`def`, `luz`, las listas de variantes) están en `inventario-def.ts`.
 * Convención de huella: `ancho`, `alto` y `bloquea` describen la orientación «S» (de frente).
 * Vista 3/4: el dibujo mide `ancho * 32` de ancho y `alto * 32 + sobresale` de alto, anclado a la esquina inferior izquierda.
 */

/** Todos los ids de frame que el catálogo promete. */
export function todosLosFrames(objetos: readonly ObjetoCatalogo[]): string[] {
  return objetos.flatMap((o) => Object.values(o.frames).flatMap((m) => Object.values(m)));
}

export interface Huella {
  ancho: number;
  alto: number;
  bloquea: [number, number][];
}

/** Huella según la orientación: «S» tal cual, «N» girada 180°, «E» 90° horario y «O» 90° antihorario. */
export function huellaDe(o: Pick<ObjetoCatalogo, 'ancho' | 'alto' | 'bloquea' | 'autotile'>, orientacion: string): Huella {
  const { ancho: w, alto: h, bloquea } = o;
  if (o.autotile || orientacion === 'S' || orientacion === 'U') return { ancho: w, alto: h, bloquea: bloquea.map(([x, y]) => [x, y]) };
  if (orientacion === 'N') return { ancho: w, alto: h, bloquea: bloquea.map(([x, y]) => [w - 1 - x, h - 1 - y]) };
  if (orientacion === 'E') return { ancho: h, alto: w, bloquea: bloquea.map(([x, y]) => [h - 1 - y, x]) };
  return { ancho: h, alto: w, bloquea: bloquea.map(([x, y]) => [y, w - 1 - x]) }; // 'O'
}

const INVENTARIO_BASE: readonly ObjetoCatalogo[] = [
  // ---------- Pisos (10) ----------
  def({ id: 'piso-madera-clara', nombre: 'Madera clara', categoria: 'pisos', capa: 'piso', bloquea: 'nada', etiquetas: ['piso', 'madera', 'oficina'], lote: 1 }),
  def({ id: 'piso-madera-oscura', nombre: 'Madera oscura', categoria: 'pisos', capa: 'piso', bloquea: 'nada', etiquetas: ['piso', 'madera'], lote: 1 }),
  def({ id: 'piso-baldosa', nombre: 'Baldosa', categoria: 'pisos', capa: 'piso', bloquea: 'nada', etiquetas: ['piso', 'baldosa'], lote: 1 }),
  def({ id: 'piso-cemento', nombre: 'Cemento pulido', categoria: 'pisos', capa: 'piso', bloquea: 'nada', etiquetas: ['piso', 'cemento'], lote: 1 }),
  def({ id: 'piso-alfombra-gris', nombre: 'Alfombra gris', categoria: 'pisos', capa: 'piso', bloquea: 'nada', etiquetas: ['piso', 'alfombra'] }),
  def({ id: 'piso-alfombra-roja', nombre: 'Alfombra roja', categoria: 'pisos', capa: 'piso', bloquea: 'nada', etiquetas: ['piso', 'alfombra', 'coral'] }),
  def({ id: 'piso-cesped', nombre: 'Césped', categoria: 'pisos', capa: 'piso', bloquea: 'nada', etiquetas: ['piso', 'exterior', 'verde'] }),
  def({ id: 'piso-deck', nombre: 'Deck de terraza', categoria: 'pisos', capa: 'piso', bloquea: 'nada', etiquetas: ['piso', 'exterior', 'madera'] }),
  def({ id: 'piso-parquet', nombre: 'Parquet espiga', categoria: 'pisos', capa: 'piso', bloquea: 'nada', etiquetas: ['piso', 'madera'] }),
  def({ id: 'piso-cocina', nombre: 'Baldosa de cocina', categoria: 'pisos', capa: 'piso', bloquea: 'nada', etiquetas: ['piso', 'cocina', 'baldosa'] }),

  // ---------- Paredes, ventanas y puertas (12) ----------
  def({ id: 'pared-lisa', pared: 'muro', nombre: 'Pared lisa', categoria: 'paredes', sobresale: 32, autotile: 'paredes4', variantes: ['base', 'gris', 'rojo'], etiquetas: ['pared', 'muro'], lote: 1 }),
  def({ id: 'pared-ventana', pared: 'abertura', nombre: 'Pared con ventana', categoria: 'paredes', sobresale: 32, orientaciones: MURO, ventana: true, emisor: luz('#EAF4FF', 2.2, 0.35, 'siempre'), etiquetas: ['pared', 'ventana', 'luz'], lote: 1 }),
  def({ id: 'vidrio', pared: 'muro', nombre: 'Pared de vidrio', categoria: 'paredes', sobresale: 32, autotile: 'paredes4', etiquetas: ['vidrio', 'divisor', 'sala'], lote: 1 }),
  def({ id: 'divisor-bajo', pared: 'muro', nombre: 'Divisor bajo', categoria: 'paredes', sobresale: 8, autotile: 'paredes4', variantes: ['base', 'gris', 'rojo'], etiquetas: ['divisor', 'cubículo'] }),
  def({ id: 'columna', nombre: 'Columna', categoria: 'paredes', sobresale: 32, etiquetas: ['columna'], lote: 1 }),
  def({ id: 'puerta-simple', pared: 'abertura', nombre: 'Puerta', categoria: 'paredes', sobresale: 32, orientaciones: HV, bloquea: 'nada', interaccion: 'puerta', etiquetas: ['puerta'], lote: 1 }),
  def({ id: 'puerta-doble', pared: 'abertura', nombre: 'Puerta doble', categoria: 'paredes', ancho: 2, sobresale: 32, orientaciones: HV, bloquea: 'nada', interaccion: 'puerta', etiquetas: ['puerta'], lote: 1 }),
  def({ id: 'puerta-vidrio', pared: 'abertura', nombre: 'Puerta de vidrio', categoria: 'paredes', sobresale: 32, orientaciones: HV, bloquea: 'nada', interaccion: 'puerta', etiquetas: ['puerta', 'vidrio', 'sala'] }),
  def({ id: 'arco', pared: 'abertura', nombre: 'Arco de paso', categoria: 'paredes', ancho: 2, sobresale: 32, orientaciones: HV, bloquea: 'nada', etiquetas: ['arco', 'paso'] }),
  def({ id: 'escalera', nombre: 'Escalera', categoria: 'paredes', ancho: 2, alto: 2, sobresale: 16, bloquea: 'nada', interaccion: 'portal', etiquetas: ['escalera', 'piso'] }),
  def({ id: 'ascensor', pared: 'abertura', nombre: 'Ascensor', categoria: 'paredes', ancho: 2, sobresale: 32, orientaciones: HV, bloquea: 'nada', interaccion: 'portal', emisor: luz('#FFFFFF', 1.6, 0.3, 'siempre'), etiquetas: ['ascensor', 'piso'] }),
  def({ id: 'portal', nombre: 'Portal entre salas', categoria: 'paredes', capa: 'suelo', bloquea: 'nada', interaccion: 'portal', emisor: luz('#B58CFF', 2, 0.55, 'siempre', true), etiquetas: ['portal', 'teletransporte', 'sala'], lote: 1 }),

  // ---------- Puestos de trabajo (10) ----------
  def({ id: 'escritorio-individual', nombre: 'Escritorio individual', categoria: 'puestos', ancho: 2, orientaciones: CUATRO, variantes: MADERAS, etiquetas: ['escritorio', 'puesto'], lote: 1, obsoleto: true, reemplazadoPor: 'escritorio-3x1' }),
  def({ id: 'escritorio-doble', nombre: 'Escritorio doble', categoria: 'puestos', ancho: 2, alto: 2, orientaciones: HV, variantes: MADERAS, etiquetas: ['escritorio', 'puesto', 'equipo'], lote: 1, obsoleto: true, reemplazadoPor: 'escritorio-3x2' }),
  def({ id: 'escritorio-l', nombre: 'Escritorio en L', categoria: 'puestos', ancho: 2, alto: 2, bloquea: [[0, 0], [1, 0], [0, 1]], orientaciones: CUATRO, variantes: MADERAS, etiquetas: ['escritorio', 'puesto'] }),
  def({ id: 'mesa-compartida-6', nombre: 'Mesa compartida de 6', categoria: 'puestos', ancho: 4, alto: 2, orientaciones: HV, variantes: MADERAS, etiquetas: ['mesa', 'puesto', 'equipo'], lote: 1 }),
  def({ id: 'escritorio-de-pie', nombre: 'Escritorio de pie', categoria: 'puestos', ancho: 2, orientaciones: CUATRO, variantes: MADERAS, etiquetas: ['escritorio', 'puesto'] }),
  def({ id: 'panel-divisor', nombre: 'Panel divisor', categoria: 'puestos', sobresale: 16, orientaciones: HV, variantes: ['base', 'gris', 'rojo'], etiquetas: ['divisor', 'puesto'], lote: 1 }),
  def({ id: 'locker', nombre: 'Locker', categoria: 'puestos', sobresale: 16, orientaciones: CUATRO, variantes: ['base', 'gris', 'rojo'], etiquetas: ['locker', 'guardar'] }),
  def({ id: 'archivador', nombre: 'Archivador', categoria: 'puestos', sobresale: 8, etiquetas: ['archivo', 'guardar'] }),
  def({ id: 'cajonera', nombre: 'Cajonera', categoria: 'puestos', etiquetas: ['cajón', 'guardar'] }),
  def({ id: 'papelera', nombre: 'Papelera', categoria: 'puestos', etiquetas: ['papelera', 'reciclaje'] }),

  // ---------- Sillas y asientos (12) ----------
  def({ id: 'silla-ejecutiva', nombre: 'Silla ejecutiva', categoria: 'asientos', sobresale: 8, orientaciones: CUATRO, variantes: SILLA, interaccion: 'sentarse', etiquetas: ['silla', 'asiento'] }),
  def({ id: 'silla-reunion', nombre: 'Silla de reunión', categoria: 'asientos', orientaciones: CUATRO, variantes: SILLA, interaccion: 'sentarse', etiquetas: ['silla', 'asiento', 'sala'], lote: 1 }),
  def({ id: 'banco', nombre: 'Banco', categoria: 'asientos', variantes: MADERAS, interaccion: 'sentarse', etiquetas: ['banco', 'asiento'] }),
  def({ id: 'taburete', nombre: 'Taburete', categoria: 'asientos', variantes: MADERAS, interaccion: 'sentarse', etiquetas: ['taburete', 'asiento'] }),
  def({ id: 'puff', nombre: 'Puff', categoria: 'asientos', variantes: TELA, interaccion: 'sentarse', etiquetas: ['puff', 'asiento', 'descanso'], lote: 1 }),
  def({ id: 'butaca', nombre: 'Butaca', categoria: 'asientos', sobresale: 8, orientaciones: CUATRO, variantes: TELA, interaccion: 'sentarse', etiquetas: ['butaca', 'asiento', 'descanso'], lote: 1 }),
  def({ id: 'sofa-2', nombre: 'Sofá de 2', categoria: 'asientos', ancho: 2, sobresale: 8, orientaciones: CUATRO, variantes: TELA, interaccion: 'sentarse', etiquetas: ['sofá', 'asiento', 'descanso'] }),
  def({ id: 'sofa-3', nombre: 'Sofá de 3', categoria: 'asientos', ancho: 3, sobresale: 8, orientaciones: CUATRO, variantes: TELA, interaccion: 'sentarse', etiquetas: ['sofá', 'asiento', 'descanso'], lote: 1 }),
  def({ id: 'sofa-l', nombre: 'Sofá en L', categoria: 'asientos', ancho: 3, alto: 2, sobresale: 8, orientaciones: CUATRO, variantes: TELA, interaccion: 'sentarse', etiquetas: ['sofá', 'asiento', 'descanso'] }),
  def({ id: 'banca-interior', nombre: 'Banca', categoria: 'asientos', ancho: 2, orientaciones: HV, variantes: MADERAS, interaccion: 'sentarse', etiquetas: ['banca', 'asiento'] }),
  def({ id: 'silla-comedor', nombre: 'Silla de comedor', categoria: 'asientos', orientaciones: CUATRO, variantes: MADERAS, interaccion: 'sentarse', etiquetas: ['silla', 'asiento', 'cocina'] }),

  // ---------- Mesas (10) ----------
  def({ id: 'mesa-reunion-4', nombre: 'Mesa de reunión de 4', categoria: 'mesas', ancho: 2, alto: 2, orientaciones: HV, variantes: MADERAS, etiquetas: ['mesa', 'reunión', 'sala'], lote: 1 }),
  def({ id: 'mesa-reunion-6', nombre: 'Mesa de reunión de 6', categoria: 'mesas', ancho: 3, alto: 2, orientaciones: HV, variantes: MADERAS, etiquetas: ['mesa', 'reunión', 'sala'], lote: 1 }),
  def({ id: 'mesa-reunion-8', nombre: 'Mesa de reunión de 8', categoria: 'mesas', ancho: 4, alto: 2, orientaciones: HV, variantes: MADERAS, etiquetas: ['mesa', 'reunión', 'sala'] }),
  def({ id: 'mesa-reunion-12', nombre: 'Mesa de reunión de 12', categoria: 'mesas', ancho: 6, alto: 2, orientaciones: HV, variantes: MADERAS, etiquetas: ['mesa', 'reunión', 'sala'] }),
  def({ id: 'mesa-redonda', nombre: 'Mesa redonda', categoria: 'mesas', ancho: 2, alto: 2, variantes: MADERAS, etiquetas: ['mesa', 'reunión'], lote: 1 }),
  def({ id: 'mesa-centro', nombre: 'Mesa de centro', categoria: 'mesas', ancho: 2, orientaciones: HV, variantes: MADERAS, etiquetas: ['mesa', 'descanso'], lote: 1 }),
  def({ id: 'mesa-alta', nombre: 'Mesa alta', categoria: 'mesas', variantes: MADERAS, etiquetas: ['mesa', 'café', 'cocina'] }),
  def({ id: 'mesa-comedor', nombre: 'Mesa de comedor', categoria: 'mesas', ancho: 3, alto: 2, orientaciones: HV, variantes: MADERAS, etiquetas: ['mesa', 'cocina'] }),
  def({ id: 'mesa-pingpong', nombre: 'Mesa de ping-pong', categoria: 'mesas', ancho: 3, alto: 2, orientaciones: HV, etiquetas: ['mesa', 'juego', 'descanso'] }),
  def({ id: 'futbolin', nombre: 'Futbolín', categoria: 'mesas', ancho: 3, alto: 2, orientaciones: HV, etiquetas: ['juego', 'descanso'] }),

  // ---------- Tecnología (10) ----------
  def({ id: 'tv-pared', montado: true, nombre: 'TV de pared', categoria: 'tecnologia', ancho: 2, bloquea: 'nada', sobresale: 16, orientaciones: MURO, emisor: luz(PANTALLA, 2.6, 0.55, 'siempre'), etiquetas: ['tv', 'pantalla', 'sala'], lote: 1 }),
  def({ id: 'pantalla-sala', nombre: 'Pantalla de sala', categoria: 'tecnologia', ancho: 3, sobresale: 16, orientaciones: HV, emisor: luz(PANTALLA, 3, 0.6, 'siempre'), interaccion: 'incrustado', etiquetas: ['pantalla', 'sala', 'presentación'], lote: 1 }),
  def({ id: 'pizarra-digital', nombre: 'Pizarra digital', categoria: 'tecnologia', ancho: 2, sobresale: 16, orientaciones: HV, emisor: luz(PANTALLA, 2.4, 0.5, 'siempre'), interaccion: 'incrustado', etiquetas: ['pizarra', 'pantalla', 'sala'] }),
  def({ id: 'proyector', nombre: 'Proyector', categoria: 'tecnologia', capa: 'sobre', bloquea: 'nada', etiquetas: ['proyector', 'sala'] }),
  def({ id: 'camara-sala', montado: true, nombre: 'Cámara de sala', categoria: 'tecnologia', capa: 'sobre', bloquea: 'nada', apoyado: true, orientaciones: MURO, etiquetas: ['cámara', 'sala'] }),
  def({ id: 'parlante', nombre: 'Parlante', categoria: 'tecnologia', bloquea: 'nada', apoyado: true, etiquetas: ['parlante', 'sonido'] }),

  // ---------- Colaboración (10) ----------
  def({ id: 'pizarron', nombre: 'Pizarrón blanco', categoria: 'colaboracion', ancho: 2, sobresale: 16, orientaciones: HV, interaccion: 'nota', etiquetas: ['pizarrón', 'sala', 'ideas'], lote: 1 }),
  def({ id: 'rotafolio', nombre: 'Rotafolio', categoria: 'colaboracion', sobresale: 16, interaccion: 'nota', etiquetas: ['rotafolio', 'sala'] }),
  def({ id: 'corcho', montado: true, nombre: 'Corcho', categoria: 'colaboracion', bloquea: 'nada', sobresale: 8, orientaciones: MURO, interaccion: 'nota', etiquetas: ['corcho', 'pared', 'notas'] }),
  def({ id: 'pared-postits', montado: true, nombre: 'Pared de post-its', categoria: 'colaboracion', ancho: 2, bloquea: 'nada', sobresale: 8, orientaciones: MURO, interaccion: 'nota', etiquetas: ['post-it', 'pared', 'ideas'] }),
  def({ id: 'muro-kanban', montado: true, nombre: 'Muro Kanban', categoria: 'colaboracion', ancho: 3, bloquea: 'nada', sobresale: 16, orientaciones: MURO, interaccion: 'enlace', emisor: luz('#FFFFFF', 2, 0.2, 'siempre'), etiquetas: ['kanban', 'tablero', 'trabajo'], lote: 1 }),
  def({ id: 'recepcion', nombre: 'Recepción', categoria: 'colaboracion', ancho: 3, sobresale: 8, orientaciones: CUATRO, variantes: MADERAS, etiquetas: ['recepción', 'mostrador'] }),
  def({ id: 'totem-bienvenida', nombre: 'Tótem de bienvenida', categoria: 'colaboracion', sobresale: 24, interaccion: 'nota', emisor: luz('#FFFFFF', 1.6, 0.4, 'siempre'), etiquetas: ['tótem', 'bienvenida'] }),
  def({ id: 'mesa-teams', nombre: 'Mesa de Teams', categoria: 'colaboracion', ancho: 2, orientaciones: HV, interaccion: 'teams', emisor: luz('#7B83EB', 2, 0.4, 'siempre'), etiquetas: ['teams', 'reunión', 'llamada', 'sala'], lote: 1 }),
  def({ id: 'cartel-zona', montado: true, nombre: 'Cartel de zona', categoria: 'colaboracion', bloquea: 'nada', sobresale: 16, orientaciones: MURO, interaccion: 'nota', etiquetas: ['cartel', 'letrero', 'zona'], lote: 1 }),
  def({ id: 'buzon-ideas', nombre: 'Buzón de ideas', categoria: 'colaboracion', sobresale: 8, interaccion: 'nota', etiquetas: ['buzón', 'ideas'] }),

  // ---------- Cocina y descanso (12) ----------
  def({ id: 'maquina-cafe', nombre: 'Máquina de café', categoria: 'cocina', sobresale: 16, emisor: luz('#FFB070', 1.4, 0.4, 'siempre'), etiquetas: ['café', 'cocina'], lote: 1 }),
  def({ id: 'nevera', nombre: 'Nevera', categoria: 'cocina', sobresale: 24, etiquetas: ['nevera', 'cocina'], lote: 1 }),
  def({ id: 'microondas', nombre: 'Microondas', categoria: 'cocina', bloquea: 'nada', apoyado: true, etiquetas: ['microondas', 'cocina'] }),
  def({ id: 'dispensador-agua', nombre: 'Dispensador de agua', categoria: 'cocina', sobresale: 16, etiquetas: ['agua', 'cocina'] }),
  def({ id: 'meson', nombre: 'Mesón de cocina', categoria: 'cocina', ancho: 3, sobresale: 8, orientaciones: HV, variantes: MADERAS, etiquetas: ['mesón', 'cocina'], lote: 1 }),
  def({ id: 'maquina-expendedora', nombre: 'Máquina expendedora', categoria: 'cocina', sobresale: 24, emisor: luz('#FFE6B0', 2, 0.5, 'siempre'), etiquetas: ['snacks', 'cocina'] }),
  def({ id: 'barra', nombre: 'Barra', categoria: 'cocina', ancho: 3, sobresale: 8, orientaciones: HV, variantes: MADERAS, etiquetas: ['barra', 'cocina', 'café'] }),
  def({ id: 'cafetera', nombre: 'Cafetera', categoria: 'cocina', bloquea: 'nada', apoyado: true, etiquetas: ['café', 'cocina'] }),
  def({ id: 'tostadora', nombre: 'Tostadora', categoria: 'cocina', bloquea: 'nada', apoyado: true, etiquetas: ['cocina'] }),
  def({ id: 'frutero', nombre: 'Frutero', categoria: 'cocina', bloquea: 'nada', apoyado: true, etiquetas: ['fruta', 'cocina'] }),
  def({ id: 'nevera-bebidas', nombre: 'Nevera de bebidas', categoria: 'cocina', sobresale: 24, emisor: luz('#CFE8FF', 1.6, 0.4, 'siempre'), etiquetas: ['bebidas', 'cocina'] }),
  def({ id: 'lavaplatos', nombre: 'Lavaplatos', categoria: 'cocina', ancho: 2, sobresale: 8, orientaciones: HV, etiquetas: ['lavaplatos', 'cocina'] }),

  // ---------- Decoración (20) ----------
  def({ id: 'planta-mediana', nombre: 'Planta mediana', categoria: 'decoracion', sobresale: 16, etiquetas: ['planta', 'verde'], lote: 1 }),
  def({ id: 'planta-grande', nombre: 'Planta grande', categoria: 'decoracion', sobresale: 32, etiquetas: ['planta', 'verde'], lote: 1 }),
  def({ id: 'planta-colgante', nombre: 'Planta colgante', categoria: 'decoracion', capa: 'sobre', bloquea: 'nada', sobresale: 16, etiquetas: ['planta', 'verde', 'techo'] }),
  def({ id: 'palmera', nombre: 'Palmera', categoria: 'decoracion', ancho: 2, alto: 2, sobresale: 48, bloquea: [[0, 1], [1, 1]], etiquetas: ['planta', 'verde', 'árbol'] }),
  def({ id: 'cuadro-chico', montado: true, nombre: 'Cuadro chico', categoria: 'decoracion', bloquea: 'nada', orientaciones: MURO, etiquetas: ['cuadro', 'pared', 'arte'] }),
  def({ id: 'cuadro-grande', montado: true, nombre: 'Cuadro grande', categoria: 'decoracion', ancho: 2, bloquea: 'nada', orientaciones: MURO, variantes: ['base', 'rojo', 'negro'], etiquetas: ['cuadro', 'pared', 'arte'], lote: 1 }),
  def({ id: 'reloj-pared', montado: true, nombre: 'Reloj de pared', categoria: 'decoracion', bloquea: 'nada', orientaciones: MURO, etiquetas: ['reloj', 'pared'] }),
  def({ id: 'lampara-pie', nombre: 'Lámpara de pie', categoria: 'decoracion', sobresale: 24, emisor: luz(CALIDA, 3.6, 0.75), etiquetas: ['lámpara', 'luz'], lote: 1 }),
  def({ id: 'lampara-mesa', nombre: 'Lámpara de mesa', categoria: 'decoracion', bloquea: 'nada', apoyado: true, emisor: luz(CALIDA, 2.2, 0.6), etiquetas: ['lámpara', 'luz'] }),
  def({ id: 'lampara-colgante', nombre: 'Lámpara colgante', categoria: 'decoracion', capa: 'sobre', bloquea: 'nada', sobresale: 16, emisor: luz(CALIDA, 3.2, 0.7), etiquetas: ['lámpara', 'luz', 'techo'] }),
  def({ id: 'estanteria-libros', nombre: 'Estantería con libros', categoria: 'decoracion', ancho: 2, sobresale: 32, orientaciones: HV, variantes: MADERAS, etiquetas: ['estantería', 'libros'], lote: 1 }),
  def({ id: 'trofeos', nombre: 'Trofeos', categoria: 'decoracion', bloquea: 'nada', apoyado: true, etiquetas: ['trofeo', 'premios'] }),
  def({ id: 'bandera', nombre: 'Bandera', categoria: 'decoracion', sobresale: 32, variantes: ['base', 'rojo', 'negro'], etiquetas: ['bandera'] }),
  def({ id: 'cojin', nombre: 'Cojín', categoria: 'decoracion', bloquea: 'nada', apoyado: true, variantes: TELA, etiquetas: ['cojín', 'descanso'] }),
  def({ id: 'pecera', nombre: 'Pecera', categoria: 'decoracion', sobresale: 8, emisor: luz('#7EC8FF', 1.8, 0.45, 'siempre'), etiquetas: ['pecera', 'agua'] }),
  def({ id: 'cortinas', montado: true, nombre: 'Cortinas', categoria: 'decoracion', bloquea: 'nada', sobresale: 16, orientaciones: MURO, variantes: TELA, etiquetas: ['cortina', 'ventana'] }),
  def({ id: 'espejo', montado: true, nombre: 'Espejo', categoria: 'decoracion', bloquea: 'nada', sobresale: 8, orientaciones: MURO, etiquetas: ['espejo', 'pared'] }),
  def({ id: 'alfombra-grande', nombre: 'Alfombra grande', categoria: 'decoracion', ancho: 3, alto: 2, capa: 'suelo', bloquea: 'nada', variantes: ['base', 'rojo', 'azul', 'verde', 'negro'], etiquetas: ['alfombra', 'suelo'], lote: 1 }),
  def({ id: 'alfombra-redonda', nombre: 'Alfombra redonda', categoria: 'decoracion', ancho: 2, alto: 2, capa: 'suelo', bloquea: 'nada', variantes: ['base', 'rojo', 'azul', 'verde', 'negro'], etiquetas: ['alfombra', 'suelo'] }),

  // ---------- Temporada y eventos (8) ----------
  def({ id: 'luces-navidad', nombre: 'Luces de Navidad', categoria: 'temporada', ancho: 2, capa: 'sobre', bloquea: 'nada', sobresale: 8, emisor: luz('#FFCF70', 2.4, 0.6, 'noche', true), etiquetas: ['navidad', 'luces', 'temporada'], coleccion: 'navidad' }),
  def({ id: 'arbol-navidad', nombre: 'Árbol de Navidad', categoria: 'temporada', sobresale: 32, emisor: luz('#FFE08A', 2.6, 0.6, 'siempre', true), etiquetas: ['navidad', 'temporada'], coleccion: 'navidad' }),
  def({ id: 'calabazas', nombre: 'Calabazas', categoria: 'temporada', bloquea: 'nada', apoyado: true, emisor: luz('#FF9A3C', 1.4, 0.5, 'noche', true), etiquetas: ['halloween', 'temporada'], coleccion: 'halloween' }),
  def({ id: 'globos', nombre: 'Globos', categoria: 'temporada', capa: 'sobre', bloquea: 'nada', sobresale: 16, variantes: ['base', 'rojo', 'azul', 'amarillo'], etiquetas: ['globos', 'fiesta', 'evento'], coleccion: 'cumpleanos' }),
  def({ id: 'banderines', nombre: 'Banderines', categoria: 'temporada', ancho: 3, capa: 'sobre', bloquea: 'nada', variantes: ['base', 'rojo', 'azul'], etiquetas: ['banderines', 'fiesta', 'evento'], coleccion: 'cumpleanos' }),
  def({ id: 'regalos', nombre: 'Regalos', categoria: 'temporada', bloquea: 'nada', apoyado: true, variantes: ['base', 'rojo', 'azul', 'verde'], etiquetas: ['regalos', 'evento'], coleccion: 'cumpleanos' }),
  def({ id: 'cartel-cumpleanos', montado: true, nombre: 'Cartel de cumpleaños', categoria: 'temporada', ancho: 2, bloquea: 'nada', orientaciones: MURO, interaccion: 'nota', etiquetas: ['cumpleaños', 'fiesta', 'evento'], coleccion: 'cumpleanos' }),
  def({ id: 'pinata', nombre: 'Piñata', categoria: 'temporada', capa: 'sobre', bloquea: 'nada', sobresale: 16, etiquetas: ['piñata', 'fiesta', 'evento'], coleccion: 'cumpleanos' }),

  // ---------- Exterior (8) ----------
  def({ id: 'banca-exterior', nombre: 'Banca de parque', categoria: 'exterior', ancho: 2, orientaciones: HV, interaccion: 'sentarse', etiquetas: ['banca', 'terraza', 'exterior'] }),
  def({ id: 'mesa-terraza', nombre: 'Mesa de terraza', categoria: 'exterior', variantes: ['base', 'blanco', 'negro'], etiquetas: ['mesa', 'terraza', 'exterior'] }),
  def({ id: 'sombrilla', nombre: 'Sombrilla', categoria: 'exterior', ancho: 2, alto: 2, capa: 'sobre', bloquea: 'nada', sobresale: 16, variantes: ['base', 'rojo', 'blanco'], etiquetas: ['sombrilla', 'terraza', 'exterior'] }),
  def({ id: 'jardinera', nombre: 'Jardinera', categoria: 'exterior', ancho: 2, sobresale: 8, orientaciones: HV, etiquetas: ['jardinera', 'plantas', 'exterior'] }),
  def({ id: 'arbol', nombre: 'Árbol', categoria: 'exterior', ancho: 2, alto: 2, sobresale: 64, bloquea: [[0, 1], [1, 1]], etiquetas: ['árbol', 'verde', 'exterior'] }),
  def({ id: 'fuente', nombre: 'Fuente', categoria: 'exterior', ancho: 2, alto: 2, sobresale: 8, emisor: luz('#9ED8FF', 2.4, 0.4, 'siempre'), etiquetas: ['fuente', 'agua', 'exterior'] }),
  def({ id: 'bicicletero', nombre: 'Bicicletero', categoria: 'exterior', ancho: 2, orientaciones: HV, etiquetas: ['bicicletas', 'exterior'] }),
  def({ id: 'cerca', pared: 'muro', nombre: 'Cerca baja', categoria: 'exterior', sobresale: 8, autotile: 'paredes4', variantes: ['base', 'blanco', 'negro'], etiquetas: ['cerca', 'exterior'] }),

  // ---------- Lote 3: pisos, juegos y objetos pequeños ----------
  def({ id: 'piso-ladrillo-crema', nombre: 'Ladrillo crema', categoria: 'pisos', capa: 'piso', bloquea: 'nada', etiquetas: ['piso', 'ladrillo', 'pasillo'], lote: 3 }),
  def({ id: 'piso-alfombra-lavanda', nombre: 'Alfombra lavanda', categoria: 'pisos', capa: 'piso', bloquea: 'nada', etiquetas: ['piso', 'alfombra', 'sala'], lote: 3 }),
  def({ id: 'piso-baldosa-ajedrez', nombre: 'Baldosa en damero', categoria: 'pisos', capa: 'piso', bloquea: 'nada', etiquetas: ['piso', 'baldosa', 'equipo'], lote: 3 }),
  def({ id: 'piso-losa-rombos', nombre: 'Losa con rombos', categoria: 'pisos', capa: 'piso', bloquea: 'nada', etiquetas: ['piso', 'losa', 'descanso'], lote: 3 }),

  def({ id: 'manzana', nombre: 'Manzana', categoria: 'decoracion', bloquea: 'nada', apoyado: true, etiquetas: ['fruta', 'comida'], lote: 3 }),
  def({ id: 'cono-naranja', nombre: 'Cono naranja', categoria: 'decoracion', bloquea: 'nada', etiquetas: ['cono', 'señal'], lote: 3 }),
  def({ id: 'planta-helecho', nombre: 'Planta de hojas en bowl', categoria: 'decoracion', bloquea: 'nada', apoyado: true, etiquetas: ['planta', 'verde'], lote: 3 }),
  def({ id: 'suculenta', nombre: 'Suculenta', categoria: 'decoracion', bloquea: 'nada', apoyado: true, etiquetas: ['planta', 'cactus'], lote: 3 }),
  def({ id: 'planta-globo', nombre: 'Planta globo', categoria: 'decoracion', sobresale: 8, etiquetas: ['planta', 'verde'], lote: 3 }),
  def({ id: 'pato-de-goma', nombre: 'Pato de goma', categoria: 'decoracion', bloquea: 'nada', apoyado: true, etiquetas: ['pato', 'juguete'], lote: 3 }),
  def({ id: 'taza-postre', nombre: 'Taza con postre', categoria: 'cocina', bloquea: 'nada', apoyado: true, etiquetas: ['taza', 'café', 'postre'], lote: 3 }),
  def({ id: 'bowl-comida', nombre: 'Bowl de comida', categoria: 'cocina', bloquea: 'nada', apoyado: true, etiquetas: ['comida', 'almuerzo'], lote: 3 }),
  def({ id: 'consola-juegos', nombre: 'Consola y control', categoria: 'tecnologia', bloquea: 'nada', apoyado: true, emisor: luz(PANTALLA, 1.2, 0.3, 'siempre'), etiquetas: ['consola', 'juego', 'control'], lote: 3 }),
  def({ id: 'figuritas', nombre: 'Figuritas', categoria: 'decoracion', bloquea: 'nada', apoyado: true, etiquetas: ['figuras', 'escritorio'], lote: 3 }),

  def({ id: 'reloj-de-pie', nombre: 'Reloj de pie', categoria: 'decoracion', sobresale: 32, etiquetas: ['reloj', 'antiguo'], lote: 3 }),
  def({ id: 'sillon-rojo', nombre: 'Sillón', categoria: 'asientos', sobresale: 8, orientaciones: CUATRO, variantes: TELA2, interaccion: 'sentarse', etiquetas: ['sillón', 'asiento', 'descanso'], lote: 3 }),
  def({ id: 'silla-tallada', nombre: 'Silla tallada', categoria: 'asientos', sobresale: 8, orientaciones: CUATRO, variantes: ['base', 'rojo', 'azul', 'verde'], interaccion: 'sentarse', etiquetas: ['silla', 'asiento', 'madera'], lote: 3 }),
  def({ id: 'perchero', nombre: 'Perchero con bombillas', categoria: 'decoracion', sobresale: 32, emisor: luz(CALIDA, 2.4, 0.6), etiquetas: ['perchero', 'luz', 'entrada'], lote: 3 }),
  def({ id: 'camara-tripode', nombre: 'Cámara en trípode', categoria: 'tecnologia', sobresale: 16, etiquetas: ['cámara', 'trípode', 'video'], lote: 3 }),
  def({ id: 'ave-del-paraiso', nombre: 'Ave del paraíso', categoria: 'decoracion', sobresale: 32, etiquetas: ['planta', 'flor', 'verde'], lote: 3 }),
  def({ id: 'espantapajaros', nombre: 'Espantapájaros', categoria: 'temporada', sobresale: 24, etiquetas: ['otoño', 'cosecha', 'decoración'], lote: 3, coleccion: 'halloween' }),
  def({ id: 'maquina-arcade', nombre: 'Máquina arcade', categoria: 'juegos', sobresale: 24, orientaciones: HV, variantes: ['base', 'azul', 'rojo'], emisor: luz('#7CFFB2', 2.2, 0.55, 'siempre'), interaccion: 'incrustado', etiquetas: ['arcade', 'juego', 'recreo'], lote: 3 }),
  def({ id: 'balon-futbol', nombre: 'Balón de fútbol', categoria: 'juegos', bloquea: 'nada', etiquetas: ['balón', 'fútbol', 'deporte'], lote: 3 }),
  def({ id: 'comoda', nombre: 'Cómoda', categoria: 'decoracion', ancho: 2, sobresale: 8, orientaciones: HV, variantes: MADERAS, etiquetas: ['cómoda', 'cajones', 'mueble'], lote: 3 }),
  def({ id: 'estante-plantas', nombre: 'Estante de plantas', categoria: 'decoracion', ancho: 2, sobresale: 24, orientaciones: HV, etiquetas: ['estante', 'plantas', 'verde'], lote: 3 }),
  def({ id: 'estante-frascos', nombre: 'Estante de frascos', categoria: 'cocina', ancho: 2, sobresale: 16, orientaciones: HV, etiquetas: ['estante', 'frascos', 'despensa'], lote: 3 }),
  def({ id: 'chimenea', nombre: 'Chimenea con repisa', categoria: 'decoracion', ancho: 3, sobresale: 32, emisor: luz('#FF9A3C', 3.2, 0.7, 'noche', true), etiquetas: ['chimenea', 'fuego', 'luz'], lote: 3 }),
  def({ id: 'acuario', nombre: 'Acuario', categoria: 'decoracion', ancho: 2, sobresale: 16, orientaciones: HV, emisor: luz('#7EC8FF', 2.2, 0.45, 'siempre'), etiquetas: ['acuario', 'peces', 'agua'], lote: 3 }),
  def({ id: 'mini-nevera', nombre: 'Mini nevera', categoria: 'cocina', sobresale: 8, etiquetas: ['nevera', 'cocina'], lote: 3 }),
  def({ id: 'cuadro-mariposas', montado: true, nombre: 'Cuadro de mariposas', categoria: 'decoracion', ancho: 2, bloquea: 'nada', orientaciones: MURO, etiquetas: ['cuadro', 'mariposas', 'pared'], lote: 3 }),
  // Lote 4: equipo gamer, zona de PlayStation y baños).
  def({ id: 'ps5', nombre: 'Consola PlayStation 5', categoria: 'tecnologia', bloquea: 'nada', apoyado: true, orientaciones: ['S'], emisor: luz('#6FA8FF', 1.4, 0.4, 'siempre'), etiquetas: ['consola', 'playstation', 'ps5', 'juego'], lote: 4 }),
  def({ id: 'sanitario', nombre: 'Sanitario', categoria: 'banos', sobresale: 8, orientaciones: CUATRO, etiquetas: ['baño', 'sanitario'], lote: 4 }),
  def({ id: 'lavamanos', nombre: 'Lavamanos con espejo', categoria: 'banos', ancho: 2, sobresale: 24, orientaciones: HV, etiquetas: ['baño', 'lavamanos', 'espejo'], lote: 4 }),
  def({ id: 'urinario', grupo: 'banos', montado: true, nombre: 'Urinario', categoria: 'banos', bloquea: 'nada', sobresale: 8, orientaciones: MURO, etiquetas: ['baño', 'urinario'], lote: 4 }),

  // Lote 5: el ocio (billar, dardos, música, karts).
  def({ id: 'mesa-billar', nombre: 'Mesa de billar', categoria: 'juegos', ancho: 3, alto: 2, orientaciones: HV, etiquetas: ['billar', 'pool', 'juego'], lote: 5 }),
  def({ id: 'mesa-air-hockey', nombre: 'Mesa de hockey de aire', categoria: 'juegos', ancho: 3, alto: 2, orientaciones: HV, etiquetas: ['hockey', 'juego', 'recreo'], lote: 5 }),
  def({ id: 'mesa-poker', nombre: 'Mesa de póker', categoria: 'juegos', ancho: 3, alto: 2, orientaciones: HV, etiquetas: ['póker', 'cartas', 'juego'], lote: 5 }),
  def({ id: 'mesa-ajedrez', nombre: 'Mesa de ajedrez', categoria: 'juegos', orientaciones: HV, etiquetas: ['ajedrez', 'juego'], lote: 5 }),
  def({ id: 'diana-dardos', nombre: 'Diana de dardos', categoria: 'juegos', montado: true, bloquea: 'nada', orientaciones: MURO, etiquetas: ['dardos', 'diana', 'juego', 'pared'], lote: 5 }),
  def({ id: 'aro-baloncesto', nombre: 'Aro de baloncesto', categoria: 'juegos', montado: true, bloquea: 'nada', sobresale: 8, orientaciones: MURO, etiquetas: ['baloncesto', 'deporte', 'pared'], lote: 5 }),
  def({ id: 'jukebox', nombre: 'Rockola', categoria: 'juegos', sobresale: 24, orientaciones: HV, emisor: luz('#FF9AD5', 2.2, 0.5, 'siempre', true), etiquetas: ['música', 'rockola', 'jukebox'], lote: 5 }),
  def({ id: 'piano', nombre: 'Piano', categoria: 'juegos', ancho: 2, sobresale: 16, orientaciones: HV, etiquetas: ['piano', 'música'], lote: 5 }),
  def({ id: 'guitarra', nombre: 'Guitarra en su soporte', categoria: 'decoracion', bloquea: 'nada', sobresale: 16, etiquetas: ['guitarra', 'música'], lote: 5 }),
  def({ id: 'vinilo-alfombra', nombre: 'Disco de vinilo gigante', categoria: 'decoracion', ancho: 2, alto: 2, capa: 'suelo', bloquea: 'nada', etiquetas: ['vinilo', 'música', 'alfombra', 'suelo'], lote: 5 }),
  def({ id: 'cabina-fotos', nombre: 'Cabina de fotos', categoria: 'juegos', ancho: 2, sobresale: 32, orientaciones: HV, emisor: luz('#FFE6B0', 2, 0.45, 'siempre'), etiquetas: ['fotos', 'cabina', 'recuerdo'], lote: 5 }),
  def({ id: 'kart', nombre: 'Kart', categoria: 'juegos', orientaciones: CUATRO, variantes: ['base', 'azul', 'rojo'], etiquetas: ['kart', 'carro', 'vehículo', 'juego'], lote: 5 }),
  def({ id: 'sillon-gamer', nombre: 'Silla gamer', categoria: 'asientos', sobresale: 16, orientaciones: CUATRO, variantes: ['base', 'rojo', 'azul', 'morado'], interaccion: 'sentarse', etiquetas: ['silla', 'gamer', 'asiento'], lote: 5 }),
  def({ id: 'rack-servidores', nombre: 'Rack de servidores', categoria: 'tecnologia', sobresale: 24, orientaciones: HV, emisor: luz('#7CFFB2', 1.6, 0.4, 'siempre', true), etiquetas: ['servidores', 'datos', 'rack'], lote: 5 }),
  def({ id: 'nevera-vinos', nombre: 'Nevera de vinos', categoria: 'cocina', sobresale: 16, emisor: luz('#CFE8FF', 1.4, 0.35, 'siempre'), etiquetas: ['vinos', 'bebidas', 'cocina'], lote: 5 }),

  // Lote 6: las fiestas del año, una colección (subcarpeta) por fiesta.
  def({ id: 'calabaza-grande', nombre: 'Calabaza tallada', categoria: 'temporada', sobresale: 8, emisor: luz('#FF9A3C', 2, 0.6, 'noche', true), etiquetas: ['calabaza', 'halloween'], lote: 6, coleccion: 'halloween' }),
  def({ id: 'telarana', nombre: 'Telaraña', categoria: 'temporada', montado: true, bloquea: 'nada', ancho: 2, orientaciones: MURO, etiquetas: ['telaraña', 'halloween', 'pared'], lote: 6, coleccion: 'halloween' }),
  def({ id: 'esqueleto', nombre: 'Esqueleto', categoria: 'temporada', sobresale: 24, etiquetas: ['esqueleto', 'halloween'], lote: 6, coleccion: 'halloween' }),
  def({ id: 'tumba', nombre: 'Lápida', categoria: 'temporada', sobresale: 16, etiquetas: ['tumba', 'cementerio', 'halloween'], lote: 6, coleccion: 'halloween' }),
  def({ id: 'caldero', nombre: 'Caldero de bruja', categoria: 'temporada', sobresale: 8, emisor: luz('#7CFF6B', 2, 0.55, 'siempre', true), etiquetas: ['caldero', 'bruja', 'halloween'], lote: 6, coleccion: 'halloween' }),
  def({ id: 'fantasma-colgante', nombre: 'Fantasma colgante', categoria: 'temporada', capa: 'sobre', bloquea: 'nada', sobresale: 16, etiquetas: ['fantasma', 'halloween'], lote: 6, coleccion: 'halloween' }),
  def({ id: 'murcielagos', nombre: 'Murciélagos', categoria: 'temporada', montado: true, bloquea: 'nada', ancho: 2, orientaciones: MURO, etiquetas: ['murciélagos', 'halloween', 'pared'], lote: 6, coleccion: 'halloween' }),
  def({ id: 'escoba', nombre: 'Escoba de bruja', categoria: 'temporada', bloquea: 'nada', sobresale: 16, etiquetas: ['escoba', 'bruja', 'halloween'], lote: 6, coleccion: 'halloween' }),
  def({ id: 'arbol-seco', nombre: 'Árbol seco', categoria: 'temporada', ancho: 2, alto: 2, sobresale: 64, bloquea: [[0, 1], [1, 1]], etiquetas: ['árbol', 'seco', 'halloween'], lote: 6, coleccion: 'halloween' }),
  def({ id: 'bowl-dulces', nombre: 'Bowl de dulces', categoria: 'temporada', bloquea: 'nada', apoyado: true, etiquetas: ['dulces', 'halloween'], lote: 6, coleccion: 'halloween' }),
  def({ id: 'pesebre', nombre: 'Pesebre', categoria: 'temporada', ancho: 2, sobresale: 8, etiquetas: ['pesebre', 'navidad'], lote: 6, coleccion: 'navidad' }),
  def({ id: 'muneco-nieve', nombre: 'Muñeco de nieve', categoria: 'temporada', sobresale: 16, etiquetas: ['nieve', 'navidad'], lote: 6, coleccion: 'navidad' }),
  def({ id: 'corona-navidena', nombre: 'Corona navideña', categoria: 'temporada', montado: true, bloquea: 'nada', orientaciones: MURO, etiquetas: ['corona', 'navidad', 'pared'], lote: 6, coleccion: 'navidad' }),
  def({ id: 'guirnalda', nombre: 'Guirnalda', categoria: 'temporada', montado: true, bloquea: 'nada', ancho: 2, orientaciones: MURO, etiquetas: ['guirnalda', 'navidad', 'pared'], lote: 6, coleccion: 'navidad' }),
  def({ id: 'reno', nombre: 'Reno', categoria: 'temporada', sobresale: 16, etiquetas: ['reno', 'navidad'], lote: 6, coleccion: 'navidad' }),
  def({ id: 'calcetin-chimenea', nombre: 'Calcetines de Navidad', categoria: 'temporada', montado: true, bloquea: 'nada', orientaciones: MURO, etiquetas: ['calcetín', 'navidad', 'pared'], lote: 6, coleccion: 'navidad' }),
  def({ id: 'ramo-rosas', nombre: 'Ramo de rosas', categoria: 'temporada', bloquea: 'nada', apoyado: true, etiquetas: ['rosas', 'amor'], lote: 6, coleccion: 'amor-amistad' }),
  def({ id: 'globos-corazon', nombre: 'Globos de corazón', categoria: 'temporada', capa: 'sobre', bloquea: 'nada', sobresale: 16, variantes: ['base', 'rojo'], etiquetas: ['globos', 'corazón', 'amor'], lote: 6, coleccion: 'amor-amistad' }),
  def({ id: 'oso-peluche', nombre: 'Oso de peluche', categoria: 'temporada', bloquea: 'nada', sobresale: 8, etiquetas: ['oso', 'peluche', 'amor'], lote: 6, coleccion: 'amor-amistad' }),
  def({ id: 'caja-chocolates', nombre: 'Caja de chocolates', categoria: 'temporada', bloquea: 'nada', apoyado: true, etiquetas: ['chocolates', 'amor'], lote: 6, coleccion: 'amor-amistad' }),
  def({ id: 'copas-champan', nombre: 'Copas de champán', categoria: 'temporada', bloquea: 'nada', apoyado: true, etiquetas: ['copas', 'brindis', 'año nuevo'], lote: 6, coleccion: 'ano-nuevo' }),
  def({ id: 'globos-ano-nuevo', nombre: 'Globos de Año Nuevo', categoria: 'temporada', capa: 'sobre', bloquea: 'nada', sobresale: 16, etiquetas: ['globos', 'año nuevo'], lote: 6, coleccion: 'ano-nuevo' }),
  def({ id: 'cuenta-regresiva', nombre: 'Cuenta regresiva', categoria: 'temporada', montado: true, bloquea: 'nada', ancho: 2, orientaciones: MURO, emisor: luz('#FFE08A', 2, 0.5, 'siempre'), etiquetas: ['reloj', 'año nuevo', 'pared'], lote: 6, coleccion: 'ano-nuevo' }),
  def({ id: 'serpentinas', nombre: 'Serpentinas', categoria: 'temporada', capa: 'sobre', bloquea: 'nada', ancho: 2, etiquetas: ['serpentinas', 'fiesta', 'año nuevo'], lote: 6, coleccion: 'ano-nuevo' }),
  def({ id: 'bandera-colombia', nombre: 'Bandera de Colombia', categoria: 'temporada', sobresale: 32, etiquetas: ['bandera', 'colombia', 'fiestas patrias'], lote: 6, coleccion: 'colombia' }),
  def({ id: 'sombrero-vueltiao', nombre: 'Sombrero vueltiao', categoria: 'temporada', bloquea: 'nada', apoyado: true, etiquetas: ['sombrero', 'colombia'], lote: 6, coleccion: 'colombia' }),
  def({ id: 'mochila-wayuu', nombre: 'Mochila wayuu', categoria: 'temporada', bloquea: 'nada', apoyado: true, etiquetas: ['mochila', 'wayuu', 'colombia'], lote: 6, coleccion: 'colombia' }),
  def({ id: 'mascara-carnaval', nombre: 'Máscara de carnaval', categoria: 'temporada', montado: true, bloquea: 'nada', orientaciones: MURO, etiquetas: ['máscara', 'carnaval', 'colombia', 'pared'], lote: 6, coleccion: 'colombia' }),
  def({ id: 'huevos-pascua', nombre: 'Huevos de Pascua', categoria: 'temporada', bloquea: 'nada', apoyado: true, etiquetas: ['huevos', 'pascua'], lote: 6, coleccion: 'pascua' }),
  def({ id: 'conejo-pascua', nombre: 'Conejo de Pascua', categoria: 'temporada', bloquea: 'nada', sobresale: 8, etiquetas: ['conejo', 'pascua'], lote: 6, coleccion: 'pascua' }),
  def({ id: 'torta-cumpleanos', nombre: 'Torta de cumpleaños', categoria: 'temporada', bloquea: 'nada', apoyado: true, emisor: luz('#FFCF70', 1.4, 0.5, 'siempre', true), etiquetas: ['torta', 'cumpleaños'], lote: 6, coleccion: 'cumpleanos' }),
  def({ id: 'sombreros-fiesta', nombre: 'Sombreros de fiesta', categoria: 'temporada', bloquea: 'nada', apoyado: true, etiquetas: ['sombreros', 'fiesta'], lote: 6, coleccion: 'cumpleanos' }),


  // Lote 7: puestos de trabajo (varios monitores, torres, teclados, mochilas).
  def({ id: 'escritorio-largo', nombre: 'Escritorio largo', categoria: 'puestos', ancho: 4, orientaciones: ['S'], variantes: ['base', 'madera', 'negro'], etiquetas: ['escritorio', 'largo', 'equipo', 'puesto'], lote: 7, obsoleto: true, reemplazadoPor: 'escritorio-3x1' }),

  def({ id: 'pino', nombre: 'Pino', categoria: 'exterior', ancho: 2, alto: 2, sobresale: 64, bloquea: [[0, 1], [1, 1]], etiquetas: ['árbol', 'pino', 'exterior'], lote: 3 }),
  def({ id: 'abedul', nombre: 'Abedul', categoria: 'exterior', ancho: 2, alto: 2, sobresale: 64, bloquea: [[0, 1], [1, 1]], etiquetas: ['árbol', 'abedul', 'exterior'], lote: 3 }),
];

/** Todos los objetos: los lotes 1 a 7 y, al final, los lotes extra (`inventario-lotes/`). */
export const INVENTARIO: readonly ObjetoCatalogo[] = [...INVENTARIO_BASE, ...LOTES_EXTRA.flat()].map((o) => (SENTADO_AJUSTES[o.id] ? { ...o, sentado: SENTADO_AJUSTES[o.id] } : o));

/** Los lotes extra por separado (para las pruebas). */
export const LOTES_EXTRA_PARA_PRUEBAS: readonly (readonly ObjetoCatalogo[])[] = LOTES_EXTRA;

export const INVENTARIO_POR_ID: ReadonlyMap<string, ObjetoCatalogo> = new Map(INVENTARIO.map((o) => [o.id, o]));

export function objetoPorId(id: string): ObjetoCatalogo | undefined {
  return INVENTARIO_POR_ID.get(id);
}

/** Dirección hacia la que mira quien se sienta o usa el objeto: la de su orientación. */
export function miraDe(orientacion: string): Direccion {
  return orientacion === 'N' || orientacion === 'E' || orientacion === 'O' ? orientacion : 'S';
}
