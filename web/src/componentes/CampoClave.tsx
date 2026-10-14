import { Eye, EyeOff } from 'lucide-react';
import { useId, useState, type ComponentPropsWithRef } from 'react';

interface Props extends Omit<ComponentPropsWithRef<'input'>, 'type'> {
  etiqueta: string;
  ayuda?: string | undefined;
  error?: string | null | undefined;
}

/** Contraseña con «ojito» para verla mientras se escribe. */
export function CampoClave({ etiqueta, ayuda, error, id: idProp, className, ...resto }: Props) {
  const auto = useId();
  const id = idProp ?? auto;
  const [ver, setVer] = useState(false);
  const ids = [ayuda ? `${id}-ayuda` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined;
  return (
    <div className="campo">
      <label className="campo__etiqueta" htmlFor={id}>
        {etiqueta}
      </label>
      <div className="clave">
        <input id={id} className={`entrada ${className ?? ''}`.trim()} type={ver ? 'text' : 'password'} aria-invalid={error ? true : undefined} aria-describedby={ids} autoCapitalize="none" spellCheck={false} {...resto} />
        <button type="button" className="clave__ojo" onClick={() => setVer((v) => !v)} aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={ver}>
          {ver ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </button>
      </div>
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
    </div>
  );
}
