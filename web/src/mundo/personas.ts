import Phaser from 'phaser';
import { CUADROS, DIRECCIONES_PERSONAJE, PERSONAJE_ALTO, PERSONAJE_ANCHO, claveAvatar, type DatosSentado, type SalaMapa } from '@ol/shared';
import { COLUMNAS_HOJA, celdaHoja } from './avatar';
import { cuadroDeCaminar, recorridoAlParar } from './pasos';
import type { AnclaNombre } from './etiquetas';
import type { Puente } from './puente';
import type { PersonaVista } from './vivo';
import { radioCirculo } from './zoom';
import { CadenciaPasos } from './sonido';

/**
 * Medidas del personaje v5 (cuadro de 32 x 64 con los pies en la fila 61): la figura mide 33 filas de contorno a contorno (de la 29 a la 61),
 * 35 con el peinado más bajo (el despeinado llega a la fila 27) y 20 columnas (de la 6 a la 25). El eje del personaje es el borde entre las
 * columnas 15 y 16 y el sprite se ancla con el borde de abajo de la fila 61 (`ORIGEN_Y`) en los pies.
 * Sentado, la cabeza queda en las mismas filas que de pie (no baja): lo que cambia es dónde se apoyan los pies (ver `sentado-anclas.ts`).
 */
export const ALTO_FIGURA = 35;
export const ALTO_FIGURA_SENTADO = 35;
/** El sprite se ancla en el borde de abajo de la fila 61 del cuadro de 64 (el contorno de las suelas), no en el de abajo del cuadro. */
export const ORIGEN_Y = 62 / 64;
/** Píxeles que la tapa de la silla sobresale a cada lado de la figura (la figura mide de la columna 6 a la 25). */
const TAPA_EXTRA = 2;
const FIGURA_DER = 10;
/** Cada cuánto parpadea quien está quieto o sentado (ms, al azar entre los dos) y cuánto dura el parpadeo. */
const PARPADEO_CADA: readonly [number, number] = [2600, 6200];
const PARPADEO_DURA = 140;

interface Entrada {
  id: number;
  persona: PersonaVista;
  sombra: Phaser.GameObjects.Image;
  /** Respaldo de la silla dibujado POR ENCIMA de quien está sentado de espaldas (solo la parte baja del cuadro de la silla). */
  tapa: Phaser.GameObjects.Image | null;
  sprite: Phaser.GameObjects.Sprite;
  llave: string;
  /** Cuánto recorrió caminando (px): el ciclo de pasos sigue esta distancia, no el reloj. */
  recorrido: number;
  caminaba: boolean;
  /** Cuándo es el próximo parpadeo y hasta cuándo dura el que está en curso (ms del reloj de la escena). */
  proxParpadeo: number;
  finParpadeo: number;
  /** Para saber si se está moviendo (los remotos mandan `anim`; el local lo decide el motor). */
  anterior: { x: number; y: number };
  /** Pasos sonoros: uno por cada cuadro de contacto del ciclo de caminar. */
  cadencia: CadenciaPasos;
  /** Si estaba sentada en el cuadro anterior (para el sonido de sentarse y levantarse). */
  eraSentado: boolean;
  /** Datos del último asiento ocupado (al levantarse el asiento ya no está bajo los pies). */
  ultimosDatos?: DatosSentado | null;
}

