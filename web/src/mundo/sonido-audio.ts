import { AlmacenAjustesSonido, gananciaDe, puedeSonar, type Efecto, type Material } from './sonido';

/**
 * Motor de audio de la oficina: todo se sintetiza con Web Audio (ruido filtrado, tonos y envolventes cortas), sin archivos de audio ni derechos.
 * Respeta el autoplay: el `AudioContext` se crea y se reanuda en el primer gesto (tecla, clic o toque). Cada efecto pasa por la ganancia
 * del volumen general y sus interruptores, y por un paneo estéreo opcional. La lógica de cuándo y cuánto suena está en `sonido.ts`.
 */

export interface OpcionesEfecto {
  material?: Material;
  variante?: 0 | 1;
  /** Volumen relativo 0 a 1 (la distancia, en el caso de las demás personas). */
  volumen?: number;
  /** -1 a 1. */
  pan?: number;
  /** Multiplicador de tono (1 = normal). */
  tono?: number;
}

type CtxAudio = typeof AudioContext;
const crearContexto = (): AudioContext | null => {
  const C: CtxAudio | undefined = typeof window !== 'undefined' ? (window.AudioContext ?? (window as unknown as { webkitAudioContext?: CtxAudio }).webkitAudioContext) : undefined;
  try {
    return C ? new C({ latencyHint: 'interactive' }) : null;
  } catch {
    return null;
  }
};

/** Duración aproximada (ms) de cada efecto, para contar las voces simultáneas. */
export const DURACION_EFECTO_MS: Record<Efecto, number> = {
  paso: 140,
  'sentar-blando': 260,
  'sentar-duro': 260,
  'levantar-blando': 200,
  'levantar-duro': 200,
  'puerta-abre': 380,
  'puerta-cierra': 240,
  reaccion: 140,
  mensaje: 320,
  aviso: 700,
  entra: 420,
  sale: 420,
  'enfoque-fin': 1400,
  'sala-entra': 120,
  'sala-sale': 120,
};

export class MotorSonido {
  private ctx: AudioContext | null = null;
  private salida: GainNode | null = null;
  private ruido: AudioBuffer | null = null;
  private gestoListo = false;
  /** Lo pone el motor del mundo cada cuadro (la vista esquemática deja todo en silencio). */
  esquema = false;
  /** Cuántos efectos se dispararon (para pruebas y diagnóstico). */
  disparados = 0;

  constructor(
    readonly ajustes: AlmacenAjustesSonido,
    private readonly entorno: () => { paginaVisible: boolean; rendimiento: string } = () => ({
      paginaVisible: typeof document === 'undefined' || document.visibilityState === 'visible',
      rendimiento: (typeof document !== 'undefined' && document.documentElement.dataset['rendimiento']) || 'equilibrado',
    }),
  ) {}

  /** Estado del `AudioContext`: 'sin' hasta el primer gesto. */
  get estado(): 'sin' | AudioContextState {
    return this.ctx ? this.ctx.state : 'sin';
  }

  /** Engancha el primer gesto del usuario para crear y reanudar el `AudioContext` (autoplay). Devuelve la función para quitarlo. */
  engancharGesto(blanco: Window | Document = document): () => void {
    const alGesto = () => this.despertar();
    const eventos = ['pointerdown', 'keydown', 'touchstart'] as const;
    for (const e of eventos) blanco.addEventListener(e, alGesto, { passive: true });
    return () => {
      for (const e of eventos) blanco.removeEventListener(e, alGesto);
    };
  }

  /** Crea el contexto si hace falta y lo reanuda. Debe llamarse desde un gesto. */
  despertar(): void {
    if (!this.ctx) {
      this.ctx = crearContexto();
      if (!this.ctx) return;
      this.salida = this.ctx.createGain();
      this.salida.gain.value = 0.9;
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.ratio.value = 6;
      this.salida.connect(comp).connect(this.ctx.destination);
      const n = Math.floor(this.ctx.sampleRate * 0.6);
      this.ruido = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const d = this.ruido.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    }
    this.gestoListo = true;
    if (this.ctx.state === 'suspended') void this.ctx.resume().catch(() => undefined);
  }

