/**
 * Utilidades de color sin dependencias: hex, RGB y OKLCH.
 *
 * OKLCH se usa para generar rampas (`rampa5`) porque sus pasos de
 * luminosidad se perciben parejos, algo que HSL no logra.
 * Todo es determinista: mismas entradas, mismos bytes.
 */

const HEX_6 = /^#[0-9a-fA-F]{6}$/;

/** ¿Es una cadena `#RRGGBB`? (mayúsculas o minúsculas). */
export function esHex(valor: string): boolean {
  return HEX_6.test(valor);
}

/** Devuelve el hex en mayúsculas o lanza un error con el valor recibido. */
export function normalizarHex(valor: string): string {
  if (!HEX_6.test(valor)) {
    throw new Error(`Color hex inválido: "${valor}". Se espera el formato #RRGGBB.`);
  }
  return valor.toUpperCase();
}

/** `#RRGGBB` a `[r, g, b]` (0 a 255). */
export function hexARgb(hex: string): [number, number, number] {
  const h = normalizarHex(hex);
  return [
    Number.parseInt(h.slice(1, 3), 16),
    Number.parseInt(h.slice(3, 5), 16),
    Number.parseInt(h.slice(5, 7), 16),
  ];
}

function aByte(valor: number): number {
  return Math.min(255, Math.max(0, Math.round(valor)));
}

/** `r, g, b` (0 a 255, se redondean y recortan) a `#RRGGBB` en mayúsculas. */
export function rgbAHex(r: number, g: number, b: number): string {
  const parte = (v: number): string => aByte(v).toString(16).padStart(2, '0');
  return `#${parte(r)}${parte(g)}${parte(b)}`.toUpperCase();
}

/** Luminancia relativa (WCAG) de 0 a 1. Sirve para elegir texto claro u oscuro. */
export function luminancia(hex: string): number {
  const [r, g, b] = hexARgb(hex);
  const lineal = (v: number): number => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lineal(r) + 0.7152 * lineal(g) + 0.0722 * lineal(b);
}

/** Distancia euclidiana entre dos colores en RGB (0 a ~441). */
export function distanciaRgb(a: string, b: string): number {
  const [r1, g1, b1] = hexARgb(a);
  const [r2, g2, b2] = hexARgb(b);
  return Math.hypot(r1 - r2, g1 - g2, b1 - b2);
}

/** Mezcla lineal en RGB: `t = 0` da `a`, `t = 1` da `b`. */
export function mezclarHex(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexARgb(a);
  const [r2, g2, b2] = hexARgb(b);
  return rgbAHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

// ---------------------------------------------------------------------------
// OKLab / OKLCH
// ---------------------------------------------------------------------------

/** Color en OKLCH: luminosidad `L` (0 a 1), croma `C` y matiz `h` en grados. */
export interface Oklch {
  L: number;
  C: number;
  h: number;
}

function aLineal(v: number): number {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function deLineal(c: number): number {
  const v = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
  return v * 255;
}

/** `#RRGGBB` a OKLCH. */
export function hexAOklch(hex: string): Oklch {
  const [r8, g8, b8] = hexARgb(hex);
  const r = aLineal(r8);
  const g = aLineal(g8);
  const b = aLineal(b8);

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const C = Math.hypot(A, B);
  // Con croma casi nulo el matiz no significa nada: se fija en 0.
  const h = C < 1e-4 ? 0 : ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360;
  return { L, C, h };
}

function oklabALinealRgb(L: number, A: number, B: number): [number, number, number] {
  const l_ = L + 0.3963377774 * A + 0.2158037573 * B;
  const m_ = L - 0.1055613458 * A - 0.0638541728 * B;
  const s_ = L - 0.0894841775 * A - 1.291485548 * B;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

function enGama(rgb: [number, number, number]): boolean {
  const margen = 0.5 / 255;
  return rgb.every((c) => c >= -margen && c <= 1 + margen);
}

/**
 * OKLCH a `#RRGGBB`. Si el color cae fuera del rango sRGB, baja el croma
 * (sin tocar `L` ni `h`) hasta que cabe. Así los tonos extremos no se
 * deforman en otro matiz.
 */
export function oklchAHex(L: number, C: number, h: number): string {
  const rad = (h * Math.PI) / 180;
  const a = Math.cos(rad);
  const b = Math.sin(rad);
  const lc = Math.min(1, Math.max(0, L));

  let rgb = oklabALinealRgb(lc, C * a, C * b);
  if (!enGama(rgb)) {
    let bajo = 0;
    let alto = Math.max(0, C);
    for (let i = 0; i < 24; i++) {
      const medio = (bajo + alto) / 2;
      if (enGama(oklabALinealRgb(lc, medio * a, medio * b))) bajo = medio;
      else alto = medio;
    }
    rgb = oklabALinealRgb(lc, bajo * a, bajo * b);
  }
  return rgbAHex(deLineal(rgb[0]), deLineal(rgb[1]), deLineal(rgb[2]));
}