/** Los sprites de las personas: el tuyo y los de los demás. Los nombres y los estados los dibuja `Etiquetas`, con las `anclas` que arma esta capa. */
export class CapaPersonas {
  private readonly entradas = new Map<number, Entrada>();
  private versionVista = -1;
  /** Profundidad del asiento que ocupa una casilla (para dibujar a quien está sentado encima de su silla). */
  profAsiento: (cx: number, cy: number) => number | null = () => null;
  /** Cómo se acomoda quien se sienta en una casilla (pose, y la banda del asiento que se dibuja por delante). */
  datosAsiento: (cx: number, cy: number) => DatosSentado | null = () => null;
  /** La imagen del asiento que ocupa una casilla (de ella se saca la tapa que cubre las piernas o el cuerpo de quien se sienta). */
  imagenAsiento: (cx: number, cy: number) => Phaser.GameObjects.Image | undefined = () => undefined;
  /** Un paso sonoro (cuadro de contacto del ciclo de caminar) de quien sea, y un cambio de asiento (sentarse o levantarse). Lo conecta el motor. */
  alPaso: ((e: { persona: PersonaVista; esYo: boolean; x: number; y: number; variante: 0 | 1; tono: number }) => void) | null = null;
  alAsiento: ((e: { persona: PersonaVista; esYo: boolean; x: number; y: number; sienta: boolean; datos: DatosSentado | null }) => void) | null = null;
  /** El motor marca aquí si tu personaje está caminando. */
  yoCaminando = false;
  /** Dónde colgar la píldora de cada persona (se rearma en cada cuadro). */
  readonly anclas: AnclaNombre[] = [];

  constructor(
    private readonly escena: Phaser.Scene,
    private readonly puente: Puente,
  ) {
    // Sombra de la persona en pixel art: dos óvalos escalonados (borde suave y centro más oscuro), a la medida de una figura de
    // 20 columnas. Sin degradados: cada píxel es 0 o un solo tono.
    if (!escena.textures.exists('sombra-persona')) {
      const c = document.createElement('canvas');
      c.width = 26;
      c.height = 8;
      const g = c.getContext('2d') as CanvasRenderingContext2D;
      const ovalo = (rx: number, ry: number, alfa: number) => {
        g.fillStyle = `rgba(20,24,40,${alfa})`;
        for (let y = -ry; y <= ry; y++) {
          const ancho = Math.round(rx * Math.sqrt(1 - (y * y) / (ry * ry + 0.0001)));
          g.fillRect(13 - ancho, 4 + y, ancho * 2, 1);
        }
      };
      ovalo(12, 3, 0.16);
      ovalo(8, 2, 0.2);
      escena.textures.addCanvas('sombra-persona', c);
    }
  }

  private textura(persona: PersonaVista): string {
    const spec = persona.avatar;
    const semilla = persona.id;
    const llave = `avatar:${spec ? claveAvatar(spec) : `s${semilla}`}`;
    if (this.escena.textures.exists(llave)) return llave;
    const hoja = this.puente.avatares.hoja(spec, semilla);
    const tex = this.escena.textures.addCanvas(llave, hoja);
    if (tex) {
      for (const dir of DIRECCIONES_PERSONAJE) {
        for (let c = 0; c < COLUMNAS_HOJA; c++) {
          const { x, y } = celdaHoja(dir, c);
          tex.add(`${dir}${c}`, 0, x, y, PERSONAJE_ANCHO, PERSONAJE_ALTO);
        }
      }
    }
    return llave;
  }

  private crear(p: PersonaVista): Entrada {
    const llave = this.textura(p);
    const sombra = this.escena.add.image(p.vx, p.vy - 1, 'sombra-persona');
    const sprite = this.escena.add.sprite(p.vx, p.vy, llave, `${p.dir}0`).setOrigin(0.5, ORIGEN_Y);
    return { id: p.id, persona: p, sombra, tapa: null, sprite, llave, recorrido: 0, caminaba: false, anterior: { x: p.x, y: p.y }, cadencia: new CadenciaPasos(), eraSentado: p.anim === 'sentado', proxParpadeo: this.escena.time.now + Math.random() * PARPADEO_CADA[1], finParpadeo: 0 };
  }

  private quitar(e: Entrada): void {
    e.sombra.destroy();
    e.sprite.destroy();
    e.tapa?.destroy();
  }

