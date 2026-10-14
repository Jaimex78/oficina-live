import { BellRing, Gauge, Moon, SlidersHorizontal, Sun, SunMoon, Volume2 } from 'lucide-react';
import { useState, useSyncExternalStore, type ComponentType, type MouseEvent } from 'react';
import { ajustesSonido, sonido } from '../mundo/sonido-global';
import { Interruptor } from '../componentes/Interruptor';
import { Modal } from '../componentes/Modal';
import { useTema, type PreferenciaTema } from '../estado/tema';
import type { ModoRendimiento, ModoVista } from './tipos';
import type { PrefsHud } from './usePrefsHud';
import { CLAVE_MODO_TEAMS, MODOS_TEAMS, modoTeams, type ModoAbrirTeams } from './useTeams';
import { guardarPref } from './preferencias';

export type SeccionConfig = 'general' | 'sonido' | 'notificaciones' | 'rendimiento';

const SECCIONES: { id: SeccionConfig; nombre: string; Icono: ComponentType<{ 'aria-hidden'?: boolean }> }[] = [
  { id: 'general', nombre: 'General', Icono: SlidersHorizontal },
  { id: 'sonido', nombre: 'Sonido', Icono: Volume2 },
  { id: 'notificaciones', nombre: 'Notificaciones', Icono: BellRing },
  { id: 'rendimiento', nombre: 'Rendimiento', Icono: Gauge },
];

const MODOS_COLOR: { valor: PreferenciaTema; nombre: string; Icono: ComponentType<{ 'aria-hidden'?: boolean }> }[] = [
  { valor: 'claro', nombre: 'Luz', Icono: Sun },
  { valor: 'oscuro', nombre: 'Oscuro', Icono: Moon },
  { valor: 'auto', nombre: 'Sistema', Icono: SunMoon },
];

const VISTAS: { valor: ModoVista; nombre: string; detalle: string }[] = [
  { valor: 'simplificado', nombre: 'Simplificado', detalle: 'Siempre un esquema de salas y personas, sin el arte.' },
  { valor: 'inmersivo', nombre: 'Inmersivo', detalle: 'Siempre el arte de la oficina, aunque te alejes.' },
  { valor: 'automatico', nombre: 'Automático', detalle: 'El arte de cerca y el esquema cuando te alejas.' },
];

const OPCIONES_TEAMS: { valor: ModoAbrirTeams; nombre: string; detalle: string }[] = [
  { valor: 'navegador', nombre: 'El navegador', detalle: 'Abre Teams en una pestaña nueva. Es lo recomendado.' },
  { valor: 'app', nombre: 'La aplicación de escritorio', detalle: 'Abre directo la aplicación de Teams instalada en tu computador. Si no la tienes, el navegador te avisará que no puede abrirla.' },
];

const RENDIMIENTOS: { valor: ModoRendimiento; nombre: string; detalle: string }[] = [
  { valor: 'calidad', nombre: 'Calidad', detalle: 'Suma un desenfoque suave detrás de los paneles que flotan y mantiene todas las animaciones.' },
  { valor: 'equilibrado', nombre: 'Equilibrado', detalle: 'Paneles sólidos y animaciones. Es lo recomendado.' },
  { valor: 'eficiente', nombre: 'Eficiente', detalle: 'Paneles sólidos, sin animaciones en la interfaz y con el mapa pequeño actualizándose menos. El mundo baja a 30 cuadros por segundo. Para equipos lentos o con poca batería.' },
];

function Fila({ titulo, detalle, apilada, children }: { titulo: string; detalle?: string; apilada?: boolean; children: React.ReactNode }) {
  return (
    <div className={`hd-config__fila${apilada ? ' hd-config__fila--apilada' : ''}`}>
      <div>
        <p className="hd-config__titulo">{titulo}</p>
        {detalle && <p className="hd-config__detalle">{detalle}</p>}
      </div>
      <div className="hd-config__control">{children}</div>
    </div>
  );
}

