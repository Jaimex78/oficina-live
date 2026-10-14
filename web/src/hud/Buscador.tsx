import { CornerDownLeft, type LucideIcon } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { FotoPersona } from '../componentes/FotoPersona';

export interface ResultadoBusqueda {
  id: string;
  grupo: 'Acciones' | 'Personas' | 'Teams' | 'Lugares';
  titulo: string;
  detalle?: string;
  Icono: LucideIcon;
  /** Si el resultado es una persona: su foto de perfil (o su inicial) hace de ícono en vez del genérico. */
  persona?: { id: number; nombre: string; foto?: number | undefined };
  /** Texto extra que también cuenta al buscar (cargo, tipo de zona). */
  claves?: string;
  /** Solo aparece al escribir algo (por ejemplo, los chats de Teams: hay uno por persona). */
  soloAlBuscar?: boolean;
  alElegir: () => void;
}

const sinTildes = (t: string): string => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const GRUPOS: ResultadoBusqueda['grupo'][] = ['Acciones', 'Personas', 'Teams', 'Lugares'];

/** Cuadro de búsqueda ⌘K: acciones, personas y lugares del mapa. Flechas para moverse, Enter para elegir, Esc para cerrar. */
export function Buscador({ resultados, marcador, alCerrar }: { resultados: ResultadoBusqueda[]; marcador: string; alCerrar: () => void }) {
  const [consulta, setConsulta] = useState('');
  const [activo, setActivo] = useState(0);
  const idLista = useId();
  const campo = useRef<HTMLInputElement>(null);
  const lista = useRef<HTMLDivElement>(null);

  const visibles = useMemo(() => {
    const q = sinTildes(consulta.trim());
    const filtrados = q ? resultados.filter((r) => sinTildes(`${r.titulo} ${r.detalle ?? ''} ${r.claves ?? ''}`).includes(q)) : resultados.filter((r) => !r.soloAlBuscar);
    // Sin texto se muestran pocos de cada grupo; al escribir, más.
    const tope = q ? 8 : 5;
    return GRUPOS.flatMap((g) => filtrados.filter((r) => r.grupo === g).slice(0, tope));
  }, [consulta, resultados]);

  useEffect(() => setActivo(0), [consulta]);
  useEffect(() => {
    const previo = document.activeElement as HTMLElement | null;
    campo.current?.focus();
    return () => previo?.focus?.();
  }, []);
  useEffect(() => {
    lista.current?.querySelector<HTMLElement>('[data-activo="1"]')?.scrollIntoView({ block: 'nearest' });
  }, [activo, visibles]);

  const elegir = (r: ResultadoBusqueda | undefined) => {
    if (!r) return;
    alCerrar();
    r.alElegir();
  };

  const alTeclear = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      alCerrar();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActivo((a) => (visibles.length ? (a + 1) % visibles.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActivo((a) => (visibles.length ? (a - 1 + visibles.length) % visibles.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      elegir(visibles[activo]);
    } else if (e.key === 'Tab') {
      e.preventDefault();
    }
  };

  let grupoAnterior = '';
  return (
    <div className="hd-velo" onMouseDown={(e) => e.target === e.currentTarget && alCerrar()}>
      <div className="hd-buscador" role="dialog" aria-modal="true" aria-label="Buscar en la oficina" onKeyDown={alTeclear}>
        <input
          ref={campo}
          className="hd-buscador__campo"
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls={idLista}
          aria-activedescendant={visibles[activo] ? `${idLista}-${visibles[activo].id}` : undefined}
          aria-autocomplete="list"
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          placeholder={marcador}
          autoComplete="off"
          spellCheck={false}
        />
        <div ref={lista} id={idLista} className="hd-buscador__lista" role="listbox" aria-label="Resultados">
          {visibles.length === 0 && <p className="hd-buscador__vacio">No encontré nada con esas palabras.</p>}
          {visibles.map((r, i) => {
            const cab = r.grupo !== grupoAnterior;
            grupoAnterior = r.grupo;
            return (
              <div key={r.id} role="presentation">
                {cab && <p className="hd-buscador__grupo">{r.grupo}</p>}
                <div id={`${idLista}-${r.id}`} role="option" aria-selected={i === activo} data-activo={i === activo ? '1' : undefined} className="hd-resultado" onMouseMove={() => setActivo(i)} onClick={() => elegir(r)}>
                  {r.persona ? (
                    <FotoPersona id={r.persona.id} nombre={r.persona.nombre} foto={r.persona.foto} className="hd-resultado__foto" decorativa />
                  ) : (
                    <span className="hd-resultado__icono" aria-hidden="true">
                      <r.Icono />
                    </span>
                  )}
                  <span className="hd-resultado__titulo">{r.titulo}</span>
                  {r.detalle && <span className="hd-resultado__detalle">{r.detalle}</span>}
                </div>
              </div>
            );
          })}
        </div>
        <footer className="hd-buscador__pie">
          <span>
            Cerrar <kbd>Esc</kbd>
          </span>
          <span>
            Seleccionar{' '}
            <kbd aria-label="Enter">
              <CornerDownLeft aria-hidden="true" />
            </kbd>
          </span>
        </footer>
      </div>
    </div>
  );
}
