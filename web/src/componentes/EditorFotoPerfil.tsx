import { ImagePlus, Pencil, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import type { UsuarioPublico } from '@ol/shared';
import { ErrorApi, api, subirArchivo } from '../api';
import { useSesion } from '../estado/sesion';
import { olvidarFotosDe } from '../util/cacheFotos';
import { FOTO_MAX_BYTES, FOTO_TIPOS_ACEPTADOS, cuadroDeRecorte, problemaConArchivo, tieneFoto } from '../util/foto';
import { useAvisos } from './Avisos';
import { Caja } from './Estados';
import { FotoPersona } from './FotoPersona';

const LADO_VISTA = 224;
const LADO_SALIDA = 512;

/** Dibuja el cuadro elegido de la imagen en un lienzo cuadrado. */
function dibujar(lienzo: HTMLCanvasElement, img: HTMLImageElement, lado: number, zoom: number, cx: number, cy: number): void {
  const g = lienzo.getContext('2d');
  if (!g) return;
  const c = cuadroDeRecorte(img.naturalWidth, img.naturalHeight, zoom, cx, cy);
  lienzo.width = lado;
  lienzo.height = lado;
  g.imageSmoothingQuality = 'high';
  g.clearRect(0, 0, lado, lado);
  g.drawImage(img, c.x, c.y, c.lado, c.lado, 0, 0, lado, lado);
}

function aBlob(lienzo: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolver) => {
    lienzo.toBlob((webp) => {
      if (webp && webp.type === 'image/webp') resolver(webp);
      else lienzo.toBlob((png) => resolver(png), 'image/png');
    }, 'image/webp', 0.92);
  });
}

/**
 * Foto de perfil, en Mi cuenta: subir, recortar en cuadrado (arrastrar y zoom), cambiar o quitar.
 * Es solo el ícono de la persona en listas y tarjetas; su personaje del mapa no cambia.
 * El servidor vuelve a validar el archivo por su firma real y lo reduce a 256x256.
 */
