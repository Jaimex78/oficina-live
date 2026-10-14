/**
 * Ropa premium (decisión de diseño, 2026-10-10): lo básico es libre para todo el mundo (cabello, vello, arriba, abajo, zapatos
 * y cerca del 60 % de cada una de chaquetas, sombreros, gafas y «Otro»). Lo demás lo elige solo quien tenga el paquete «Ropa premium»
 * que asigna la administración.
 * Catálogo v5 (reducido): chaqueta 2 de 5 (40 %), sombrero 2 de 4, gafas 2 de 4 y Otro 2 de 4 (50 %, lo más cercano al 40 % con 4 piezas).
 * El catálogo publicado marca estas partes con `premium: true`; el servidor y el creador lo respetan.
 */

export const PREMIUM: ReadonlySet<string> = new Set([
  // Chaquetas (2 de 5)
  'chaqueta-abrigo',
  'chaqueta-cardigan',
  // Sombreros (2 de 4)
  'acc-boina',
  'acc-audifonos',
  // Gafas (2 de 4)
  'acc-gafas-cuadradas',
  'acc-gafas-sin-marco',
  // Otro (2 de 4)
  'acc-auriculares-cuello',
  'acc-capa',
]);
