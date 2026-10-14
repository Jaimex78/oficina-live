import Phaser from 'phaser';
import { PROF } from '@ol/shared';
import type { AreaMundo } from './areas';
import { resolverTraslapes, type Caja } from './colocacion';
import { COLOR_PUNTO, PILDORA, textoDePildora, type VarianteNombre } from './estados-vista';
import { COLOR_CLASE, ICONO_DE_CLASE, dibujarIcono, type IconoId } from './iconos';
import { aMundo, aPantalla, enPantalla, type Proyeccion } from './proyeccion';
import type { PersonaVista } from './vivo';

/**
 * Las píldoras del mundo: el nombre de cada persona (con su punto de estado) y el rótulo de cada zona.
 * Cada una se dibuja en un canvas al doble de tamaño y se coloca sobre un píxel entero de la pantalla, con el mismo tamaño
 * a cualquier zoom. Con el doble de resolución y filtro lineal, el borde sale suave y el texto nítido.
 */

const RES = 2;
const FUENTE = '"Inter Variable", Inter, system-ui, sans-serif';
const ALTO = 18;
const MARGEN = 2; // aire alrededor de la píldora para la sombra
const PUNTO = 6;

export interface EspecPildora {
  texto: string;
  fondo: string;
  colorTexto: string;
  borde: string;
  punto?: string;
  icono?: IconoId;
  colorIcono?: string;
  tam?: number;
  peso?: number;
}

export interface TexturaPildora {
  key: string;
  /** Tamaño de la píldora sin el margen, en píxeles de pantalla. */
  w: number;
  h: number;
}

let medidor: CanvasRenderingContext2D | null = null;

function anchoDeTexto(texto: string, tam: number, peso: number): number {
  medidor ??= document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D;
  medidor.font = `${peso} ${tam}px ${FUENTE}`;
  return Math.ceil(medidor.measureText(texto).width);
}

const claveDe = (e: EspecPildora): string => `pil|${e.texto}|${e.fondo}|${e.colorTexto}|${e.borde}|${e.punto ?? ''}|${e.icono ?? ''}|${e.colorIcono ?? ''}|${e.tam ?? 11}|${e.peso ?? 600}`;

/** Crea (o reutiliza) la textura de una píldora. */
export function texturaDePildora(escena: Phaser.Scene, e: EspecPildora): TexturaPildora {
  const tam = e.tam ?? 11;
  const peso = e.peso ?? 600;
  const key = claveDe(e);
  const textoW = anchoDeTexto(e.texto, tam, peso);
  const padX = 8;
  const hueco = 5;
  let contenido = textoW;
  if (e.punto) contenido += PUNTO + hueco;
  if (e.icono) contenido += 11 + 4;
  let w = padX * 2 + contenido;
  if (w % 2 === 1) w += 1;
  const h = ALTO;
  if (escena.textures.exists(key)) return { key, w, h };

  const c = document.createElement('canvas');
  c.width = (w + MARGEN * 2) * RES;
  c.height = (h + MARGEN * 2) * RES;
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  g.scale(RES, RES);
  g.translate(MARGEN, MARGEN);

  // Cuerpo con sombra suave.
  g.save();
  g.shadowColor = 'rgba(15, 20, 40, 0.28)';
  g.shadowBlur = 2 * RES;
  g.shadowOffsetY = 1 * RES;
  g.beginPath();
  g.roundRect(0, 0, w, h, h / 2);
  g.fillStyle = e.fondo;
  g.fill();
  g.restore();
  g.beginPath();
  g.roundRect(0.5, 0.5, w - 1, h - 1, (h - 1) / 2);
  g.strokeStyle = e.borde;
  g.lineWidth = 1;
  g.stroke();

  let x = padX;
  if (e.punto) {
    g.beginPath();
    g.arc(x + PUNTO / 2, h / 2, PUNTO / 2, 0, Math.PI * 2);
    g.fillStyle = e.punto;
    g.fill();
    x += PUNTO + hueco;
  }
  if (e.icono) {
    dibujarIcono(g, e.icono, x, (h - 11) / 2, 11, e.colorIcono ?? e.colorTexto);
    x += 11 + 4;
  }
  g.font = `${peso} ${tam}px ${FUENTE}`;
  g.fillStyle = e.colorTexto;
  g.textBaseline = 'alphabetic';
  g.fillText(e.texto, x, h / 2 + tam * 0.36);

  const tex = escena.textures.addCanvas(key, c);
  tex?.setFilter(Phaser.Textures.FilterMode.LINEAR);
  return { key, w, h };
}

