import { randomBytes, randomInt, scrypt, timingSafeEqual } from 'node:crypto';

/** Contraseñas con scrypt (incluido en Node, sin dependencias nativas). Formato: scrypt$N$r$p$sal$hash */

const LARGO_CLAVE = 32;
const R = 8;
const P = 1;

function derivar(clave: string, sal: Buffer, n: number, r: number, p: number, largo: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(clave.normalize('NFKC'), sal, largo, { N: n, r, p, maxmem: 256 * n * r }, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

export async function hashear(clave: string, n = 2 ** 15): Promise<string> {
  const sal = randomBytes(16);
  const hash = await derivar(clave, sal, n, R, P, LARGO_CLAVE);
  return `scrypt$${n}$${R}$${P}$${sal.toString('base64url')}$${hash.toString('base64url')}`;
}

export async function verificar(clave: string, guardado: string): Promise<boolean> {
  const partes = guardado.split('$');
  if (partes.length !== 6 || partes[0] !== 'scrypt') return false;
  const [, n, r, p, sal, hash] = partes as [string, string, string, string, string, string];
  try {
    const esperado = Buffer.from(hash, 'base64url');
    const calculado = await derivar(clave, Buffer.from(sal, 'base64url'), Number(n), Number(r), Number(p), esperado.length);
    return calculado.length === esperado.length && timingSafeEqual(calculado, esperado);
  } catch {
    return false;
  }
}

/** Devuelve el motivo por el que la contraseña no sirve, o null si sirve. */
export function motivoClaveInvalida(clave: string, minimo: number): string | null {
  if (clave.length < minimo) return `La contraseña debe tener al menos ${minimo} caracteres.`;
  if (clave.length > 128) return 'La contraseña admite hasta 128 caracteres.';
  if (clave.toLowerCase() === clave || clave.toUpperCase() === clave || !/\d/.test(clave)) {
    return 'Usa mayúsculas, minúsculas y al menos un número.';
  }
  return null;
}

const MAYUSCULAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const MINUSCULAS = 'abcdefghijkmnpqrstuvwxyz';
const NUMEROS = '23456789';

function elegir(alfabeto: string): string {
  return alfabeto[randomInt(alfabeto.length)] as string;
}

/** Contraseña temporal sin caracteres que se confundan (0/O, 1/l/I). Siempre cumple la política. */
export function claveTemporal(minimo = 10): string {
  const largo = Math.max(12, minimo);
  const todos = MAYUSCULAS + MINUSCULAS + NUMEROS;
  const caracteres = [elegir(MAYUSCULAS), elegir(MINUSCULAS), elegir(NUMEROS)];
  while (caracteres.length < largo) caracteres.push(elegir(todos));
  for (let i = caracteres.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [caracteres[i], caracteres[j]] = [caracteres[j] as string, caracteres[i] as string];
  }
  return caracteres.join('');
}
