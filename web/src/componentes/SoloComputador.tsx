import { useEffect, useState, type ReactNode } from 'react';
import { Check, Copy, Laptop } from 'lucide-react';
import { MarcaLive } from './MarcaLive';
import '../estilos/solo-computador.css';

/**
 * Oficina Live es solo para computador, por ahora. En un celular (o una pantalla táctil angosta) se muestra
 * esta pantalla en lugar de la plataforma: pide la versión de escritorio del navegador o entrar desde un computador.
 * Con «sitio de escritorio» el navegador del celular manda un ancho de unos 980 px y deja pasar.
 */
export function esCelular(): boolean {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false;
  const telefono = /iPhone|iPod|Android.*Mobile|Mobile.*Firefox|Windows Phone|BlackBerry|Opera Mini/i.test(navigator.userAgent);
  const tactilAngosto = window.matchMedia('(pointer: coarse)').matches && window.innerWidth < 900;
  return telefono || tactilAngosto;
}

export function SoloComputador({ children }: { children: ReactNode }) {
  const [celular, setCelular] = useState(esCelular);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    const revisar = () => setCelular(esCelular());
    window.addEventListener('resize', revisar);
    window.addEventListener('orientationchange', revisar);
    return () => {
      window.removeEventListener('resize', revisar);
      window.removeEventListener('orientationchange', revisar);
    };
  }, []);

  if (!celular) return <>{children}</>;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2500);
    } catch {
      setCopiado(false);
    }
  };

  return (
    <main className="solo-pc" role="alert">
      <div className="solo-pc__tarjeta">
        <MarcaLive altura={26} sobreOscuro />
        <span className="solo-pc__icono" aria-hidden="true">
          <Laptop />
        </span>
        <h1 className="solo-pc__titulo">Oficina Live funciona en computador</h1>
        <p className="solo-pc__texto">Por ahora la oficina solo está disponible en la versión de escritorio. Entra desde un computador, o pide el sitio de escritorio en tu navegador.</p>
        <ul className="solo-pc__pasos">
          <li>
            <strong>Safari (iPhone):</strong> toca <em>aA</em> en la barra de direcciones y elige «Solicitar sitio web de escritorio».
          </li>
          <li>
            <strong>Chrome (Android):</strong> abre el menú de tres puntos y activa «Sitio para computadoras».
          </li>
        </ul>
        <button type="button" className="btn btn--primario solo-pc__copiar" onClick={() => void copiar()}>
          {copiado ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          <span>{copiado ? 'Enlace copiado' : 'Copiar enlace para el computador'}</span>
        </button>
      </div>
    </main>
  );
}
