import Phaser from 'phaser';
import { useEffect, useRef } from 'react';
import { EscenaOficina } from './escena';
import type { Puente } from './puente';

/** Monta el motor del mundo dentro de un contenedor y lo desmonta al salir. Phaser no se entera de React: todo pasa por el puente. */
export function Mundo({ puente }: { puente: Puente }) {
  const contenedor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let juego: Phaser.Game | null = null;
    let cancelado = false;
    let quitarGestos = (): void => undefined;
    // En desarrollo React monta, desmonta y vuelve a montar: esperar un cuadro evita crear el motor dos veces.
    let cuadro = 0;
    // Las tipografías de la marca deben estar cargadas antes de que el motor dibuje textos, o salen con la de respaldo.
    const fuentes = Promise.all([document.fonts.load('600 11px "Inter Variable"'), document.fonts.load('700 11px "Inter Variable"')]).catch(() => undefined);
    void fuentes.then(() => {
      if (cancelado) return;
      cuadro = requestAnimationFrame(crearJuego);
    });
    const crearJuego = () => {
      const padre = contenedor.current;
      if (cancelado || !padre) return;
      juego = new Phaser.Game({
        type: Phaser.AUTO,
        parent: padre,
        backgroundColor: '#090a0e',
        // El mínimo evita que un contenedor sin tamaño (por ejemplo, oculto un instante) rompa el dibujo.
        scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%', min: { width: 64, height: 64 } },
        pixelArt: true,
        disableContextMenu: true,
        banner: false,
        audio: { noAudio: true },
        render: { antialias: false, roundPixels: true, powerPreference: 'high-performance' },
        input: { windowEvents: true },
        fps: { target: 60 },
      });
      juego.scene.add('oficina', EscenaOficina, true, { puente });
      // El trackpad no debe hacer zoom de la página ni rebotar: el zoom del mundo es automático (o botones al construir).
      const sinZoomDePagina = (e: Event) => e.preventDefault();
      padre.addEventListener('wheel', sinZoomDePagina, { passive: false });
      padre.addEventListener('gesturestart', sinZoomDePagina);
      padre.addEventListener('gesturechange', sinZoomDePagina);
      quitarGestos = () => {
        padre.removeEventListener('wheel', sinZoomDePagina);
        padre.removeEventListener('gesturestart', sinZoomDePagina);
        padre.removeEventListener('gesturechange', sinZoomDePagina);
      };
    };
    return () => {
      quitarGestos();
      cancelado = true;
      cancelAnimationFrame(cuadro);
      juego?.destroy(true);
      juego = null;
    };
  }, [puente]);

  return <div ref={contenedor} className="mundo__lienzo" />;
}