// ---------- el sistema de etiquetas ----------

/** Dónde está cada persona, para colgarle la píldora. Lo arma `CapaPersonas`. */
export interface AnclaNombre {
  persona: PersonaVista;
  /** Mundo: centro del personaje. */
  x: number;
  /** Mundo: la parte de arriba de la cabeza. */
  yCabeza: number;
  /** Mundo: la parte de arriba del círculo de la vista esquemática. */
  yCirculo: number;
}

export interface EntradaEtiquetas {
  vp: Proyeccion;
  oscuro: boolean;
  /** 0 arte, 1 esquema: la píldora de nombre sube o baja con el personaje. */
  esquemaT: number;
  personas: readonly AnclaNombre[];
  yoId: number | null;
  seleccionPersona: number | null;
  zonas: readonly AreaMundo[];
  /** Sala o área tocada: su nombre queda flotando encima. */
  titulo: AreaMundo | null;
  visible: boolean;
}

interface Colgada {
  img: Phaser.GameObjects.Image;
  clave: string;
}

export class Etiquetas {
  /** Todas las píldoras vivas, por id: `n<id de persona>`, `z<id de zona>` y `titulo`. */
  private readonly colgadas = new Map<string, Colgada>();
  private readonly memoria = new Map<string, TexturaPildora>();

  constructor(private readonly escena: Phaser.Scene) {}

  private textura(e: EspecPildora): TexturaPildora {
    const k = claveDe(e);
    let t = this.memoria.get(k);
    if (!t) {
      t = texturaDePildora(this.escena, e);
      this.memoria.set(k, t);
    }
    return t;
  }

  private colgar(id: string, t: TexturaPildora, depth: number): Phaser.GameObjects.Image {
    let c = this.colgadas.get(id);
    if (!c) {
      c = { img: this.escena.add.image(0, 0, '__DEFAULT').setOrigin(0, 0).setDepth(depth).setVisible(false), clave: '' };
      this.colgadas.set(id, c);
    }
    if (c.clave !== t.key) {
      c.img.setTexture(t.key);
      c.clave = t.key;
    }
    return c.img;
  }

