/**
 * Caminos sobre la cuadrícula de paso (1 = bloqueada). Sirve para «tocar para caminar» y para ir hasta un asiento.
 */

export interface Celda {
  x: number;
  y: number;
}

const COSTE_RECTO = 10;
const COSTE_DIAGONAL = 14;

/** Cola de prioridad mínima sobre arreglos planos: suficiente para 120x120 casillas. */
class Monticulo {
  private claves: number[] = [];
  private valores: number[] = [];

  get tamano(): number {
    return this.claves.length;
  }

  meter(clave: number, valor: number): void {
    const c = this.claves;
    const v = this.valores;
    let i = c.length;
    c.push(clave);
    v.push(valor);
    while (i > 0) {
      const padre = (i - 1) >> 1;
      if (c[padre]! <= clave) break;
      c[i] = c[padre]!;
      v[i] = v[padre]!;
      i = padre;
    }
    c[i] = clave;
    v[i] = valor;
  }

  sacar(): number {
    const c = this.claves;
    const v = this.valores;
    const primero = v[0]!;
    const ultimaClave = c.pop()!;
    const ultimoValor = v.pop()!;
    const n = c.length;
    if (n > 0) {
      let i = 0;
      for (;;) {
        let hijo = 2 * i + 1;
        if (hijo >= n) break;
        if (hijo + 1 < n && c[hijo + 1]! < c[hijo]!) hijo++;
        if (c[hijo]! >= ultimaClave) break;
        c[i] = c[hijo]!;
        v[i] = v[hijo]!;
        i = hijo;
      }
      c[i] = ultimaClave;
      v[i] = ultimoValor;
    }
    return primero;
  }
}

/**
 * Camino más corto de una casilla a otra, sin la casilla de partida y con la de llegada.
 * Se permite ir en diagonal solo si las dos casillas de los lados están libres (no se corta esquinas).
 * Devuelve `null` si no hay camino.
 */
export function buscarRuta(bloqueo: Uint8Array, ancho: number, alto: number, desde: Celda, hasta: Celda, maxNodos = 30_000): Celda[] | null {
  const enRango = (x: number, y: number) => x >= 0 && y >= 0 && x < ancho && y < alto;
  if (!enRango(desde.x, desde.y) || !enRango(hasta.x, hasta.y)) return null;
  const meta = hasta.y * ancho + hasta.x;
  const inicio = desde.y * ancho + desde.x;
  if (bloqueo[meta]) return null;
  if (inicio === meta) return [];

  const n = ancho * alto;
  const g = new Float64Array(n).fill(Infinity);
  const padre = new Int32Array(n).fill(-1);
  const cerrado = new Uint8Array(n);
  const cola = new Monticulo();
  const h = (x: number, y: number) => {
    const dx = Math.abs(x - hasta.x);
    const dy = Math.abs(y - hasta.y);
    return COSTE_RECTO * (dx + dy) + (COSTE_DIAGONAL - 2 * COSTE_RECTO) * Math.min(dx, dy);
  };
  g[inicio] = 0;
  cola.meter(h(desde.x, desde.y), inicio);
  let visitados = 0;

  while (cola.tamano > 0 && visitados < maxNodos) {
    const k = cola.sacar();
    if (cerrado[k]) continue;
    cerrado[k] = 1;
    visitados++;
    if (k === meta) {
      const ruta: Celda[] = [];
      for (let c = k; c !== inicio; c = padre[c]!) ruta.push({ x: c % ancho, y: Math.floor(c / ancho) });
      return ruta.reverse();
    }
    const x = k % ancho;
    const y = (k - x) / ancho;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (!enRango(nx, ny)) continue;
        const nk = ny * ancho + nx;
        if (bloqueo[nk] || cerrado[nk]) continue;
        const diagonal = dx !== 0 && dy !== 0;
        if (diagonal && (bloqueo[y * ancho + nx] || bloqueo[ny * ancho + x])) continue;
        const nuevo = g[k]! + (diagonal ? COSTE_DIAGONAL : COSTE_RECTO);
        if (nuevo < g[nk]!) {
          g[nk] = nuevo;
          padre[nk] = k;
          cola.meter(nuevo + h(nx, ny), nk);
        }
      }
    }
  }
  return null;
}

/**
 * Desde una casilla, la casilla alcanzable caminando que queda más cerca de un objetivo (aunque el objetivo esté bloqueado).
 * Sirve para «ir hacia» un escritorio o una pared tocándolos.
 */
export function masCercanoAlcanzable(bloqueo: Uint8Array, ancho: number, alto: number, desde: Celda, objetivo: Celda): Celda | null {
  if (desde.x < 0 || desde.y < 0 || desde.x >= ancho || desde.y >= alto) return null;
  const visto = new Uint8Array(ancho * alto);
  const pila: number[] = [desde.y * ancho + desde.x];
  visto[pila[0]!] = 1;
  let mejor: Celda | null = null;
  let mejorD = Infinity;
  while (pila.length > 0) {
    const k = pila.pop()!;
    const x = k % ancho;
    const y = (k - x) / ancho;
    const d = (x - objetivo.x) ** 2 + (y - objetivo.y) ** 2;
    if (d < mejorD) {
      mejorD = d;
      mejor = { x, y };
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= ancho || ny >= alto) continue;
      const nk = ny * ancho + nx;
      if (visto[nk] || bloqueo[nk]) continue;
      visto[nk] = 1;
      pila.push(nk);
    }
  }
  return mejor;
}