  sincronizar(): void {
    const v = this.puente.vivo;
    if (v.version === this.versionVista) return;
    this.versionVista = v.version;
    const deberian = new Map<number, PersonaVista>();
    if (v.yo) deberian.set(v.yo.id, v.yo);
    for (const [id, p] of v.otros) deberian.set(id, p);
    for (const [id, e] of this.entradas) {
      const p = deberian.get(id);
      if (!p || e.persona !== p) {
        this.quitar(e);
        this.entradas.delete(id);
      }
    }
    for (const [id, p] of deberian) if (!this.entradas.has(id)) this.entradas.set(id, this.crear(p));
  }

  /** Mueve lo mostrado hacia lo real, anima y arma las anclas de las píldoras de nombre. */
  actualizar(dtMs: number, tMs: number, zoom: number, sala: SalaMapa | null): void {
    const k = 1 - Math.exp(-dtMs / 1000 * 14);
    const yoId = this.puente.vivo.yo?.id;
    this.anclas.length = 0;
    const rCirculo = radioCirculo(zoom);
    for (const e of this.entradas.values()) {
      const p = e.persona;
      const esYo = p.id === yoId;
      if (!esYo) {
        p.vx += (p.x - p.vx) * k;
        p.vy += (p.y - p.vy) * k;
      } else {
        p.vx = p.x;
        p.vy = p.y;
      }
      const dx = p.vx - e.anterior.x;
      const dy = p.vy - e.anterior.y;
      const seMovio = dx * dx + dy * dy > 0.04;
      e.anterior.x = p.vx;
      e.anterior.y = p.vy;
      const caminando = esYo ? this.yoCaminando : p.anim === 'caminar' || seMovio;
      const sentado = p.anim === 'sentado';
      let cuadro: number = CUADROS.quieto;
      if (sentado) cuadro = CUADROS.sentado;
      else if (caminando) {
        // Los pies siguen la distancia recorrida; al arrancar entra de una en un paso y al parar vuelve de una a quieto.
        e.recorrido += Math.min(Math.hypot(dx, dy), 12);
        cuadro = cuadroDeCaminar(e.recorrido);
      }
      if (e.caminaba && !caminando) e.recorrido = recorridoAlParar(e.recorrido);
      e.caminaba = caminando && !sentado;
      // Parpadeo: quieto o sentado, de vez en cuando se muestra el cuadro del ojo medio cerrado un instante.
      if (caminando) e.proxParpadeo = Math.max(e.proxParpadeo, tMs + 600);
      else if (tMs >= e.proxParpadeo) {
        e.finParpadeo = tMs + PARPADEO_DURA;
        e.proxParpadeo = tMs + PARPADEO_CADA[0] + Math.random() * (PARPADEO_CADA[1] - PARPADEO_CADA[0]);
      }
      if (!caminando && tMs < e.finParpadeo) cuadro = sentado ? CUADROS.parpadeoSentado : CUADROS.parpadeoQuieto;
      const datos = sentado ? this.datosAsiento(Math.floor(p.vx / 32), Math.floor((p.vy - 2) / 32)) : null;
      e.sprite.setFrame(`${datos ? datos.pose : p.dir}${cuadro}`);
      // Sonidos: un paso en cada cuadro de contacto y un golpe al sentarse o al levantarse.
      const paso = e.cadencia.cuadro(cuadro, caminando && !sentado);
      if (paso && this.alPaso) this.alPaso({ persona: p, esYo, x: p.vx, y: p.vy, variante: paso.variante, tono: paso.tono });
      if (sentado !== e.eraSentado) {
        e.eraSentado = sentado;
        const d = this.datosAsiento(Math.floor(p.vx / 32), Math.floor((p.vy - 2) / 32));
        this.alAsiento?.({ persona: p, esYo, x: p.vx, y: p.vy, sienta: sentado, datos: sentado ? d : e.ultimosDatos ?? null });
      }
      if (sentado) e.ultimosDatos = datos;
      const x = Math.round(p.vx);
      const y = Math.round(p.vy);
      e.sprite.setPosition(x, y);
      let prof = y;
      if (sentado && sala) {
        const asiento = this.profAsiento(Math.floor(p.vx / 32), Math.floor((p.vy - 2) / 32));
        if (asiento !== null) prof = asiento + 0.6;
      }
      e.sprite.setDepth(prof);
      e.sombra.setPosition(x, y - 1).setDepth(prof - 0.5).setVisible(!sentado);
      this.actualizarTapa(e, datos, x, prof);
      // Arriba de la cabeza, o sobre el círculo de la vista esquemática.
      this.anclas.push({ persona: p, x, yCabeza: y - (sentado ? ALTO_FIGURA_SENTADO : ALTO_FIGURA) - 3, yCirculo: p.vy - 12 - rCirculo - 2 });
    }
  }

