import { Check, Copy, Download, Mail } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { DESCRIPCION_ROL, ETIQUETA_ROL, PAQUETES_ACCESO, ROLES, type EnlaceActivacion, type ResultadoLote, type Rol, type UsuarioAdmin } from '@ol/shared';
import { ErrorApi, api } from '../api';
import { formatoFecha } from '../util/formato';
import { Campo, CampoSeleccion, CampoTexto } from './Campo';
import { Caja } from './Estados';
import { GRUPOS_PAQUETES } from './CuentaModales';
import { Modal } from './Modal';

/** La dirección completa del enlace, con el sitio desde el que la administración está trabajando. */
export function urlDeEnlace(e: EnlaceActivacion): string {
  return `${window.location.origin}/activar?token=${e.token}`;
}

async function copiarTexto(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false; // si el navegador no deja copiar, el texto queda seleccionable en pantalla
  }
}

function BotonCopiar({ texto, etiqueta = 'Copiar enlace', chico }: { texto: string; etiqueta?: string; chico?: boolean }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button
      type="button"
      className={`btn btn--secundario${chico ? ' btn--chico' : ''}`}
      onClick={async () => {
        if (await copiarTexto(texto)) {
          setCopiado(true);
          setTimeout(() => setCopiado(false), 2500);
        }
      }}
    >
      {copiado ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      {copiado ? 'Copiado' : etiqueta}
    </button>
  );
}

/** Texto de ayuda del envío por correo, que todavía no existe. */
export const TEXTO_CORREO_NO_DISPONIBLE = 'Disponible cuando se configure el correo del servidor';

// ---------- crear un perfil ----------

export function ModalNuevoPerfil({ inicial, onCreado, onCerrar }: { inicial?: Partial<{ nombre: string; correo: string; cargo: string }>; onCreado: (u: UsuarioAdmin, e: EnlaceActivacion) => void; onCerrar: () => void }) {
  const [v, setV] = useState<{ nombre: string; correo: string; cargo: string; rol: Rol; acceso: string[] }>({ nombre: '', correo: '', cargo: '', rol: 'usuario', acceso: [], ...inicial });
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const r = await api<{ usuario: UsuarioAdmin; enlace: EnlaceActivacion }>('/admin/usuarios/perfil', { metodo: 'POST', cuerpo: v });
      onCreado(r.usuario, r.enlace);
    } catch (x) {
      setError(x instanceof ErrorApi ? x.message : 'No se pudo crear el perfil. Intenta de nuevo.');
      setEnviando(false);
    }
  };

  return (
    <Modal titulo="Crear perfil" descripcion="La persona crea su propia contraseña con un enlace de un solo uso. Tú no la ves nunca." onCerrar={onCerrar} bloqueante={enviando}>
      <form onSubmit={guardar} noValidate>
        <Campo etiqueta="Nombre completo" value={v.nombre} onChange={(e) => setV({ ...v, nombre: e.target.value })} autoComplete="off" />
        <Campo etiqueta="Correo de la organización" type="email" value={v.correo} onChange={(e) => setV({ ...v, correo: e.target.value })} autoComplete="off" ayuda="Es el que usará para ingresar, el mismo de su cuenta de Teams." />
        <div className="campo-fila">
          <CampoSeleccion etiqueta="Rol" value={v.rol} onChange={(e) => setV({ ...v, rol: e.target.value as Rol })} ayuda={DESCRIPCION_ROL[v.rol]}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ETIQUETA_ROL[r]}
              </option>
            ))}
          </CampoSeleccion>
          <Campo etiqueta="Cargo" value={v.cargo} onChange={(e) => setV({ ...v, cargo: e.target.value })} autoComplete="off" />
        </div>
        <fieldset className="acceso">
          <legend>Paquetes de acceso (opcional)</legend>
          {GRUPOS_PAQUETES.map(({ grupo, titulo }) => (
            <div key={grupo} className="acceso__grupo">
              <h4>{titulo}</h4>
              {PAQUETES_ACCESO.filter((p) => p.grupo === grupo).map((p) => (
                <label key={p.id} className="ed-check" title={p.descripcion}>
                  <input type="checkbox" checked={v.acceso.includes(p.id)} onChange={(e) => setV({ ...v, acceso: e.target.checked ? [...v.acceso, p.id] : v.acceso.filter((x) => x !== p.id) })} />
                  <span>{p.nombre}</span>
                </label>
              ))}
            </div>
          ))}
        </fieldset>
        {error && <Caja tono="error">{error}</Caja>}
        <div className="modal__pie">
          <button type="button" className="btn btn--secundario" onClick={onCerrar} disabled={enviando}>
            Cancelar
          </button>
          <button type="submit" className={`btn btn--primario${enviando ? ' btn--cargando' : ''}`} disabled={enviando}>
            <span>Crear perfil y generar enlace</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ---------- mostrar el enlace (una sola vez) ----------

