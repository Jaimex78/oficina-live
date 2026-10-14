import type { OrdenesEscena, Puente } from '../mundo/puente';
import type { VistaEsquema } from '../mundo/tipos';

/**
 * El contrato entre la interfaz flotante (HUD) y el motor del mundo vive en `mundo/puente.ts`.
 * Aquí quedan los tipos propios de la interfaz y unos ayudantes para llamarlo sin romperse si algo del motor aún no está.
 */

export type { EventoRuta, Seleccion, ModoRendimiento } from '../mundo/puente';
export type { MensajeChat } from '../mundo/red';
export type { VistaEsquema };

export type ModoVista = 'simplificado' | 'inmersivo' | 'automatico';

/** Simplificado = esquema siempre; Inmersivo = arte siempre; Automático = esquema solo al alejar mucho. */
export const VISTA_ESQUEMA_DE: Record<ModoVista, VistaEsquema> = { simplificado: 'forzada', inmersivo: 'apagada', automatico: 'auto' };

/** Las órdenes del motor, todas opcionales: la interfaz se defiende si el motor todavía no las tiene. */
export const ordenesDe = (p: Puente): Partial<OrdenesEscena> => p.ordenes ?? {};

export const DISTANCIA_CERCANIA_POR_DEFECTO = 3;
export const CHAT_MAX_POR_DEFECTO = 280;

export const distanciaCercania = (p: Puente): number => p.ajustes?.distanciaCercania ?? DISTANCIA_CERCANIA_POR_DEFECTO;
export const chatMaximo = (p: Puente): number => p.ajustes?.chatMax ?? CHAT_MAX_POR_DEFECTO;

export function fijarVistaEsquema(p: Puente, modo: ModoVista): void {
  p.almacen.set({ vistaEsquema: VISTA_ESQUEMA_DE[modo] });
}
