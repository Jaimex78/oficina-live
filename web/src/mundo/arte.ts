import { CASILLA, frameDeColocacion, huellaDe, type CatalogoMascotas, type CatalogoPersonaje, type MarcoAtlas, type ObjetoCatalogo, type Orientacion } from '@ol/shared';
import type Phaser from 'phaser';
import { AvataresDeAtlas, AvataresProvisionales, type FuenteAvatares } from './avatar';
import { FuenteMascotas } from './mascotas';
import { dibujarProvisional } from './provisional';

/**
 * Biblioteca de arte del navegador. Junta los atlas pintados que publica el pipeline de arte
 * (`shared/src/catalogo/*.json` con su PNG en `web/public/assets/arte/`) y, para lo que todavía no existe,
 * dibuja cuadros provisionales con código. El mundo y el editor piden siempre por id de cuadro y no saben la diferencia.
 */

interface AtlasJson {
  version: 1;
  archivo: string;
  huella: string;
  ancho: number;
  alto: number;
  frames: Record<string, MarcoAtlas>;
}

interface Fuente {
  /** Imagen del atlas o lienzo provisional. */
  imagen: CanvasImageSource;
  atlas: string | null;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ReferenciaFrame {
  key: string;
  frame: string | number;
}

const JSON_ATLAS = import.meta.glob<AtlasJson | CatalogoPersonaje | CatalogoMascotas>('../../../shared/src/catalogo/*.json', { eager: true, import: 'default' });

function cargarImagen(url: string): Promise<HTMLImageElement> {
  return new Promise((resolver, rechazar) => {
    const img = new Image();
    img.onload = () => resolver(img);
    img.onerror = () => rechazar(new Error(`No se pudo cargar ${url}`));
    img.src = url;
  });
}

export class Arte {
  private readonly fuentes = new Map<string, Fuente>();
  private readonly registrados = new WeakMap<Phaser.Textures.TextureManager, Set<string>>();
  private readonly miniaturas = new Map<string, string>();
  /** Atlas de objetos cargados: nombre y cantidad de cuadros. */
  readonly atlas: { nombre: string; cuadros: number }[] = [];
  private personajes: { nombre: string; catalogo: CatalogoPersonaje; imagen: HTMLImageElement } | null = null;
  private mascotas: { nombre: string; catalogo: CatalogoMascotas; imagen: HTMLImageElement } | null = null;

  static async cargar(): Promise<Arte> {
    const arte = new Arte();
    const entradas = Object.entries(JSON_ATLAS).sort(([a], [b]) => a.localeCompare(b));
    const trabajos = entradas.map(async ([ruta, json]) => {
      const nombre = ruta.split('/').pop()?.replace(/\.json$/, '') ?? json.archivo;
      try {
        if (nombre.startsWith('objetos')) {
          const atlas = json as AtlasJson;
          const img = await cargarImagen(`/assets/arte/${atlas.archivo}?v=${atlas.huella}`);
          for (const [id, m] of Object.entries(atlas.frames)) arte.fuentes.set(id, { imagen: img, atlas: nombre, x: m.x, y: m.y, w: m.w, h: m.h });
          arte.atlas.push({ nombre, cuadros: Object.keys(atlas.frames).length });
        } else if (nombre.startsWith('personajes')) {
          const catalogo = json as CatalogoPersonaje;
          const imagen = await cargarImagen(`/assets/arte/${catalogo.archivo}?v=${catalogo.huella}`);
          // Un solo catálogo de personajes: si hubiera más de uno, gana el de versión más alta (personajes-v3 sobre personajes-v2).
          if (!arte.personajes || nombre.localeCompare(arte.personajes.nombre) > 0) arte.personajes = { nombre, catalogo, imagen };
        } else if (nombre.startsWith('mascotas')) {
          await arte.cargarMascotas(nombre, json as CatalogoMascotas);
        }
      } catch (e) {
        console.warn('[arte]', e);
      }
    });
    await Promise.all(trabajos);
    return arte;
  }

  /** Un solo catálogo de mascotas: si hubiera más de uno, gana el de versión más alta. */
  private async cargarMascotas(nombre: string, catalogo: CatalogoMascotas): Promise<void> {
    const imagen = await cargarImagen(`/assets/arte/${catalogo.archivo}?v=${catalogo.huella}`);
    if (!this.mascotas || nombre.localeCompare(this.mascotas.nombre) > 0) this.mascotas = { nombre, catalogo, imagen };
  }

  /** Solo el catálogo de personajes y el de mascotas (para el creador): evita bajar todos los atlas de objetos. */
  static async cargarPersonajes(): Promise<Arte> {
    const arte = new Arte();
    const entradas = Object.entries(JSON_ATLAS).filter(([ruta]) => /personajes|mascotas/.test(ruta));
    await Promise.all(
      entradas.map(async ([ruta, json]) => {
        const nombre = ruta.split('/').pop()?.replace(/\.json$/, '') ?? '';
        try {
          if (nombre.startsWith('mascotas')) {
            await arte.cargarMascotas(nombre, json as CatalogoMascotas);
            return;
          }
          const catalogo = json as CatalogoPersonaje;
          const imagen = await cargarImagen(`/assets/arte/${catalogo.archivo}?v=${catalogo.huella}`);
          if (!arte.personajes || nombre.localeCompare(arte.personajes.nombre) > 0) arte.personajes = { nombre, catalogo, imagen };
        } catch (e) {
          console.warn('[arte]', e);
        }
      }),
    );
    return arte;
  }

