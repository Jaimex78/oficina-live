import type { Animacion, AjustesPresencia, AvatarSpec, Direccion, EstadoPresencia, Lugar, PersonaPresente, SesionEnfoquePublica } from '@ol/shared';

/** Una persona tal como la dibuja el mundo: la posición mostrada (vx, vy) alcanza suavemente a la que manda el servidor (x, y). */
export interface PersonaVista extends PersonaPresente {
  vx: number;
  vy: number;
}

/**
 * Qué cambió: 'personas' (entró, salió o se reinició la lista), 'estado' (estado o lugar de alguien), 'yo' (llegó tu bienvenida),
 * 'corregido' (el servidor te movió), 'ajustes' (llegaron los ajustes de la oficina), 'reaccion' (alguien reaccionó) y 'bloqueos'
 * (se bloqueó o desbloqueó una sala de reuniones).
 */
export type CambioVivo = 'personas' | 'estado' | 'yo' | 'corregido' | 'ajustes' | 'reaccion' | 'bloqueos';

export interface ReaccionVista {
  id: number;
  emoji: string;
}

/**
 * Lo que está pasando ahora mismo en la oficina: quién está y dónde. No tiene Phaser ni React:
 * la red lo alimenta, el mundo lo dibuja y los paneles se enteran por los avisos de cambio.
 */
export class VivoMundo {
  yo: PersonaVista | null = null;
  readonly otros = new Map<number, PersonaVista>();
  /** Ajustes de presencia que manda el servidor al entrar (distancia de cercanía, chat, ausencia...). */
  ajustes: AjustesPresencia | null = null;
  /** Estás en modo invisible: los demás no te ven. */
  invisible = false;
  /** Última reacción recibida (el mundo la dibuja y la olvida). */
  ultimaReaccion: ReaccionVista | null = null;
  /** Salas de reuniones bloqueadas: id de la zona → id de quien la bloqueó. */
  readonly bloqueos = new Map<string, number>();
  /** Sube cada vez que alguien entra o sale: el mundo lo mira para crear o quitar sus sprites. */
  version = 0;
  private readonly escuchas = new Set<(c: CambioVivo) => void>();

  suscribir(f: (c: CambioVivo) => void): () => void {
    this.escuchas.add(f);
    return () => {
      this.escuchas.delete(f);
    };
  }

  private avisar(c: CambioVivo): void {
    for (const f of [...this.escuchas]) f(c);
  }

  establecerYo(p: PersonaPresente): void {
    this.yo = { ...p, vx: p.x, vy: p.y };
    this.version++;
    this.avisar('yo');
  }

  /** El servidor te puso en otro lugar (por un movimiento que no aceptó o por un cambio de mapa). */
  corregirYo(x: number, y: number): void {
    const yo = this.yo;
    if (!yo) return;
    yo.x = yo.vx = x;
    yo.y = yo.vy = y;
    if (yo.anim === 'sentado') yo.anim = 'quieto';
    this.avisar('corregido');
  }

  fijarAjustes(a: AjustesPresencia, invisible: boolean): void {
    this.ajustes = a;
    this.invisible = invisible;
    this.avisar('ajustes');
  }

  reaccion(id: number, emoji: string): void {
    this.ultimaReaccion = { id, emoji };
    this.avisar('reaccion');
  }

  /** Alguien cambió su personaje o su apodo: se reemplaza el objeto para que el mundo vuelva a dibujarlo. */
  perfil(id: number, avatar: AvatarSpec | null, apodo: string, foto?: number): void {
    const conFoto = foto === undefined ? {} : { foto };
    if (this.yo?.id === id) {
      this.yo = { ...this.yo, avatar, apodo, ...conFoto };
    } else {
      const p = this.otros.get(id);
      if (!p) return;
      this.otros.set(id, { ...p, avatar, apodo, ...conFoto });
    }
    this.version++;
    this.avisar('personas');
  }

  reiniciar(personas: readonly PersonaPresente[]): void {
    this.otros.clear();
    for (const p of personas) this.otros.set(p.id, { ...p, vx: p.x, vy: p.y });
    this.version++;
    this.avisar('personas');
  }

  /** Alguien entra o sale de la oficina (para el sonido). */
  alEntraOSale?: (tipo: 'entra' | 'sale', id: number) => void;

  entra(p: PersonaPresente): void {
    if (!this.otros.has(p.id)) this.alEntraOSale?.('entra', p.id);
    this.otros.set(p.id, { ...p, vx: p.x, vy: p.y });
    this.version++;
    this.avisar('personas');
  }

  sale(id: number): void {
    if (this.otros.delete(id)) {
      this.alEntraOSale?.('sale', id);
      this.version++;
      this.avisar('personas');
    }
  }

  mover(lista: ReadonlyArray<{ id: number; x: number; y: number; dir: Direccion; anim: Animacion }>): void {
    for (const m of lista) {
      const p = this.otros.get(m.id);
      if (!p) continue;
      p.x = m.x;
      p.y = m.y;
      p.dir = m.dir;
      p.anim = m.anim;
    }
  }

  estado(id: number, estado: EstadoPresencia, lugar: Lugar): void {
    const p = this.yo?.id === id ? this.yo : this.otros.get(id);
    if (!p) return;
    p.estado = estado;
    p.lugar = lugar;
    this.avisar('estado');
  }

  /** Reemplaza todos los bloqueos (llegó la bienvenida de la sala). */
  fijarBloqueos(lista: readonly { zona: string; por: number }[]): void {
    this.bloqueos.clear();
    for (const b of lista) this.bloqueos.set(b.zona, b.por);
    this.avisar('bloqueos');
  }

  /** Se bloqueó (o desbloqueó) una sala de reuniones. */
  bloqueo(zona: string, bloqueada: boolean, por: number): void {
    if (bloqueada) this.bloqueos.set(zona, por);
    else this.bloqueos.delete(zona);
    this.avisar('bloqueos');
  }

  /** Empezó (o terminó, con null) la sesión de enfoque de alguien. Las horas ya vienen en el reloj de este navegador. */
  enfoque(id: number, sesion: SesionEnfoquePublica | null): void {
    const p = this.yo?.id === id ? this.yo : this.otros.get(id);
    if (!p) return;
    if (sesion) p.enfoque = sesion;
    else delete p.enfoque;
    this.avisar('estado');
  }

  limpiar(): void {
    this.yo = null;
    this.bloqueos.clear();
    this.ultimaReaccion = null;
    this.otros.clear();
    this.version++;
    this.avisar('personas');
  }
}