export function ModalEnlace({ cuenta, enlace, onCerrar }: { cuenta: UsuarioAdmin; enlace: EnlaceActivacion; onCerrar: () => void }) {
  const url = urlDeEnlace(enlace);
  return (
    <Modal
      titulo="Enlace de activación"
      descripcion={`${cuenta.nombre} · ${cuenta.correo}`}
      onCerrar={onCerrar}
      bloqueante
      pie={
        <button type="button" className="btn btn--primario" onClick={onCerrar} data-autofoco="">
          Listo, ya lo copié
        </button>
      }
    >
      <p className="texto-2" style={{ marginBottom: 'var(--s3)' }}>
        Compártelo por un canal privado. La persona lo abre, crea su contraseña y entra.
      </p>
      <div className="clave-temporal">
        <code style={{ wordBreak: 'break-all', fontSize: '0.8125rem', letterSpacing: 0 }}>{url}</code>
      </div>
      <div style={{ display: 'flex', gap: 'var(--s3)', alignItems: 'center', flexWrap: 'wrap', marginTop: 'var(--s3)' }}>
        <BotonCopiar texto={url} />
        <button type="button" className="btn btn--secundario" disabled aria-describedby="correo-no-disponible">
          <Mail aria-hidden="true" />
          Enviar por correo
        </button>
        <small id="correo-no-disponible" className="campo__ayuda">
          {TEXTO_CORREO_NO_DISPONIBLE}
        </small>
      </div>
      <div style={{ marginTop: 'var(--s4)' }}>
        <Caja tono="aviso">
          Se muestra una sola vez: el servidor no guarda el enlace, solo su huella. Sirve un solo uso y vence el {formatoFecha(enlace.vence)}. Si se pierde, genera uno nuevo desde la cuenta.
        </Caja>
      </div>
    </Modal>
  );
}

// ---------- creación en lote ----------

const EJEMPLO = 'Ana Ruiz, ana.ruiz@empresa.com, persona\nCamilo Torres, camilo.torres@empresa.com, constructor';

function csv(resultados: ResultadoLote[]): string {
  const celda = (t: string) => `"${t.replace(/"/g, '""')}"`;
  const filas = resultados.filter((r) => r.ok && r.enlace).map((r) => [r.nombre, r.correo, ETIQUETA_ROL[r.rol as Rol] ?? r.rol, urlDeEnlace(r.enlace!), r.enlace!.vence].map(celda).join(','));
  return `﻿${['Nombre', 'Correo', 'Rol', 'Enlace', 'Vence'].map(celda).join(',')}\n${filas.join('\n')}\n`;
}

export function ModalLote({ onCerrar, onCreadas }: { onCerrar: () => void; onCreadas: () => void }) {
  const [texto, setTexto] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [resultados, setResultados] = useState<ResultadoLote[] | null>(null);

  const crear = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const r = await api<{ resultados: ResultadoLote[] }>('/admin/usuarios/lote', { metodo: 'POST', cuerpo: { texto } });
      setResultados(r.resultados);
      onCreadas();
    } catch (x) {
      setError(x instanceof ErrorApi ? x.message : 'No se pudo crear el lote. Intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  const descargar = () => {
    if (!resultados) return;
    const url = URL.createObjectURL(new Blob([csv(resultados)], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'enlaces-de-activacion.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  if (resultados) {
    const buenas = resultados.filter((r) => r.ok);
    return (
      <Modal
        titulo="Enlaces creados"
        descripcion={`${buenas.length} de ${resultados.length} perfiles creados`}
        onCerrar={onCerrar}
        bloqueante
        ancho
        pie={
          <>
            <button type="button" className="btn btn--secundario" onClick={descargar} disabled={buenas.length === 0}>
              <Download aria-hidden="true" />
              Descargar CSV
            </button>
            <button type="button" className="btn btn--primario" onClick={onCerrar} data-autofoco="">
              Listo, ya los copié
            </button>
          </>
        }
      >
        <div className="tabla-caja">
          <table className="tabla">
            <caption className="sr-only">Resultado de la creación en lote</caption>
            <thead>
              <tr>
                <th scope="col">Persona</th>
                <th scope="col">Rol</th>
                <th scope="col">Enlace</th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((r) => (
                <tr key={r.linea}>
                  <td>
                    <div className="tabla__nombre">{r.nombre || '(sin nombre)'}</div>
                    <div className="tabla__sec">{r.correo || 'sin correo'}</div>
                  </td>
                  <td>{ETIQUETA_ROL[r.rol as Rol] ?? r.rol}</td>
                  <td>{r.ok && r.enlace ? <BotonCopiar texto={urlDeEnlace(r.enlace)} chico /> : <span className="campo__error">Línea {r.linea}: {r.error}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 'var(--s4)' }}>
          <Caja tono="aviso">Los enlaces se muestran una sola vez. El CSV se genera en tu navegador y no se guarda en el servidor: bórralo cuando termines de repartirlos.</Caja>
        </div>
      </Modal>
    );
  }

  return (
    <Modal titulo="Crear varios perfiles" descripcion="Una persona por línea: Nombre, correo, rol. El rol es opcional (persona, constructor o administración)." onCerrar={onCerrar} bloqueante={enviando} ancho>
      <form onSubmit={crear} noValidate>
        <CampoTexto etiqueta="Lista de personas" rows={9} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={EJEMPLO} spellCheck={false} />
        {error && <Caja tono="error">{error}</Caja>}
        <div className="modal__pie">
          <button type="button" className="btn btn--secundario" onClick={onCerrar} disabled={enviando}>
            Cancelar
          </button>
          <button type="submit" className={`btn btn--primario${enviando ? ' btn--cargando' : ''}`} disabled={enviando || !texto.trim()}>
            <span>Crear perfiles y generar enlaces</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
