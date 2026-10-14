import { Check, Circle } from 'lucide-react';

/** Reglas de la contraseña con un medidor de cuántas cumple. Son las mismas que valida el servidor. */
export function reglasDeClave(clave: string, minimo: number): { texto: string; cumple: boolean }[] {
  return [
    { texto: `Al menos ${minimo} caracteres`, cumple: clave.length >= minimo },
    { texto: 'Una mayúscula', cumple: /[A-ZÁÉÍÓÚÑ]/.test(clave) },
    { texto: 'Una minúscula', cumple: /[a-záéíóúñ]/.test(clave) },
    { texto: 'Un número', cumple: /\d/.test(clave) },
  ];
}

export function ReglasClave({ clave, minimo }: { clave: string; minimo: number }) {
  const reglas = reglasDeClave(clave, minimo);
  const cumplidas = reglas.filter((r) => r.cumple).length;
  const nivel = clave === '' ? 0 : cumplidas;
  return (
    <div className="reglas-clave" aria-live="polite">
      <div className="reglas-clave__medidor" role="img" aria-label={`Contraseña: cumple ${cumplidas} de ${reglas.length} reglas`}>
        {reglas.map((_, i) => (
          <span key={i} className={i < nivel ? `activa n${nivel}` : ''} />
        ))}
      </div>
      <ul>
        {reglas.map((r) => (
          <li key={r.texto} className={r.cumple ? 'cumple' : ''}>
            {r.cumple ? <Check aria-hidden="true" /> : <Circle aria-hidden="true" />}
            <span>{r.texto}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
