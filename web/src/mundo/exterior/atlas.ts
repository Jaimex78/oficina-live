/**
 * Carga del atlas del exterior que publica el pipeline de arte: `web/public/assets/exterior/exterior-v1.png` y su JSON.
 * Se baja una sola vez por página (y se reutiliza si la escena se reinicia).
 */

export interface MarcoExterior {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface AtlasExterior {
  imagen: HTMLImageElement;
  huella: string;
  frames: Record<string, MarcoExterior>;
  /** Ids de los tiles de 32 x 32, en el orden en que se arma el mapa de baldosas. */
  tiles: string[];
  /** Punto de apoyo de cada sprite suelto, en píxeles del cuadro. */
  anclas: Record<string, { x: number; y: number }>;
}

interface JsonExterior {
  archivo: string;
  huella: string;
  frames: Record<string, MarcoExterior>;
  tiles: { lado: number; nombres: string[] };
  anclas: Record<string, { x: number; y: number }>;
}

function cargarImagen(url: string): Promise<HTMLImageElement> {
  return new Promise((resolver, rechazar) => {
    const img = new Image();
    img.onload = () => resolver(img);
    img.onerror = () => rechazar(new Error(`No se pudo cargar ${url}`));
    img.src = url;
  });
}

let enCurso: Promise<AtlasExterior> | null = null;

export function cargarAtlasExterior(): Promise<AtlasExterior> {
  if (!enCurso) {
    enCurso = (async () => {
      const r = await fetch('/assets/exterior/exterior-v1.json', { cache: 'no-cache' });
      if (!r.ok) throw new Error(`No se pudo leer el atlas del exterior (${r.status})`);
      const json = (await r.json()) as JsonExterior;
      const imagen = await cargarImagen(`/assets/exterior/${json.archivo}?v=${json.huella}`);
      return { imagen, huella: json.huella, frames: json.frames, tiles: json.tiles.nombres, anclas: json.anclas };
    })();
    // Si falla, la próxima vez vuelve a intentarlo.
    enCurso.catch(() => {
      enCurso = null;
    });
  }
  return enCurso;
}