export function EditorFotoPerfil() {
  const { usuario, actualizarUsuario } = useSesion();
  const avisos = useAvisos();
  const entrada = useRef<HTMLInputElement>(null);
  const vista = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [centro, setCentro] = useState({ x: 0.5, y: 0.5 });
  const [error, setError] = useState<string | null>(null);
  const [trabajando, setTrabajando] = useState<'guardar' | 'quitar' | null>(null);
  const arrastre = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null);
  const urlTemporal = useRef<string | null>(null);

  const soltarTemporal = useCallback(() => {
    if (urlTemporal.current) URL.revokeObjectURL(urlTemporal.current);
    urlTemporal.current = null;
  }, []);
  useEffect(() => soltarTemporal, [soltarTemporal]);

  useEffect(() => {
    if (img && vista.current) dibujar(vista.current, img, LADO_VISTA, zoom, centro.x, centro.y);
  }, [img, zoom, centro]);

  if (!usuario) return null;
  const conFoto = tieneFoto(usuario.foto);

  const elegirArchivo = (archivo: File | undefined) => {
    if (!archivo) return;
    setError(null);
    const problema = problemaConArchivo(archivo);
    if (problema) {
      setError(problema);
      return;
    }
    soltarTemporal();
    const url = URL.createObjectURL(archivo);
    urlTemporal.current = url;
    const nueva = new Image();
    nueva.onload = () => {
      if (nueva.naturalWidth < 32 || nueva.naturalHeight < 32) {
        setError('Esa imagen es muy pequeña. Elige una de al menos 32 x 32 píxeles.');
        return;
      }
      setZoom(1);
      setCentro({ x: 0.5, y: 0.5 });
      setImg(nueva);
    };
    nueva.onerror = () => setError('No pude abrir esa imagen. Prueba con otra foto JPG, PNG o WebP.');
    nueva.src = url;
  };

  const cancelar = () => {
    setImg(null);
    setError(null);
    soltarTemporal();
    if (entrada.current) entrada.current.value = '';
  };

  const guardar = async () => {
    if (!img) return;
    setError(null);
    setTrabajando('guardar');
    try {
      const salida = document.createElement('canvas');
      dibujar(salida, img, LADO_SALIDA, zoom, centro.x, centro.y);
      const blob = await aBlob(salida);
      if (!blob) throw new ErrorApi(0, 'No pude preparar la foto. Prueba con otra.');
      const r = await subirArchivo<{ usuario: UsuarioPublico }>('/cuenta/foto', blob);
      olvidarFotosDe(r.usuario.id, r.usuario.foto);
      actualizarUsuario(r.usuario);
      avisos.ok('Listo, actualicé tu foto de perfil.');
      cancelar();
    } catch (x) {
      setError(x instanceof ErrorApi ? x.message : 'No se pudo guardar la foto. Intenta de nuevo.');
    } finally {
      setTrabajando(null);
    }
  };

  const quitar = async () => {
    setError(null);
    setTrabajando('quitar');
    try {
      const r = await api<{ usuario: UsuarioPublico }>('/cuenta/foto', { metodo: 'DELETE' });
      olvidarFotosDe(r.usuario.id);
      actualizarUsuario(r.usuario);
      avisos.ok('Quité tu foto de perfil.');
    } catch (x) {
      setError(x instanceof ErrorApi ? x.message : 'No se pudo quitar la foto. Intenta de nuevo.');
    } finally {
      setTrabajando(null);
    }
  };

  // Arrastrar mueve la imagen debajo del círculo: el centro del cuadro se corre al lado contrario.
  const mover = (dx: number, dy: number, base: { cx: number; cy: number }) => {
    if (!img) return;
    const c = cuadroDeRecorte(img.naturalWidth, img.naturalHeight, zoom, base.cx, base.cy);
    const px = c.lado / LADO_VISTA;
    setCentro({ x: Math.min(Math.max(base.cx - (dx * px) / img.naturalWidth, 0), 1), y: Math.min(Math.max(base.cy - (dy * px) / img.naturalHeight, 0), 1) });
  };
  const alBajar = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    arrastre.current = { x: e.clientX, y: e.clientY, cx: centro.x, cy: centro.y };
  };
  const alMover = (e: PointerEvent<HTMLDivElement>) => {
    const a = arrastre.current;
    if (a) mover(e.clientX - a.x, e.clientY - a.y, { cx: a.cx, cy: a.cy });
  };
  const alSoltar = () => {
    arrastre.current = null;
  };
  const alTeclear = (e: KeyboardEvent<HTMLDivElement>) => {
    const paso = 16;
    const mapa: Record<string, [number, number]> = { ArrowLeft: [paso, 0], ArrowRight: [-paso, 0], ArrowUp: [0, paso], ArrowDown: [0, -paso] };
    const d = mapa[e.key];
    if (d) {
      e.preventDefault();
      mover(d[0], d[1], { cx: centro.x, cy: centro.y });
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      setZoom((z) => Math.min(z + 0.2, 4));
    } else if (e.key === '-') {
      e.preventDefault();
      setZoom((z) => Math.max(z - 0.2, 1));
    }
  };

  const tiposAceptados = FOTO_TIPOS_ACEPTADOS.join(',');
  return (
    <div className="foto-editor">
      <div className="foto-editor__vista">
        {img ? (
          <>
            <div
              className="foto-editor__recorte"
              role="group"
              tabIndex={0}
              aria-label="Recorte de la foto. Arrastra para moverla o usa las flechas; con más y menos haces zoom."
              onPointerDown={alBajar}
              onPointerMove={alMover}
              onPointerUp={alSoltar}
              onPointerCancel={alSoltar}
              onKeyDown={alTeclear}
            >
              <canvas ref={vista} width={LADO_VISTA} height={LADO_VISTA} />
            </div>
            <label className="foto-editor__zoom">
              <span className="etiqueta">Zoom</span>
              <input type="range" min={1} max={4} step={0.05} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} aria-label="Zoom de la foto" />
            </label>
          </>
        ) : (
          <FotoPersona id={usuario.id} nombre={usuario.nombre} foto={usuario.foto} tam={112} decorativa />
        )}
      </div>

      <div className="foto-editor__texto">
        {img ? (
          <>
            <p>Mueve la foto dentro del círculo y elige cuánto acercarla. Así la verán en la lista de personas, tu tarjeta y el Planner.</p>
            <div className="foto-editor__acciones">
              <button type="button" className={`btn btn--primario${trabajando === 'guardar' ? ' btn--cargando' : ''}`} onClick={() => void guardar()} disabled={trabajando !== null}>
                <span>Guardar foto</span>
              </button>
              <button type="button" className="btn btn--secundario" onClick={cancelar} disabled={trabajando !== null}>
                Cancelar
              </button>
            </div>
          </>
        ) : (
          <>
            <p>{conFoto ? 'Esta es tu foto de perfil.' : 'Todavía no tienes foto de perfil. Se ve tu inicial.'}</p>
            <p className="campo__ayuda">JPG, PNG o WebP, hasta {FOTO_MAX_BYTES / 1024 / 1024} MB. Es solo tu ícono en listas y tarjetas: en el mapa sigue tu personaje.</p>
            <div className="foto-editor__acciones">
              <button type="button" className="btn btn--secundario" onClick={() => entrada.current?.click()} disabled={trabajando !== null}>
                {conFoto ? <Pencil aria-hidden="true" /> : <ImagePlus aria-hidden="true" />}
                <span>{conFoto ? 'Cambiar foto' : 'Subir una foto'}</span>
              </button>
              {conFoto && (
                <button type="button" className={`btn btn--peligro${trabajando === 'quitar' ? ' btn--cargando' : ''}`} onClick={() => void quitar()} disabled={trabajando !== null}>
                  <Trash2 aria-hidden="true" />
                  <span>Quitar foto</span>
                </button>
              )}
            </div>
          </>
        )}
        <input ref={entrada} type="file" accept={tiposAceptados} hidden onChange={(e) => elegirArchivo(e.target.files?.[0])} />
        {error && <Caja tono="error">{error}</Caja>}
      </div>
    </div>
  );
}
