import { Bell, CheckCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificaciones } from '../planner/useNotificaciones';
import { hace } from '../planner/util';
import { useSesion } from '../estado/sesion';

/** La campana de avisos: cuántos hay sin leer y la lista. Tocar uno te lleva a donde pasó (por ejemplo, la tarea del Planner). */
export function Campana({ variante = 'menu' }: { variante?: 'menu' | 'oficina' }) {
  const { usuario } = useSesion();
  const n = useNotificaciones(Boolean(usuario));
  const [abierta, setAbierta] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const navegar = useNavigate();

  useEffect(() => {
    if (!abierta) return;
    const fuera = (e: MouseEvent) => !raiz.current?.contains(e.target as Node) && setAbierta(false);
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && setAbierta(false);
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('mousedown', fuera);
      document.removeEventListener('keydown', tecla);
    };
  }, [abierta]);

  if (!usuario) return null;

  return (
    <div className={`campana campana--${variante}`} ref={raiz}>
      <button type="button" className={variante === 'oficina' ? 'ed-btn' : 'campana__boton'} onClick={() => setAbierta((a) => !a)} aria-label={n.sinLeer > 0 ? `Avisos, ${n.sinLeer} sin leer` : 'Avisos'} aria-expanded={abierta} aria-haspopup="dialog" title="Avisos">
        <Bell aria-hidden="true" />
        {n.sinLeer > 0 && <span className="campana__cuenta">{n.sinLeer > 9 ? '9+' : n.sinLeer}</span>}
      </button>
      {abierta && (
        <div className="campana__panel" role="dialog" aria-label="Avisos">
          <header>
            <h2>Avisos</h2>
            <button type="button" className="campana__todas" onClick={() => void n.leerTodas()} disabled={n.sinLeer === 0}>
              <CheckCheck aria-hidden="true" />
              Marcar todos
            </button>
          </header>
          {n.lista.length === 0 ? (
            <p className="campana__vacio">Todavía no tienes avisos. Cuando te asignen una tarea, te lo decimos aquí.</p>
          ) : (
            <ul>
              {n.lista.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    className={`campana__aviso${a.leida ? '' : ' campana__aviso--nuevo'}`}
                    onClick={() => {
                      void n.leer(a.id);
                      setAbierta(false);
                      if (a.enlace) navegar(a.enlace);
                    }}
                  >
                    <strong>{a.titulo}</strong>
                    {a.texto && <span>{a.texto}</span>}
                    <small>{hace(a.creadaEn)}</small>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
