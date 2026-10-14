import type { MapaOficina } from '../mapa';
import { ConstructorSala } from '../oficina';
import { banoHombres, banoMujeres } from './banos';
import { colgar, mesaConSillas, mesaConSillasSinAbajo, puestoDeTrabajo, sobreMesa, type Colgado, type Sobre } from './comun';
import { cascaron } from './edificio';

/**
 * Oficina de ejemplo en el piso 4 de Naos Empresarial, Bogotá: la planta completa, armada con las reglas del realismo (`arte/GUIA-ARMADO-REALISTA.md`) y
 * construida con `.estricto()`: lo apoyado va sobre mesas donde cabe, las sillas van pegadas y simétricas (`sillasAlrededor`), los
 * escritorios llevan su silla al centro, los muebles van contra las paredes, los cuadros y relojes sobre ellas y los baños tienen
 * cubículos con puerta. Distribución: dos oficinas grandes (dirección A y dirección B), una mini oficina por persona del equipo
 * Digital, cafetería, baños, zona de Play 5, recibidor con su sala de espera y la terraza del balcón.
 *
 * Como en Gather, la cámara mira desde el sur: de cada pared se ve la cara que da al sur, así que lo colgado va sobre los muros
 * del norte de cada espacio. Las mini oficinas de la fila de arriba van abiertas hacia el pasillo y las de abajo entran por una
 * puerta en su muro norte. Los pasillos miden 3 casillas (el central) o 3 (el de Digital) y las puertas tienen espacio delante.
 */

const MINI_X = [17, 22, 27, 32] as const; // cada mini oficina mide 4 de ancho
const FILA_A_Y = 14; // mini oficinas de arriba: y 14..17, abiertas al pasillo de Digital
const FILA_B_Y = 22; // mini oficinas de abajo: y 22..25, con puerta en el muro de y = 21

function pisoDe(x: number, y: number): string {
  if (x >= 25 && y <= 12) return 'piso-cocina'; // baños
  if (x >= 16 && y <= 12) return 'piso-baldosa'; // cafetería
  if (x <= 8 && y <= 9) return 'piso-madera-oscura'; // zona de Play 5
  if (x <= 12 && y >= 13) return 'piso-parquet'; // oficinas de dirección
  if (x >= 16 && y >= 13) return y === 19 || y === 20 ? 'piso-madera-clara' : 'piso-alfombra-gris'; // Digital: pasillo y mini oficinas
  return 'piso-madera-clara'; // recibidor, pasillo central
}

/** Quién ocupa cada mini oficina, en orden: la fila de arriba y luego la de abajo. Todo de ejemplo y distinto en cada una. */
interface PersonaDigital {
  etiqueta: string | null;
  escritorio: string;
  silla: string;
  sobre: Sobre[];
  /** Mueble de guardar junto a la silla y lo que lleva encima. */
  mueble: [string, ...[string, string?][]];
  planta: string;
  lampara: string;
  visita: [string, string?];
}

const PERSONAS_DIGITAL: PersonaDigital[] = [
  { etiqueta: 'Ana Ruiz · Data Entry', escritorio: 'escritorio-simple', silla: 'silla-malla-ergonomica', sobre: [['computador-moderno', 0], ['taza-regular', 2, 0, 'azul']], mueble: ['cajonera'], planta: 'monstera', lampara: 'lampara-arco', visita: ['puf-saco', 'azul'] },
  { etiqueta: 'Luis Gómez · Data Analyst', escritorio: 'escritorio-zen', silla: 'silla-giratoria-madera', sobre: [['pc-doble', 0], ['cuaderno-abierto', 2]], mueble: ['archivador-metalico'], planta: 'ficus-lira', lampara: 'lampara-flecos', visita: ['puff', 'azul'] },
  { etiqueta: 'Marta Díaz · Data Entry', escritorio: 'escritorio-industrial', silla: 'sillon-gamer', sobre: [['pc-gamer', 0], ['audifonos-escritorio', 2]], mueble: ['cajonera'], planta: 'planta-serpiente', lampara: 'lampara-pie', visita: ['puf-saco', 'rojo'] },
  { etiqueta: 'Camila Torres · Backend', escritorio: 'escritorio-bauhaus', silla: 'silla-modernista', sobre: [['pc-desarrollador', 0], ['taza-regular', 2, 0, 'verde']], mueble: ['locker'], planta: 'hosta-grande', lampara: 'lampara-arco', visita: ['butaca-nube'] },
  { etiqueta: 'Pablo Rojas · QA', escritorio: 'escritorio-ejecutivo-moderno', silla: 'silla-oficina-delgada', sobre: [['computador-escritorio', 0], ['taza-ancha', 2, 0, 'rojo']], mueble: ['comoda-alta', ['terrario']], planta: 'palma-maceta', lampara: 'lampara-flecos', visita: ['puf-saco', 'verde'] },
  { etiqueta: 'Sara León · QA', escritorio: 'escritorio-ovalado', silla: 'silla-roble-curvo', sobre: [['monitor', 0], ['taza-te', 1], ['cuaderno-cerrado', 2]], mueble: ['fichero-tarjetas'], planta: 'filodendro', lampara: 'lampara-arco', visita: ['puff', 'rojo'] },
  { etiqueta: 'Diego Vargas · Frontend', escritorio: 'escritorio-patas-nelson', silla: 'silla-giratoria-industrial', sobre: [['pc-desarrollador', 0], ['vaso-termico', 2]], mueble: ['cajonera'], planta: 'planta-grande', lampara: 'lampara-pie', visita: ['butaca-knoll', 'azul'] },
  { etiqueta: null, escritorio: 'escritorio-oficina', silla: 'silla-oficina', sobre: [['portatil', 0], ['pato-de-goma', 1], ['libro-cerrado', 2]], mueble: ['archivador'], planta: 'helecho-maceta', lampara: 'lampara-flecos', visita: ['puff', 'azul'] },
];

