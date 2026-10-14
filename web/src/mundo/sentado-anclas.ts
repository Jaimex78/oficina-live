import { datosSentado, type Asiento, type DatosSentado, type ObjetoCatalogo } from '@ol/shared';

/** Píxeles bajo el borde de arriba de la casilla donde están los pies de una persona de pie (el centro de la casilla). */
export const PIES_EN_CASILLA = 24;

/** Los datos de sentado del asiento `a` (familia del objeto + ajuste del objeto, ver `shared/src/sentado.ts`). */
export const datosDeAsiento = (o: Pick<ObjetoCatalogo, 'id' | 'orientaciones' | 'sentado'> | undefined, a: Pick<Asiento, 'mira'>): DatosSentado =>
  datosSentado(o ?? { id: '', orientaciones: ['U'], sentado: undefined }, a.mira);

/** Dónde apoya los pies (en píxeles del mundo) quien se sienta en la casilla del asiento `a`. */
export const piesSentado = (a: Pick<Asiento, 'x' | 'y'>, d: Pick<DatosSentado, 'dx' | 'dy'>, casilla: number): { x: number; y: number } => ({
  x: a.x * casilla + casilla / 2 + d.dx,
  y: a.y * casilla + PIES_EN_CASILLA + d.dy,
});