function Opciones<T extends string>({ nombre, valor, opciones, alCambiar }: { nombre: string; valor: T; opciones: { valor: T; nombre: string; detalle?: string; Icono?: ComponentType<{ 'aria-hidden'?: boolean }> }[]; alCambiar: (v: T, e: MouseEvent<HTMLButtonElement>) => void }) {
  return (
    <div className={`hd-opciones${opciones.some((o) => o.detalle) ? ' hd-opciones--lista' : ''}`} role="radiogroup" aria-label={nombre}>
      {opciones.map((o) => (
        <button key={o.valor} type="button" role="radio" aria-checked={valor === o.valor} className="hd-opcion" onClick={(e) => alCambiar(o.valor, e)}>
          {o.Icono && <o.Icono aria-hidden={true} />}
          <span className="hd-opcion__texto">
            <span>{o.nombre}</span>
            {o.detalle && <small>{o.detalle}</small>}
          </span>
        </button>
      ))}
    </div>
  );
}

/** Sección «Sonido»: volumen general, tres interruptores y un botón para probar. Los ajustes se guardan en este navegador. */
function SeccionSonido() {
  const a = useSyncExternalStore(ajustesSonido.suscribir, ajustesSonido.leer);
  return (
    <section aria-labelledby="hd-cfg-sonido">
      <h3 id="hd-cfg-sonido" className="hd-config__seccion-titulo">
        Sonido
      </h3>
      <Fila titulo="Volumen general" detalle={`${a.volumen} de 100. El sonido de la oficina es suave y sintetizado.`}>
        <input className="hd-rango" type="range" min={0} max={100} step={1} value={a.volumen} aria-label="Volumen general" onChange={(e) => ajustesSonido.fijar({ volumen: Number(e.target.value) })} />
      </Fila>
      <Fila titulo="Pasos" detalle="Se oyen tus pasos y los de quien camina cerca, según el piso.">
        <Interruptor marcado={a.pasos} onCambio={(v) => ajustesSonido.fijar({ pasos: v })} etiqueta="Sonido de pasos" />
      </Fila>
      <Fila titulo="Asientos y puertas" detalle="Sentarse, levantarse y abrir o cerrar puertas.">
        <Interruptor marcado={a.asientos} onCambio={(v) => ajustesSonido.fijar({ asientos: v })} etiqueta="Sonido de asientos y puertas" />
      </Fila>
      <Fila titulo="Avisos y reacciones" detalle="Mensajes cercanos, campana, reacciones, quien entra o sale, fin de enfoque y salas de reuniones.">
        <Interruptor marcado={a.avisos} onCambio={(v) => ajustesSonido.fijar({ avisos: v })} etiqueta="Sonido de avisos y reacciones" />
      </Fila>
      <Fila titulo="Probar sonido" detalle="Suena una muestra con tus ajustes. Con la pestaña oculta, en modo Eficiente o con la vista esquemática el sonido de la oficina se silencia solo.">
        <button type="button" className="btn btn--secundario" onClick={() => sonido.probar()}>
          Probar sonido
        </button>
      </Fila>
    </section>
  );
}

function permisoNotificaciones(): NotificationPermission | 'no-hay' {
  return typeof Notification === 'undefined' ? 'no-hay' : Notification.permission;
}