const FACHADA: Colgado[] = [
  ['ventana-moderna', 2], ['arte-urbano', 3], ['ventana-moderna', 6], ['reloj-minimalista', 7], // Play 5 (el TV va en el 4 y el 5, el cartel en el 8)
  ['cuadro-cubista', 9], ['ventana-guillotina', 10], ['cuadro-mondrian', 11], ['ventana-guillotina', 12], // sala de espera
  ['extintor', 16], ['ventana-batiente', 17], ['reloj-estandar', 18], ['ventana-batiente', 19], ['cuadro-cubista', 20], ['poster-motivacional', 22], ['ventana-batiente', 23], ['cuadro-chico', 24], // cafetería
];

export function plantillaNaos(): MapaOficina {
  const b = new ConstructorSala('piso-4', 'Piso 4', 46, 30).estricto();
  cascaron(b, pisoDe);

  // ---------- muros interiores ----------
  // Dos oficinas grandes a la izquierda (la A arriba, la B abajo), con pared de vidrio al pasillo y una puerta cada una.
  b.muro(2, 13, 12, 13, 'pared-lisa').muro(2, 19, 11, 19, 'pared-lisa').muro(12, 13, 12, 25, 'vidrio');
  b.poner('puerta-simple', 12, 16, 'E').poner('puerta-simple', 12, 22, 'E');
  // Equipo Digital: muro norte, pasillo propio en y 18..20 y una mini oficina por persona.
  b.muro(16, 13, 35, 13, 'pared-lisa');
  b.muro(16, 14, 16, 18, 'vidrio').muro(16, 21, 16, 25, 'vidrio');
  for (const x of [21, 26, 31]) b.muro(x, 14, x, 18, 'pared-lisa').muro(x, 22, x, 25, 'pared-lisa');
  b.muro(16, 21, 35, 21, 'pared-lisa');
  for (const x of MINI_X) b.poner('puerta-simple', x + 3, 21, 'S');
  b.poner('puerta-simple', 36, 20, 'E'); // del pasillo de Digital a la terraza
  // Baños (arriba a la derecha): el de hombres arriba y el de mujeres abajo, con puerta desde la cafetería.
  b.muro(25, 4, 25, 12, 'pared-lisa').muro(26, 8, 35, 8, 'pared-lisa');
  b.poner('puerta-simple', 25, 7, 'E').poner('puerta-simple', 25, 12, 'E');

  // ---------- fachada de arriba: ventanas, relojes y cuadros. Solo se ve la cara que da al sur ----------
  colgar(b, 3, FACHADA);
  b.poner('cartel-zona', 8, 3, 'S', 'base', { titulo: 'Zona de Play 5', texto: 'Para descansar con una partida.' });
  b.poner('cartel-zona', 21, 3, 'S', 'base', { titulo: 'Cafetería', texto: 'Café, almuerzo y mesas para conversar.' });
  b.poner('cartel-zona', 28, 3, 'S', 'base', { titulo: 'Baños', texto: 'Hombres arriba, mujeres abajo.' });
  b.poner('letrero-oficina-live', 13, 3, 'S');

  // ---------- zona de Play 5 (arriba a la izquierda) ----------
  // La TV cuelga del muro, con el aparador debajo y la consola encima; el sofá la mira desde el otro lado de la alfombra.
  b.poner('tv-pared', 4, 3, 'S');
  b.poner('comoda', 4, 4, 'S', 'negro');
  sobreMesa(b, 4, 4, [['ps5', 0], ['control-videojuegos', 1]]);
  b.poner('alfombra-grande', 3, 5, 'U', 'negro');
  b.poner('mesa-centro', 4, 6, 'S', 'negro');
  sobreMesa(b, 4, 6, [['taza-ancha', 0, 0, 'rojo'], ['taza-regular', 1]]);
  b.poner('sofa-cuero-moderno', 3, 7, 'N', 'negro').poner('sillon-gamer', 6, 7, 'N', 'rojo');
  b.poner('puf-saco', 6, 5, 'U', 'rojo').poner('puf-saco', 7, 6, 'U', 'azul');
  b.poner('maquina-arcade', 7, 4, 'S');
  b.poner('hosta-grande', 2, 4).poner('monstera', 2, 9).poner('lampara-arco', 8, 9);

  // ---------- recibidor: donde llegas ----------
  // Recepción contra el muro de las oficinas, con su silla detrás, el tótem de bienvenida y el perchero.
  b.poner('recepcion', 3, 11, 'S');
  b.poner('taburete', 4, 10);
  b.poner('totem-bienvenida', 7, 11, 'U', 'base', { titulo: 'Bienvenida', texto: 'Bienvenido a Oficina Live.' });
  b.poner('perchero', 2, 11).poner('palma-maceta', 2, 12);
  b.poner('butaca-knoll', 11, 11, 'O', 'negro').poner('mesa-lateral-moderna', 12, 11);
  sobreMesa(b, 12, 11, [['taza-te', 0]]);
  b.poner('palma-maceta', 12, 12);
  b.llegadas({ x: 8, y: 10 }, { x: 9, y: 10 }, { x: 10, y: 10 }, { x: 8, y: 11 }, { x: 9, y: 11 }, { x: 10, y: 11 });
  // Sala de espera: sofá, mesa de centro y dos butacas sobre una alfombra.
  b.poner('alfombra-grande', 9, 6, 'U', 'azul');
  b.poner('sofa-lecorbusier', 9, 5, 'S', 'negro');
  b.poner('mesa-centro-tronco', 10, 6, 'S');
  sobreMesa(b, 10, 6, [['bonsai', 0], ['libro-abierto', 1]]);
  b.poner('butaca-lecorbusier', 9, 7, 'N', 'azul').poner('butaca-lecorbusier', 11, 7, 'N', 'azul');
  b.poner('ficus', 12, 5).poner('lampara-pie', 12, 7);

  // ---------- cafetería: mesón arriba, dos mesas redondas y una mesa larga ----------
  b.poner('barra', 16, 4, 'S');
  sobreMesa(b, 16, 4, [['cafetera-filtro', 0], ['tostadora', 1], ['frutero', 2]]);
  b.poner('maquina-cafe', 19, 4).poner('nevera', 20, 4).poner('dispensador-agua', 21, 4);
  b.poner('barra', 22, 4, 'S');
  sobreMesa(b, 22, 4, [['maquina-espresso', 0], ['taza-regular', 1], ['taza-ancha', 2, 0, 'verde']]);
  mesaConSillas(b, { mesa: 'mesa-redonda', x: 17, y: 6, silla: 'silla-cafe', colorSilla: 'rojo', sobre: [['taza-regular', 0], ['dona', 1, 1]] });
  mesaConSillas(b, { mesa: 'mesa-redonda', x: 22, y: 6, variante: 'blanco', silla: 'silla-cafe', colorSilla: 'blanco', sobre: [['taza-te', 0], ['pandebono', 1, 1]] });
  // Mesa larga: sillas por el lado de arriba y en las dos puntas. El lado de abajo queda contra el muro, sin sillas.
  b.poner('mesa-reunion-8', 18, 10, 'S');
  sobreMesa(b, 18, 10, [['tabla-quesos', 0], ['botella-agua', 1], ['bowl-comida', 2, 1], ['pizza', 3]]);
  for (let x = 18; x <= 21; x++) b.poner('silla-cafe', x, 9, 'S', x % 2 === 0 ? 'negro' : 'base');
  b.poner('silla-cafe', 17, 10, 'E', 'negro').poner('silla-cafe', 17, 11, 'E', 'negro').poner('silla-cafe', 22, 10, 'O', 'negro').poner('silla-cafe', 22, 11, 'O', 'negro');
  b.poner('palma-maceta', 16, 11).poner('planta-grande', 24, 5);

  // ---------- baños con cubículos ----------
  banoHombres(b, 26, 4);
  banoMujeres(b, 26, 9);

  // ---------- pasillo central ----------
  b.poner('monstera', 13, 4).poner('palma-maceta', 13, 25);

  // ---------- oficinas de dirección: las dos grandes ----------
  // Cada una con su escritorio contra el muro norte, libreros a los lados, una mesa de reuniones con sillas, un rincón de sofá sobre
  // una alfombra, ventanas, cuadros y una TV en la pared. La última fila de cada oficina queda detrás del muro de abajo (el muro tapa
  // la casilla de su norte), así que ahí no va nada que importe.
  puestoDeTrabajo(b, { x: 4, y: 14, mueble: 'escritorio-ejecutivo-moderno', silla: 'silla-ejecutiva', sobre: [['pc-doble', 0], ['taza-regular', 2, 0, 'negro']], etiqueta: 'Dirección A' });
  b.poner('librero-alto', 2, 14, 'S').poner('planta-grande', 7, 14).poner('librero-chippendale', 10, 14, 'S');
  b.poner('comoda', 8, 14, 'S');
  sobreMesa(b, 8, 14, [['jarron-rosas', 0], ['bonsai', 1]]);
  colgar(b, 13, [['cuadro-mondrian', 4], ['ventana-moderna', 5], ['reloj-minimalista', 6], ['tv-pared', 8]]);
  b.poner('cartel-zona', 7, 13, 'S', 'base', { titulo: 'Oficina de dirección A', texto: 'Despacho de dirección.' });
  mesaConSillasSinAbajo(b, 7, 16, 'silla-simple', undefined, [['taza-regular', 0], ['jarron-rosas', 1, 1], ['cuaderno-abierto', 2]]);
  b.poner('alfombra-grande', 2, 16, 'U', 'verde');
  b.poner('mesa-centro', 2, 16, 'S');
  sobreMesa(b, 2, 16, [['taza-te', 1]]);
  b.poner('sofa-art-deco', 2, 17, 'N', 'azul').poner('butaca-knoll', 4, 16, 'O', 'negro').poner('lampara-pie', 5, 17);
  b.poner('planta-grande', 11, 17);

  puestoDeTrabajo(b, { x: 4, y: 20, mueble: 'escritorio-ejecutivo-antiguo', silla: 'silla-giratoria-madera', sobre: [['pc-diseno-grafico', 0], ['taza-alta', 2, 0, 'rojo']], etiqueta: 'Dirección B' });
  b.poner('librero-mediano', 2, 20, 'S').poner('comoda', 7, 20, 'S').poner('gabinete-curiosidades', 9, 20, 'S').poner('planta-grande', 11, 20);
  sobreMesa(b, 7, 20, [['globo-terraqueo', 0], ['jarron-lirios', 1]]);
  b.poner('cartel-zona', 3, 19, 'S', 'base', { titulo: 'Oficina de dirección B', texto: 'Despacho de dirección.' });
  colgar(b, 19, [['ventana-guillotina', 4], ['reloj-pendulo', 5], ['cuadro-abstracto-circulos', 6], ['tv-pared', 8], ['ventana-cortinas', 10]]);
  mesaConSillas(b, { mesa: 'mesa-conferencia-3x2', x: 7, y: 22, orientacion: 'S', variante: 'madera', silla: 'silla-simple', colorSilla: 'madera', sobre: [['tabla-quesos', 0], ['taza-regular', 2, 1, 'verde'], ['jarron-rosas', 1]] });
  b.poner('alfombra-grande', 2, 23, 'U', 'rojo');
  b.poner('mesa-centro', 2, 23, 'S');
  sobreMesa(b, 2, 23, [['taza-ancha', 0, 0, 'azul']]);
  b.poner('sofa-knoll', 2, 24, 'N', 'verde').poner('butaca-nube', 4, 23, 'O').poner('lampara-pie', 5, 24);
  b.poner('planta-grande', 11, 24);

  // ---------- equipo Digital: una mini oficina por persona, en dos filas de cuatro ----------
  // Cada mini oficina mide 4x4. El escritorio va contra el muro de su fondo, la silla al sur de su escritorio (la persona se sienta
  // de espaldas a la cámara, mirando su pantalla) y queda un rincón libre para que cada quien arme su espacio.
  PERSONAS_DIGITAL.forEach((p, i) => {
    const x0 = MINI_X[i % 4] as number;
    const arriba = i < 4;
    const yDesk = arriba ? FILA_A_Y : FILA_B_Y;
    puestoDeTrabajo(b, { x: x0, y: yDesk, mueble: p.escritorio, silla: p.silla, sobre: p.sobre, ...(p.etiqueta ? { etiqueta: p.etiqueta } : {}) });
    // La mini oficina entera es el área de la persona: ahí puede poner o quitar lo que quiera. Los dueños los asigna la administración.
    const nombre = p.etiqueta ? p.etiqueta.split(' · ')[0] : null;
    b.area(nombre ? `Oficina de ${nombre}` : 'Oficina libre', x0, yDesk, 4, 4);
    // Mueble de guardar junto a la silla, planta, lámpara de pie y un asiento para una visita. La columna de la puerta (x0 + 3) queda libre en la fila de abajo.
    const [mueble, ...encima] = p.mueble;
    b.poner(mueble, x0, yDesk + 1);
    for (const [id, color] of encima) b.poner(id, x0, yDesk + 1, undefined, color);
    const [visita, colorVisita] = p.visita;
    // Fila de arriba: planta junto al escritorio, visita y lámpara en la columna libre. Fila de abajo: todo una fila más arriba, porque el
    // muro sur tapa la última fila (la columna de la puerta, x0 + 3, queda libre hasta la lámpara).
    const xVisita = arriba ? x0 + 3 : x0 + 2;
    const yVisita = yDesk + 2;
    b.poner(p.planta, arriba ? x0 + 3 : x0, arriba ? yDesk : yDesk + 2).poner(p.lampara, x0 + 3, arriba ? yDesk + 3 : yDesk + 2).poner(visita, xVisita, yVisita, visita.startsWith('butaca') ? 'O' : undefined, colorVisita);
  });
  b.poner('planta-grande', 35, 19);
  // Cuadros, relojes y el tablero del equipo sobre el muro de cada mini oficina.
  colgar(b, 13, [['cuadro-grande', 17], ['reloj-minimalista', 19], ['paisaje-rio', 22], ['reloj-estandar', 24], ['cuadro-chico', 27], ['cuadro-abstracto-rectangulos', 32]]);
  b.poner('muro-kanban', 28, 13, 'S', 'base', { enlace: 'https://planner.cloud.microsoft', titulo: 'Tablero del equipo' });
  colgar(b, 21, [['mapa-mundi', 17], ['reloj-pared', 19], ['foto-ciudad', 22], ['espejo', 24], ['cuadro-barco', 27], ['cuadro-cubista', 29], ['naturaleza-muerta', 32], ['reloj-pendulo', 34]]);

  // ---------- terraza de la esquina (sureste) ----------
  b.poner('planta-grande', 38, 21).poner('planta-grande', 41, 21);
  mesaConSillas(b, { mesa: 'mesa-terraza', x: 39, y: 23, silla: 'silla-comedor', lados: 'uno' });
  b.poner('banca-exterior', 37, 27, 'S').poner('jardinera', 39, 26, 'S').poner('planta-mediana', 41, 25);

  // ---------- zonas ----------
  b.zona('Zona de Play 5', 'abierta', 2, 4, 7, 6);
  b.zona('Recibidor', 'abierta', 2, 10, 14, 3);
  b.zona('Cafetería', 'abierta', 16, 4, 9, 9);
  b.zona('Baño de hombres', 'privada', 26, 4, 10, 4);
  b.zona('Baño de mujeres', 'privada', 26, 9, 10, 4);
  b.zona('Oficina de dirección A', 'privada', 2, 14, 10, 5);
  b.zona('Oficina de dirección B', 'privada', 2, 20, 10, 6);
  b.zona('Equipo Digital', 'abierta', 16, 14, 20, 12);
  b.zona('Terraza', 'abierta', 37, 20, 5, 8);
  // Salas de reuniones: dentro de ellas el resto del mundo se atenúa y arriba aparece la barra «Unirse en Teams». Son más pequeñas
  // que la zona que las contiene, así que mandan sobre ella. Sin enlace de Teams, la barra abre una llamada con quienes están dentro.
  b.zona('Sala de dirección A', 'sala', 6, 15, 5, 3);
  b.zona('Sala de dirección B', 'sala', 6, 21, 5, 4);
  b.zona('Sala de la cafetería', 'sala', 17, 10, 6, 3);
  b.zona('Mesa 1 de la cafetería', 'sala', 16, 5, 4, 4);
  b.zona('Mesa 2 de la cafetería', 'sala', 20, 5, 4, 4);
  // Coworking: al sentarte en el sofá o en una butaca se abre el panel para iniciar una sesión de enfoque.
  b.zona('Sofás del recibidor', 'coworking', 9, 5, 4, 3);

  return { version: 1, nombre: 'Oficina Live', salaInicial: 'piso-4', salas: [b.construir()] };
}