  /**
   * Quien se sienta queda DENTRO del asiento: la banda `corte` de la imagen del asiento (filas [desde, hasta)) se dibuja otra vez por
   * encima de la figura. De espaldas es el respaldo (un par de píxeles más ancho que la figura por cada lado); de frente y de perfil, el
   * borde del cojín y los apoyabrazos, con el ancho de la casilla. Sin `corte` no hay tapa.
   */
  private actualizarTapa(e: Entrada, datos: DatosSentado | null, x: number, prof: number): void {
    const p = e.persona;
    const silla = datos?.corte ? this.imagenAsiento(Math.floor(p.vx / 32), Math.floor((p.vy - 2) / 32)) : undefined;
    if (!silla || !datos?.corte) {
      e.tapa?.setVisible(false);
      return;
    }
    const tapa = e.tapa ?? (e.tapa = this.escena.add.image(0, 0, silla.texture.key, silla.frame.name).setOrigin(0, 0));
    if (tapa.texture.key !== silla.texture.key || tapa.frame.name !== silla.frame.name) tapa.setTexture(silla.texture.key, silla.frame.name);
    // La imagen del asiento tiene su esquina de arriba a la izquierda en (silla.x, silla.y - alto). Se recorta en píxeles de la imagen.
    const mitad = datos.pose === 'N' ? FIGURA_DER + TAPA_EXTRA : 16;
    const izq = Math.max(0, x - mitad - silla.x);
    const der = Math.min(silla.width, x + mitad - silla.x);
    // El corte se mide desde el borde de abajo de la imagen: sirve igual para asientos de 32 o de 40 px.
    const arriba = Math.max(0, silla.height - datos.corte[0]);
    const abajo = Math.max(0, silla.height - datos.corte[1]);
    tapa.setPosition(silla.x, silla.y - silla.height);
    tapa.setCrop(izq, arriba, Math.max(0, der - izq), Math.max(0, abajo - arriba));
    tapa.setDepth(prof + 0.7).setAlpha(silla.alpha).setVisible(silla.visible && der > izq && abajo > arriba);
  }

  /** Dónde está la parte de arriba de la cabeza de alguien (para las reacciones). */
  yCabezaDe(id: number): number | null {
    return this.anclas.find((a) => a.persona.id === id)?.yCabeza ?? null;
  }

  /** Transparencia de los sprites (el esquema los tapa al alejar). */
  setAlfa(a: number): void {
    const visible = a > 0.01;
    for (const e of this.entradas.values()) {
      e.sprite.setAlpha(a).setVisible(visible);
      e.sombra.setAlpha(a).setVisible(visible && e.persona.anim !== 'sentado');
    }
  }

  /** Puntos de luz de cada persona (para los charcos de luz de las luces apagadas). */
  puntos(): { x: number; y: number }[] {
    const r: { x: number; y: number }[] = [];
    for (const e of this.entradas.values()) r.push({ x: e.persona.vx, y: e.persona.vy });
    return r;
  }

  destruir(): void {
    for (const e of this.entradas.values()) this.quitar(e);
    this.entradas.clear();
  }
}
