/** La reacción «salta» al aparecer: crece de la mitad a un poco más que su tamaño y se asienta. */
export function escalaDeAparicion(k: number): number {
  if (k < 0.15) return 0.5 + (k / 0.15) * 0.7;
  if (k < 0.3) return 1.2 - ((k - 0.15) / 0.15) * 0.2;
  return 1;
}

/** Opacidad: plena casi todo el tiempo y se apaga en el último tercio. */
export function opacidadDeReaccion(k: number): number {
  return k < 0.65 ? 1 : Math.max(0, 1 - (k - 0.65) / 0.35);
}
