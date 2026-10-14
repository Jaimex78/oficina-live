/** Interruptor tipo iOS. Es un checkbox con rol «switch», así que funciona con teclado y lector de pantalla. */
export function Interruptor({ id, marcado, onCambio, etiqueta, deshabilitado }: { id?: string; marcado: boolean; onCambio: (valor: boolean) => void; etiqueta: string; deshabilitado?: boolean }) {
  return (
    <span className="interruptor">
      <input id={id} type="checkbox" role="switch" checked={marcado} aria-label={etiqueta} disabled={deshabilitado} onChange={(e) => onCambio(e.target.checked)} />
      <span className="interruptor__pista" aria-hidden="true" />
    </span>
  );
}
