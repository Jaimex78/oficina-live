import { useEffect, useMemo, useRef } from 'react';
import { objetoPorId, plantillaDeMapa, type IdPlantillaMapa, type SalaMapa, type TipoZona } from '@ol/shared';

/** Color de cada piso en la miniatura (el del suelo visto desde arriba, apagado). */
const COLOR_PISO: Record<string, string> = {
  'piso-madera-clara': '#d9b98a',
  'piso-madera-oscura': '#7b4b3a',
  'piso-baldosa': '#bcd3cd',
  'piso-cemento': '#aaa49d',
  'piso-alfombra-gris': '#8c93a3',
  'piso-alfombra-roja': '#a8434f',
  'piso-alfombra-lavanda': '#7f86c2',
  'piso-cesped': '#69a966',
  'piso-deck': '#c9a770',
  'piso-parquet': '#bd8f58',
  'piso-cocina': '#dfe6e8',
  'piso-ladrillo-crema': '#d9cdb1',
  'piso-baldosa-ajedrez': '#c8c8d0',
  'piso-losa-rombos': '#b3aea6',
};
const COLOR_ZONA: Record<TipoZona, string> = {
  abierta: '#ffffff',
  silenciosa: '#78dc96',
  privada: '#be96ff',
  sala: '#78aaff',
  coworking: '#50dcc8',
};
const ESCALA = 4;

/** Dibuja la sala desde sus datos: piso, zonas, paredes, puertas y muebles como puntos. Sin imágenes: sirve para cualquier mapa. */
export function dibujarMiniatura(g: CanvasRenderingContext2D, sala: SalaMapa, escala: number): void {
  g.clearRect(0, 0, sala.ancho * escala, sala.alto * escala);
  for (let y = 0; y < sala.alto; y++) {
    const fila = sala.piso[y];
    if (!fila) continue;
    for (let x = 0; x < sala.ancho; x++) {
      const p = fila[x];
      if (!p) continue;
      g.fillStyle = COLOR_PISO[p] ?? '#c4c4cc';
      g.fillRect(x * escala, y * escala, escala, escala);
    }
  }
  for (const z of sala.zonas) {
    if (z.tipo === 'abierta') continue;
    g.globalAlpha = 0.28;
    g.fillStyle = COLOR_ZONA[z.tipo] ?? '#ffffff';
    g.fillRect(z.rect.x * escala, z.rect.y * escala, z.rect.w * escala, z.rect.h * escala);
    g.globalAlpha = 1;
  }
  for (const c of sala.colocaciones) {
    const o = objetoPorId(c.objeto);
    if (!o || o.montado || o.apoyado || o.capa !== 'objeto') continue;
    if (o.pared) {
      g.fillStyle = o.interaccion === 'puerta' ? '#8a5a2b' : o.id === 'vidrio' || o.ventana ? '#9fd4ee' : '#4b4f7a';
      g.fillRect(c.x * escala, c.y * escala, escala, escala);
    } else if (o.id !== 'cerca' && o.bloquea.length > 0) {
      g.fillStyle = o.interaccion === 'sentarse' ? 'rgba(20,24,40,0.45)' : 'rgba(20,24,40,0.75)';
      g.fillRect(c.x * escala + 0.5, c.y * escala + 0.5, Math.max(1, o.ancho * escala - 1), Math.max(1, o.alto * escala - 1));
    } else if (o.id === 'cerca') {
      g.fillStyle = '#7a6a4a';
      g.fillRect(c.x * escala, c.y * escala, escala, escala);
    }
  }
  g.fillStyle = '#34c759';
  for (const l of sala.llegadas) g.fillRect(l.x * escala + 1, l.y * escala + 1, escala - 2, escala - 2);
}

/** Miniatura del mapa de una plantilla, dibujada desde sus datos (nunca una imagen aparte). */
export function MiniaturaPlantilla({ id }: { id: IdPlantillaMapa }) {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const sala = useMemo(() => plantillaDeMapa(id).salas[0] as SalaMapa, [id]);
  useEffect(() => {
    const c = lienzo.current;
    if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = sala.ancho * ESCALA * dpr;
    c.height = sala.alto * ESCALA * dpr;
    const g = c.getContext('2d') as CanvasRenderingContext2D;
    g.scale(dpr, dpr);
    dibujarMiniatura(g, sala, ESCALA);
  }, [sala]);
  return <canvas ref={lienzo} className="ed-plantilla__mapa" style={{ aspectRatio: `${sala.ancho} / ${sala.alto}` }} role="img" aria-label="Vista general del mapa de la plantilla" />;
}
