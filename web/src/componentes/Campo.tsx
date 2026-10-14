import { useId, type ComponentPropsWithRef } from 'react';

interface Comun {
  etiqueta: string;
  ayuda?: string | undefined;
  error?: string | null | undefined;
}

function descripcion(id: string, ayuda?: string, error?: string | null): string | undefined {
  const ids = [ayuda ? `${id}-ayuda` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ');
  return ids || undefined;
}

function Pie({ id, ayuda, error }: { id: string; ayuda?: string | undefined; error?: string | null | undefined }) {
  return (
    <>
      {ayuda && (
        <p id={`${id}-ayuda`} className="campo__ayuda">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="campo__error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}

export function Campo({ etiqueta, ayuda, error, id: idProp, className, ...resto }: Comun & ComponentPropsWithRef<'input'>) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <div className="campo">
      <label className="campo__etiqueta" htmlFor={id}>
        {etiqueta}
      </label>
      <input id={id} className={`entrada ${className ?? ''}`.trim()} aria-invalid={error ? true : undefined} aria-describedby={descripcion(id, ayuda, error)} {...resto} />
      <Pie id={id} ayuda={ayuda} error={error} />
    </div>
  );
}

export function CampoSeleccion({ etiqueta, ayuda, error, id: idProp, className, children, ...resto }: Comun & ComponentPropsWithRef<'select'>) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <div className="campo">
      <label className="campo__etiqueta" htmlFor={id}>
        {etiqueta}
      </label>
      <select id={id} className={`entrada ${className ?? ''}`.trim()} aria-invalid={error ? true : undefined} aria-describedby={descripcion(id, ayuda, error)} {...resto}>
        {children}
      </select>
      <Pie id={id} ayuda={ayuda} error={error} />
    </div>
  );
}

export function CampoTexto({ etiqueta, ayuda, error, id: idProp, className, ...resto }: Comun & ComponentPropsWithRef<'textarea'>) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <div className="campo">
      <label className="campo__etiqueta" htmlFor={id}>
        {etiqueta}
      </label>
      <textarea id={id} className={`entrada ${className ?? ''}`.trim()} aria-invalid={error ? true : undefined} aria-describedby={descripcion(id, ayuda, error)} {...resto} />
      <Pie id={id} ayuda={ayuda} error={error} />
    </div>
  );
}