  actualizar(e: EntradaEtiquetas): void {
    if (!e.visible) {
      for (const c of this.colgadas.values()) c.img.setVisible(false);
      return;
    }
    const { vp } = e;
    const escala = 1 / (vp.zoom * RES);
    const cajas: Caja[] = [];
    const texturas = new Map<string, TexturaPildora>();
    const vivas = new Set<string>();

    // Nombres de personas: sobre la cabeza (o sobre el círculo, en el esquema).
    for (const a of e.personas) {
      const p = a.persona;
      const variante: VarianteNombre = p.id === e.yoId ? 'yo' : p.id === e.seleccionPersona ? 'seleccionada' : 'otra';
      const t = this.textura(especNombre(p, variante, e.oscuro));
      const id = `n${p.id}`;
      this.colgar(id, t, PROF.etiquetas);
      vivas.add(id);
      texturas.set(id, t);
      const yMundo = a.yCabeza + (a.yCirculo - a.yCabeza) * e.esquemaT;
      const s = aPantalla(vp, a.x, yMundo);
      const prioridad = variante === 'yo' ? 100 : variante === 'seleccionada' ? 90 : 10 + Math.min(50, p.vy / 100);
      cajas.push({ id, x: Math.round(s.x - t.w / 2), y: Math.round(s.y - 3 - t.h), w: t.w, h: t.h, prioridad, tipo: 'nombre' });
    }

    // Rótulos de zona: solo en la vista esquemática (de lejos). Sobre el piso estorbaban: el nombre del lugar donde estás
    // vive en la píldora de arriba a la izquierda del HUD.
    const zonasVisibles = e.esquemaT > 0.15;
    for (const z of zonasVisibles ? e.zonas : []) {
      if (z.id === e.titulo?.id) continue; // la zona tocada ya muestra su nombre arriba, en la etiqueta flotante
      const color = COLOR_CLASE[z.claseId][e.oscuro ? 'oscuro' : 'claro'];
      const t = this.textura(especZona(z.nombre, z.claseId, color, e.oscuro));
      const izq = aPantalla(vp, z.rect.x * 32, z.rect.y * 32);
      const der = aPantalla(vp, (z.rect.x + z.rect.w) * 32, (z.rect.y + z.rect.h) * 32);
      if (!enPantalla(vp, izq.x, izq.y, der.x - izq.x, der.y - izq.y)) continue;
      // Centrado en la zona; si el centro se salió de la pantalla, se corre hacia lo que se ve, sin salirse de la zona.
      const centrado = (izq.x + der.x) / 2 - t.w / 2;
      const minimo = Math.max(izq.x + 4, 6);
      const maximo = Math.min(der.x - t.w - 4, vp.ancho - t.w - 6);
      const x = maximo >= minimo ? Math.min(maximo, Math.max(minimo, centrado)) : centrado;
      const y = Math.max(izq.y + 4, 6);
      if (y > der.y - t.h) continue;
      const id = `z${z.id}`;
      this.colgar(id, t, PROF.etiquetas - 1);
      vivas.add(id);
      texturas.set(id, t);
      cajas.push({ id, x: Math.round(x), y: Math.round(y), w: t.w, h: t.h, prioridad: -10 - Math.min(5, (z.rect.w * z.rect.h) / 400), tipo: 'zona' });
    }

    // Etiqueta flotante de la sala o el área tocada: sobre su borde de arriba, centrada. Esta no se mueve ni se esconde.
    // De cerca, el nombre de una zona tocada ya está en su tarjeta y en la píldora de arriba: no se pinta sobre el piso.
    if (e.titulo && (e.titulo.origen !== 'zona' || e.esquemaT > 0.15)) {
      const t = this.textura(especTitulo(e.titulo.nombre, e.oscuro));
      const izq = aPantalla(vp, e.titulo.rect.x * 32, e.titulo.rect.y * 32);
      const der = aPantalla(vp, (e.titulo.rect.x + e.titulo.rect.w) * 32, e.titulo.rect.y * 32);
      this.colgar('titulo', t, PROF.etiquetas + 1);
      vivas.add('titulo');
      texturas.set('titulo', t);
      cajas.push({ id: 'titulo', x: Math.round((izq.x + der.x) / 2 - t.w / 2), y: Math.round(izq.y - t.h - 5), w: t.w, h: t.h, prioridad: 200, tipo: 'fija' });
    }

    // Quien ya no está se quita; lo demás se coloca sobre píxeles enteros.
    for (const [id, c] of this.colgadas) {
      if (vivas.has(id)) continue;
      if (id.startsWith('n')) {
        c.img.destroy();
        this.colgadas.delete(id);
      } else c.img.setVisible(false);
    }
    for (const c of resolverTraslapes(cajas)) {
      const t = texturas.get(c.id);
      const img = this.colgadas.get(c.id)?.img;
      if (!t || !img) continue;
      const visible = c.visible && enPantalla(vp, c.x, c.y, t.w, t.h, 40);
      img.setVisible(visible);
      if (!visible) continue;
      if (c.id.startsWith('z')) img.setAlpha(Math.min(1, Math.max(0, (e.esquemaT - 0.15) / 0.5)));
      const m = aMundo(vp, c.x - MARGEN, c.y - MARGEN);
      img.setPosition(m.x, m.y).setScale(escala);
    }
  }

  destruir(): void {
    for (const c of this.colgadas.values()) c.img.destroy();
    this.colgadas.clear();
  }
}

// ---------- especificaciones ----------

export function especNombre(p: { nombre: string; apodo: string; estado: keyof typeof COLOR_PUNTO }, variante: VarianteNombre, oscuro: boolean): EspecPildora {
  const estilo = variante === 'otra' ? (oscuro ? PILDORA.claraOscura : PILDORA.clara) : PILDORA.propia;
  return { texto: textoDePildora(p), fondo: estilo.fondo, colorTexto: estilo.texto, borde: estilo.borde, punto: COLOR_PUNTO[p.estado] };
}

export function especZona(nombre: string, clase: AreaMundo['claseId'], colorIcono: string, oscuro: boolean): EspecPildora {
  const estilo = oscuro ? PILDORA.claraOscura : PILDORA.clara;
  return { texto: nombre, fondo: estilo.fondo, colorTexto: estilo.texto, borde: estilo.borde, icono: ICONO_DE_CLASE[clase], colorIcono };
}

export function especTitulo(nombre: string, oscuro: boolean): EspecPildora {
  const estilo = oscuro ? PILDORA.claraOscura : PILDORA.clara;
  return { texto: nombre, fondo: estilo.fondo, colorTexto: estilo.texto, borde: estilo.borde, tam: 12, peso: 700 };
}