  /** Fuente de las hojas de personajes: el atlas pintado si ya existe; si no, el personaje provisional. */
  fuenteAvatares(): FuenteAvatares {
    return this.personajes ? new AvataresDeAtlas(this.personajes.catalogo, this.personajes.imagen) : new AvataresProvisionales();
  }

  /** Fuente de las hojas de mascotas (`null` si el atlas no está publicado). */
  fuenteMascotas(): FuenteMascotas | null {
    return this.mascotas ? new FuenteMascotas(this.mascotas.catalogo, this.mascotas.imagen) : null;
  }

  /** Cuántos cuadros vienen de arte pintado (los demás son provisionales). */
  get pintados(): number {
    let n = 0;
    for (const f of this.fuentes.values()) if (f.atlas) n++;
    return n;
  }

  /** Id del cuadro que corresponde a un objeto, orientación, color y máscara (paredes). Lo dibuja provisional si no existe. */
  asegurar(o: ObjetoCatalogo, orientacion: Orientacion, variante: string, mascara?: string): string {
    const id = frameDeColocacion(o, orientacion, variante, mascara);
    if (!this.fuentes.has(id)) {
      const c = dibujarProvisional(o, orientacion, variante, mascara);
      this.fuentes.set(id, { imagen: c, atlas: null, x: 0, y: 0, w: c.width, h: c.height });
    }
    return id;
  }

  tamano(id: string): { w: number; h: number } | null {
    const f = this.fuentes.get(id);
    return f ? { w: f.w, h: f.h } : null;
  }

  /** Deja el cuadro disponible en Phaser y devuelve cómo pedirlo. */
  referencia(textures: Phaser.Textures.TextureManager, id: string): ReferenciaFrame | null {
    const f = this.fuentes.get(id);
    if (!f) return null;
    let hechos = this.registrados.get(textures);
    if (!hechos) {
      hechos = new Set();
      this.registrados.set(textures, hechos);
    }
    if (f.atlas) {
      const key = `atlas:${f.atlas}`;
      if (!textures.exists(key)) textures.addImage(key, f.imagen as HTMLImageElement);
      if (!hechos.has(id)) {
        textures.get(key).add(id, 0, f.x, f.y, f.w, f.h);
        hechos.add(id);
      }
      return { key, frame: id };
    }
    const key = `prov:${id}`;
    if (!hechos.has(id)) {
      if (textures.exists(key)) textures.remove(key);
      textures.addCanvas(key, f.imagen as HTMLCanvasElement);
      hechos.add(id);
    }
    return { key, frame: '__BASE' };
  }

  /** Dibuja un cuadro en un lienzo 2D (miniaturas del inventario, vistas previas). */
  dibujarEn(g: CanvasRenderingContext2D, id: string, dx: number, dy: number, escala = 1): void {
    const f = this.fuentes.get(id);
    if (!f) return;
    g.imageSmoothingEnabled = false;
    g.drawImage(f.imagen, f.x, f.y, f.w, f.h, dx, dy, f.w * escala, f.h * escala);
  }

  /** Miniatura en data URL, centrada y escalada con números enteros para no deformar los píxeles. */
  miniatura(o: ObjetoCatalogo, variante = 'base', orientacion?: Orientacion, lado = 48): string {
    const ori = orientacion ?? (o.orientaciones.includes('S') ? 'S' : (o.orientaciones[0] ?? 'U'));
    const id = this.asegurar(o, ori, variante, o.autotile ? '0101' : undefined);
    const clave = `${id}@${lado}`;
    const guardada = this.miniaturas.get(clave);
    if (guardada) return guardada;
    const t = this.tamano(id) ?? { w: CASILLA, h: CASILLA };
    const escala = Math.max(1, Math.min(Math.floor(lado / t.w), Math.floor(lado / t.h), 3));
    const c = document.createElement('canvas');
    c.width = lado;
    c.height = lado;
    const g = c.getContext('2d') as CanvasRenderingContext2D;
    const w = t.w * escala;
    const h = t.h * escala;
    this.dibujarEn(g, id, Math.round((lado - w) / 2), Math.round((lado - h) / 2), escala);
    const url = c.toDataURL('image/png');
    this.miniaturas.set(clave, url);
    return url;
  }

  /** Huella en píxeles (útil para fantasmas y selección). */
  static huellaPx(o: ObjetoCatalogo, orientacion: Orientacion): { w: number; h: number } {
    const h = huellaDe(o, orientacion);
    return { w: h.ancho * CASILLA, h: h.alto * CASILLA };
  }
}
