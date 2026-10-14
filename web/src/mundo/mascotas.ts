import { DIRECCIONES_PERSONAJE, MASCOTA_ALTO, MASCOTA_ANCHO, claveMascota, mascotaPorId, varianteDe, type CatalogoMascotas, type Direccion, type MascotaCatalogo, type MascotaSpec } from '@ol/shared';

/**
 * Hojas de animación de las mascotas: 4 columnas (cuadros 0 a 3) por 4 filas (direcciones S, O, E, N), cada celda de 32 x 32.
 * Se arma una hoja por mascota y color (en caché) recoloreando los marcadores `accA` y `accB` del atlas `mascotas-v1`.
 */

export const COLUMNAS_MASCOTA = 4;

export const celdaMascota = (dir: Direccion, cuadro: number): { x: number; y: number } => ({
  x: cuadro * MASCOTA_ANCHO,
  y: Math.max(0, DIRECCIONES_PERSONAJE.indexOf(dir)) * MASCOTA_ALTO,
});

export class FuenteMascotas {
  private readonly marcadores = new Map<string, { slot: string; tono: number }>();
  private readonly hojas = new Map<string, HTMLCanvasElement>();
  private readonly celdas = new Map<string, HTMLCanvasElement>();

  constructor(
    readonly catalogo: CatalogoMascotas,
    private readonly imagen: CanvasImageSource,
  ) {
    for (const [slot, tonos] of Object.entries(catalogo.marcadores)) tonos.forEach((hex, tono) => this.marcadores.set(hex.toUpperCase(), { slot, tono }));
  }

  def(id: string): MascotaCatalogo | undefined {
    return mascotaPorId(this.catalogo, id);
  }

  /** La hoja de una mascota con su color, o `null` si ya no existe en el catálogo. */
  hoja(m: MascotaSpec): HTMLCanvasElement | null {
    const llave = claveMascota(m);
    const hecha = this.hojas.get(llave);
    if (hecha) return hecha;
    const def = this.def(m.id);
    if (!def) return null;
    const variante = varianteDe(def, m.color);
    const c = document.createElement('canvas');
    c.width = COLUMNAS_MASCOTA * MASCOTA_ANCHO;
    c.height = DIRECCIONES_PERSONAJE.length * MASCOTA_ALTO;
    const g = c.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
    g.imageSmoothingEnabled = false;
    for (const dir of DIRECCIONES_PERSONAJE) {
      for (let cuadro = 0; cuadro < COLUMNAS_MASCOTA; cuadro++) {
        const marco = this.catalogo.frames[def.frames[dir]?.[cuadro] ?? ''];
        if (!marco) continue;
        const { x, y } = celdaMascota(dir, cuadro);
        g.drawImage(this.imagen, marco.x, marco.y, marco.w, marco.h, x, y, marco.w, marco.h);
      }
    }
    // Un solo recoloreo para toda la hoja.
    const datos = g.getImageData(0, 0, c.width, c.height);
    const d = datos.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 0) continue;
      const hex = `#${((d[i]! << 16) | (d[i + 1]! << 8) | d[i + 2]!).toString(16).padStart(6, '0').toUpperCase()}`;
      const mk = this.marcadores.get(hex);
      if (!mk) continue;
      const destino = (variante?.rampas as Record<string, readonly string[] | undefined> | undefined)?.[mk.slot]?.[mk.tono];
      if (!destino) continue;
      const n = Number.parseInt(destino.slice(1), 16);
      d[i] = (n >> 16) & 255;
      d[i + 1] = (n >> 8) & 255;
      d[i + 2] = n & 255;
    }
    g.putImageData(datos, 0, 0);
    this.hojas.set(llave, c);
    return c;
  }

  /** Un solo cuadro (32 x 32): sirve para las miniaturas y la vista previa del creador. */
  celda(m: MascotaSpec, dir: Direccion, cuadro: 0 | 1 | 2 | 3): HTMLCanvasElement | null {
    const llave = `${claveMascota(m)}|${dir}${cuadro}`;
    const hecha = this.celdas.get(llave);
    if (hecha) return hecha;
    const hoja = this.hoja(m);
    if (!hoja) return null;
    const c = document.createElement('canvas');
    c.width = MASCOTA_ANCHO;
    c.height = MASCOTA_ALTO;
    const g = c.getContext('2d') as CanvasRenderingContext2D;
    g.imageSmoothingEnabled = false;
    const { x, y } = celdaMascota(dir, cuadro);
    g.drawImage(hoja, x, y, MASCOTA_ANCHO, MASCOTA_ALTO, 0, 0, MASCOTA_ANCHO, MASCOTA_ALTO);
    this.celdas.set(llave, c);
    return c;
  }
}
