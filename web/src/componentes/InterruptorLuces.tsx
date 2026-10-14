import { Moon, Sun, SunMoon } from 'lucide-react';
import type { MouseEvent } from 'react';
import { useTema, type PreferenciaTema } from '../estado/tema';

function centro(e: MouseEvent<HTMLElement>): { x: number; y: number } {
  const r = e.currentTarget.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

const OPCIONES: { valor: PreferenciaTema; nombre: string; detalle: string; Icono: typeof Sun }[] = [
  { valor: 'claro', nombre: 'Luces encendidas', detalle: 'Se prenden las luces y se abren las ventanas.', Icono: Sun },
  { valor: 'oscuro', nombre: 'Luces apagadas', detalle: 'Como cuando se apagan las luces.', Icono: Moon },
  { valor: 'auto', nombre: 'Automático', detalle: 'Sigue el modo de tu equipo.', Icono: SunMoon },
];

export function descripcionLuces(p: PreferenciaTema): string {
  return OPCIONES.find((o) => o.valor === p)?.detalle ?? '';
}

/** Tres opciones: encendidas (claro), apagadas (oscuro) y automático. */
export function InterruptorLuces() {
  const { preferencia, elegir } = useTema();
  return (
    <div className="luces" role="group" aria-label="Luces de la oficina">
      {OPCIONES.map(({ valor, nombre, Icono }) => (
        <button
          key={valor}
          type="button"
          aria-pressed={preferencia === valor}
          aria-label={nombre}
          title={nombre}
          onClick={(e) => elegir(valor, centro(e))}
        >
          <Icono aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

/** Un solo botón que alterna: para el ingreso, donde no hay menú. */
export function BotonLuces() {
  const { tema, alternar } = useTema();
  const apagar = tema === 'claro';
  return (
    <button type="button" className="luces-uno" onClick={(e) => alternar(centro(e))} aria-label={apagar ? 'Apagar las luces' : 'Prender las luces'} title={apagar ? 'Apagar las luces' : 'Prender las luces'}>
      {apagar ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
    </button>
  );
}