  /** Suena un efecto si hay contexto activo y los ajustes y el entorno lo permiten. Devuelve true si se programó. */
  reproducir(e: Efecto, o: OpcionesEfecto = {}, forzar = false): boolean {
    const ctx = this.ctx;
    if (!ctx || !this.salida || !this.gestoListo || ctx.state !== 'running') return false;
    if (!forzar && !puedeSonar({ ...this.entorno(), esquema: this.esquema })) return false;
    const g = gananciaDe(this.ajustes.leer(), e) * Math.max(0, Math.min(1, o.volumen ?? 1));
    if (g <= 0.0005) return false;
    const t0 = ctx.currentTime + 0.005;
    const mezcla = ctx.createGain();
    mezcla.gain.value = g;
    let ultimo: AudioNode = mezcla;
    if (o.pan !== undefined && typeof ctx.createStereoPanner === 'function') {
      const p = ctx.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, o.pan));
      mezcla.connect(p);
      ultimo = p;
    }
    ultimo.connect(this.salida);
    this.disparados++;
    const s = new Sintetizador(ctx, mezcla, this.ruido as AudioBuffer, t0, o.tono ?? 1);
    s.efecto(e, o.material ?? 'baldosa', o.variante ?? 0);
    // Libera el nodo de mezcla cuando termina.
    window.setTimeout(() => {
      try {
        mezcla.disconnect();
      } catch {
        /* ya desconectado */
      }
    }, DURACION_EFECTO_MS[e] + 400);
    return true;
  }

  /** Botón «Probar sonido» de Configuración: ignora el modo y la pestaña, no los interruptores ni el volumen (pasos, asiento y aviso). */
  probar(): void {
    this.despertar();
    const a = this.ajustes.leer();
    const seq: [Efecto, number][] = [['paso', 0], ['paso', 190], ['sentar-blando', 520], ['mensaje', 900]];
    for (const [e, ms] of seq) window.setTimeout(() => this.reproducir(e, { material: 'madera', variante: ms === 190 ? 1 : 0 }, true), ms);
    void a;
  }
}

/** Los sonidos: cada uno arma sus nodos con la hora de inicio `t0` y se borra solo al terminar. */
class Sintetizador {
  constructor(
    private readonly c: AudioContext,
    private readonly destino: AudioNode,
    private readonly ruido: AudioBuffer,
    private readonly t0: number,
    private readonly tono: number,
  ) {}

  private golpeRuido(filtro: BiquadFilterType, freq: number, q: number, dur: number, pico: number, inicio = 0, ataque = 0.004): void {
    const c = this.c;
    const f = c.createBiquadFilter();
    f.type = filtro;
    f.frequency.value = freq * this.tono;
    f.Q.value = q;
    const g = c.createGain();
    const t = this.t0 + inicio;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(pico, t + ataque);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const src = c.createBufferSource();
    src.buffer = this.ruido;
    src.connect(f).connect(g).connect(this.destino);
    src.start(t, Math.random() * 0.3, dur + 0.05);
  }

