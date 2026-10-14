import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

type Tipo = 'ok' | 'error' | 'info';
interface Aviso {
  id: number;
  tipo: Tipo;
  texto: string;
  accion?: AccionAviso;
}

/** Un botón dentro del aviso («Abrir chat de Teams»). */
export interface AccionAviso {
  texto: string;
  alElegir: () => void;
}

interface ContextoAvisos {
  ok(texto: string): void;
  error(texto: string): void;
  info(texto: string, accion?: AccionAviso): void;
}

const Ctx = createContext<ContextoAvisos | null>(null);

/** Avisos breves abajo a la derecha. Los de error duran más y se anuncian como alerta. */
export function AvisosProvider({ children }: { children: ReactNode }) {
  const [lista, setLista] = useState<Aviso[]>([]);
  const siguiente = useRef(0);

  const quitar = useCallback((id: number) => setLista((l) => l.filter((a) => a.id !== id)), []);
  const poner = useCallback(
    (tipo: Tipo, texto: string, accion?: AccionAviso) => {
      const id = ++siguiente.current;
      setLista((l) => [...l.slice(-3), { id, tipo, texto, ...(accion ? { accion } : {}) }]);
      setTimeout(() => quitar(id), tipo === 'error' ? 9000 : accion ? 8000 : 5000);
    },
    [quitar],
  );

  const valor = useMemo<ContextoAvisos>(() => ({ ok: (t) => poner('ok', t), error: (t) => poner('error', t), info: (t, a) => poner('info', t, a) }), [poner]);

  return (
    <Ctx.Provider value={valor}>
      {children}
      <div className="avisos" aria-label="Avisos">
        {lista.map((a) => {
          const Icono = a.tipo === 'ok' ? CircleCheck : a.tipo === 'error' ? CircleAlert : Info;
          return (
            <div key={a.id} className={`aviso-emergente${a.tipo === 'error' ? ' aviso-emergente--error' : ''}`} role={a.tipo === 'error' ? 'alert' : 'status'}>
              <Icono aria-hidden="true" />
              <span>{a.texto}</span>
              {a.accion && (
                <button
                  type="button"
                  className="aviso-emergente__accion"
                  onClick={() => {
                    quitar(a.id);
                    a.accion?.alElegir();
                  }}
                >
                  {a.accion.texto}
                </button>
              )}
              <button type="button" onClick={() => quitar(a.id)} aria-label="Cerrar aviso">
                <X aria-hidden="true" size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}

export function useAvisos(): ContextoAvisos {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAvisos debe usarse dentro de AvisosProvider');
  return c;
}
