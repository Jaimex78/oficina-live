import { comprimirMapa, descomprimirMapa, type AvatarSpec, type Colocacion, type Lugar, type MapaGuardado, type MapaOficina, type Problema } from '@ol/shared';
import { api } from '../api';

export interface OficinaPublicada {
  numero: number;
  mapa: MapaOficina;
  creadoEn: string;
}

export interface Construccion {
  publicado: { numero: number; creadoEn: string; autor: string };
  borrador: { revision: number; mapa: MapaOficina; actualizadoEn: string; autor: string } | null;
}

export interface VersionMapa {
  id: number;
  numero: number;
  autor: string;
  nota: string;
  creadoEn: string;
  vigente: boolean;
}

/** La versión publicada: la que ve todo el mundo. */
export async function pedirOficina(): Promise<OficinaPublicada> {
  const r = await api<{ numero: number; mapa: MapaGuardado; creadoEn: string }>('/oficina');
  return { numero: r.numero, mapa: descomprimirMapa(r.mapa), creadoEn: r.creadoEn };
}

/** Lo que necesita quien construye: la versión publicada y su borrador, si hay uno. */
export async function pedirConstruccion(): Promise<Construccion> {
  const r = await api<{
    publicado: Construccion['publicado'];
    borrador: { revision: number; mapa: MapaGuardado; actualizadoEn: string; autor: string } | null;
  }>('/oficina/construccion');
  return { publicado: r.publicado, borrador: r.borrador ? { ...r.borrador, mapa: descomprimirMapa(r.borrador.mapa) } : null };
}

export async function guardarBorradorEnServidor(revision: number | null, mapa: MapaOficina): Promise<{ revision: number; problemas: Problema[] }> {
  return api<{ revision: number; problemas: Problema[] }>('/oficina/borrador', { metodo: 'PUT', cuerpo: { revision, mapa: comprimirMapa(mapa) } });
}

export async function descartarBorrador(): Promise<void> {
  await api('/oficina/borrador', { metodo: 'DELETE' });
}

export async function publicarMapa(nota: string): Promise<{ numero: number }> {
  return api<{ numero: number }>('/oficina/publicar', { metodo: 'POST', cuerpo: { nota } });
}

export async function pedirVersiones(): Promise<VersionMapa[]> {
  const r = await api<{ versiones: VersionMapa[] }>('/oficina/versiones');
  return r.versiones;
}

export async function restaurarVersion(id: number): Promise<void> {
  await api(`/oficina/versiones/${id}/restaurar`, { metodo: 'POST' });
}

export interface PersonaAsignable {
  id: number;
  usuario: string;
  nombre: string;
  cargo: string;
  /** Versión de su foto de perfil (0 o ausente: no tiene). */
  foto?: number;
}

/** Las cuentas a las que se les puede dar un área (solo quien construye). */
export async function pedirPersonas(): Promise<PersonaAsignable[]> {
  const r = await api<{ personas: PersonaAsignable[] }>('/oficina/personas');
  return r.personas;
}

/** Una persona de la organización, con o sin conexión. Sin correos ni datos privados. */
export interface MiembroOficina {
  id: number;
  nombre: string;
  apodo: string;
  cargo: string;
  lugar: Lugar;
  /** Versión de su foto de perfil (0: no tiene). */
  foto: number;
  avatar: AvatarSpec | null;
  enLinea: boolean;
}

/** Todas las personas activas de la organización (cualquiera que pueda entrar a la oficina la pide). */
export async function pedirMiembros(): Promise<MiembroOficina[]> {
  const r = await api<{ miembros: MiembroOficina[] }>('/oficina/miembros');
  return r.miembros;
}

/** Guarda lo que la persona dejó en su área. Se publica en el acto como una versión nueva. */
export async function guardarArea(idSala: string, idArea: string, base: number, colocaciones: Colocacion[]): Promise<{ numero: number; mapa: MapaOficina }> {
  const r = await api<{ numero: number; mapa: MapaGuardado }>(`/oficina/areas/${encodeURIComponent(idSala)}/${encodeURIComponent(idArea)}`, { metodo: 'PUT', cuerpo: { base, colocaciones } });
  return { numero: r.numero, mapa: descomprimirMapa(r.mapa) };
}