  private tonoSimple(onda: OscillatorType, f0: number, f1: number, dur: number, pico: number, inicio = 0, ataque = 0.004): void {
    const c = this.c;
    const o = c.createOscillator();
    o.type = onda;
    const t = this.t0 + inicio;
    o.frequency.setValueAtTime(f0 * this.tono, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1 * this.tono), t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(pico, t + ataque);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.destino);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  efecto(e: Efecto, material: Material, variante: 0 | 1): void {
    const v = variante === 0 ? 1 : 1.12;
    switch (e) {
      case 'paso':
        return this.paso(material, v);
      case 'sentar-blando':
        this.golpeRuido('lowpass', 420, 0.7, 0.2, 0.7);
        return this.tonoSimple('sine', 110, 62, 0.22, 0.5);
      case 'levantar-blando':
        this.golpeRuido('lowpass', 520, 0.7, 0.14, 0.4);
        return this.tonoSimple('sine', 90, 70, 0.14, 0.25);
      case 'sentar-duro':
        this.golpeRuido('bandpass', 900, 1.2, 0.07, 0.5);
        this.tonoSimple('sine', 150, 90, 0.1, 0.3);
        return this.tonoSimple('sawtooth', 340, 230, 0.13, 0.05, 0.03);
      case 'levantar-duro':
        this.golpeRuido('bandpass', 1100, 1.2, 0.05, 0.3);
        return this.tonoSimple('sawtooth', 230, 330, 0.1, 0.045, 0.01);
      case 'puerta-abre':
        this.tonoSimple('square', 1700, 1500, 0.012, 0.18);
        this.golpeRuido('bandpass', 2400, 2, 0.02, 0.2, 0.012);
        return this.chirrido();
      case 'puerta-cierra':
        this.golpeRuido('lowpass', 320, 0.8, 0.18, 0.7);
        this.tonoSimple('sine', 78, 48, 0.2, 0.6);
        return this.golpeRuido('bandpass', 1500, 1, 0.02, 0.2);
      case 'reaccion':
        return this.tonoSimple('sine', 520, 900, 0.09, 0.4);
      case 'mensaje':
        this.tonoSimple('triangle', 880, 880, 0.14, 0.38);
        return this.tonoSimple('triangle', 1175, 1175, 0.2, 0.34, 0.1);
      case 'aviso':
        this.tonoSimple('sine', 1318, 1318, 0.6, 0.38);
        return this.tonoSimple('sine', 2637, 2637, 0.3, 0.1);
      case 'entra':
        this.tonoSimple('sine', 523, 523, 0.16, 0.3);
        return this.tonoSimple('sine', 784, 784, 0.22, 0.3, 0.12);
      case 'sale':
        this.tonoSimple('sine', 784, 784, 0.16, 0.3);
        return this.tonoSimple('sine', 523, 523, 0.22, 0.3, 0.12);
      case 'enfoque-fin':
        this.tonoSimple('triangle', 784, 784, 0.7, 0.3);
        this.tonoSimple('triangle', 988, 988, 0.8, 0.28, 0.18);
        return this.tonoSimple('triangle', 1175, 1175, 1.1, 0.26, 0.36);
      case 'sala-entra':
        return this.tonoSimple('sine', 720, 640, 0.05, 0.3);
      case 'sala-sale':
        return this.tonoSimple('sine', 540, 470, 0.05, 0.3);
    }
  }

  private chirrido(): void {
    const c = this.c;
    const o = c.createOscillator();
    o.type = 'sawtooth';
    const t = this.t0 + 0.03;
    o.frequency.setValueAtTime(210 * this.tono, t);
    o.frequency.linearRampToValueAtTime(340 * this.tono, t + 0.28);
    const f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 700;
    f.Q.value = 4;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.07, t + 0.05);
    g.gain.linearRampToValueAtTime(0.0001, t + 0.3);
    o.connect(f).connect(g).connect(this.destino);
    o.start(t);
    o.stop(t + 0.34);
  }

  private paso(m: Material, v: number): void {
    switch (m) {
      case 'madera':
        this.golpeRuido('lowpass', 1500 * v, 0.8, 0.07, 0.5);
        this.golpeRuido('bandpass', 900 * v, 2, 0.03, 0.25);
        return this.tonoSimple('sine', 140 * v, 80, 0.07, 0.35);
      case 'baldosa':
        this.golpeRuido('bandpass', 3000 * v, 1.4, 0.04, 0.45);
        this.tonoSimple('sine', 2300 * v, 2100, 0.05, 0.05);
        return this.tonoSimple('sine', 120 * v, 90, 0.04, 0.2);
      case 'alfombra':
        return this.golpeRuido('lowpass', 480 * v, 0.6, 0.1, 0.32);
      case 'cemento':
        this.golpeRuido('bandpass', 1250 * v, 0.9, 0.06, 0.5);
        return this.golpeRuido('highpass', 3500, 0.7, 0.02, 0.12);
      case 'deck':
        this.golpeRuido('lowpass', 1150 * v, 1, 0.08, 0.45);
        this.tonoSimple('sine', 115 * v, 95, 0.1, 0.4);
        return this.tonoSimple('triangle', 420 * v, 380, 0.08, 0.08);
      case 'pasto':
        return this.golpeRuido('highpass', 2400 * v, 0.6, 0.13, 0.22, 0, 0.02);
    }
  }
}