/** Configuración de la oficina: solo lo que funciona hoy. Modo de color, mundo, avisos y rendimiento. */
export function Configuracion({ prefs, seccionInicial = 'general', alCerrar }: { prefs: PrefsHud; seccionInicial?: SeccionConfig; alCerrar: () => void }) {
  const [seccion, setSeccion] = useState<SeccionConfig>(seccionInicial);
  const { preferencia, elegir } = useTema();
  const [permiso, setPermiso] = useState(permisoNotificaciones);
  const [abrirTeams, setAbrirTeams] = useState<ModoAbrirTeams>(modoTeams);
  const elegirTeams = (v: ModoAbrirTeams) => {
    if (!MODOS_TEAMS.includes(v)) return;
    setAbrirTeams(v);
    guardarPref(CLAVE_MODO_TEAMS, v); // se guarda en este navegador; se lee al hacer clic en cualquier botón de Teams
  };

  const cambiarColor = (v: PreferenciaTema, e: MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    elegir(v, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
  };

  const alternarAvisosNavegador = async (quiere: boolean) => {
    if (!quiere) {
      prefs.setAvisosNavegador(false);
      return;
    }
    if (typeof Notification === 'undefined') return;
    let p = Notification.permission;
    if (p === 'default') p = await Notification.requestPermission();
    setPermiso(p);
    prefs.setAvisosNavegador(p === 'granted');
  };

  return (
    <Modal titulo="Configuración" onCerrar={alCerrar} clase="hd-config">
      <div className="hd-config__cuerpo">
        <nav className="hd-config__menu" aria-label="Secciones de la configuración">
          <p className="hd-config__grupo">Preferencias</p>
          {SECCIONES.map(({ id, nombre, Icono }) => (
            <button key={id} type="button" className="hd-config__seccion" aria-current={seccion === id ? 'page' : undefined} data-autofoco={seccionInicial === id ? '' : undefined} onClick={() => setSeccion(id)}>
              <Icono aria-hidden={true} />
              {nombre}
            </button>
          ))}
        </nav>

        <div className="hd-config__contenido">
          {seccion === 'general' && (
            <>
              <section aria-labelledby="hd-cfg-apariencia">
                <h3 id="hd-cfg-apariencia" className="hd-config__seccion-titulo">
                  Apariencia
                </h3>
                <Fila titulo="Modo de color" detalle="Elige entre luz, oscuro o que coincida con la preferencia de tu sistema.">
                  <Opciones nombre="Modo de color" valor={preferencia} opciones={MODOS_COLOR} alCambiar={cambiarColor} />
                </Fila>
              </section>
              <section aria-labelledby="hd-cfg-mundo">
                <h3 id="hd-cfg-mundo" className="hd-config__seccion-titulo">
                  Mundo
                </h3>
                <Fila apilada titulo="Vista del mundo" detalle="Cómo se dibuja la oficina al alejarte.">
                  <Opciones nombre="Vista del mundo" valor={prefs.vista} opciones={VISTAS} alCambiar={(v) => prefs.setVista(v)} />
                </Fila>
                <Fila titulo="Mapa pequeño" detalle="Muestra el contorno de la oficina, tu posición y tu radio de cercanía abajo a la izquierda.">
                  <Interruptor marcado={prefs.minimapa} onCambio={prefs.setMinimapa} etiqueta="Mostrar el mapa pequeño" />
                </Fila>
              </section>
              <section aria-labelledby="hd-cfg-teams">
                <h3 id="hd-cfg-teams" className="hd-config__seccion-titulo">
                  Teams
                </h3>
                <Fila apilada titulo="Abrir Teams en" detalle="El audio y el video de la oficina van por Teams. Elige dónde se abren los chats y las llamadas. Se recuerda en este navegador.">
                  <Opciones nombre="Abrir Teams en" valor={abrirTeams} opciones={OPCIONES_TEAMS} alCambiar={elegirTeams} />
                </Fila>
              </section>
            </>
          )}

          {seccion === 'sonido' && <SeccionSonido />}

          {seccion === 'notificaciones' && (
            <section aria-labelledby="hd-cfg-avisos">
              <h3 id="hd-cfg-avisos" className="hd-config__seccion-titulo">
                Avisos
              </h3>
              {permiso !== 'no-hay' && (
                <Fila titulo="Avisos en el navegador" detalle={permiso === 'denied' ? 'El navegador bloqueó los avisos de este sitio. Actívalos desde el candado de la barra de direcciones.' : 'Te avisamos de una tarea nueva del Planner cuando esta pestaña está en segundo plano.'}>
                  <Interruptor marcado={prefs.avisosNavegador && permiso === 'granted'} onCambio={(v) => void alternarAvisosNavegador(v)} etiqueta="Avisos en el navegador" deshabilitado={permiso === 'denied'} />
                </Fila>
              )}
              <Fila titulo="Mensajes de personas cercanas" detalle="Muestra sobre la barra los mensajes que llegan con Enviar cerca.">
                <Interruptor marcado={prefs.burbujas} onCambio={prefs.setBurbujas} etiqueta="Mostrar los mensajes de personas cercanas" />
              </Fila>
            </section>
          )}

          {seccion === 'rendimiento' && (
            <section aria-labelledby="hd-cfg-rend">
              <h3 id="hd-cfg-rend" className="hd-config__seccion-titulo">
                Rendimiento
              </h3>
              <Fila apilada titulo="Modo" detalle="Si la oficina va lenta en tu equipo, prueba Eficiente.">
                <Opciones nombre="Rendimiento" valor={prefs.rendimiento} opciones={RENDIMIENTOS} alCambiar={(v) => prefs.setRendimiento(v)} />
              </Fila>
            </section>
          )}
        </div>
      </div>
    </Modal>
  );
}
