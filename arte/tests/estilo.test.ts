import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { rutaArte } from '../src/nucleo';

const IGNORAR = new Set(['node_modules', 'salida', '.vite', 'dist', 'coverage']);
const EXTENSIONES_DE_TEXTO = new Set(['.ts', '.md', '.json', '.js', '.mjs', '.txt']);

function archivosDeTexto(dir: string): string[] {
  const salida: string[] = [];
  for (const nombre of readdirSync(dir)) {
    if (IGNORAR.has(nombre)) continue;
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) salida.push(...archivosDeTexto(ruta));
    else if (EXTENSIONES_DE_TEXTO.has(extname(nombre))) salida.push(ruta);
  }
  return salida;
}

describe('reglas de estilo del paquete arte', () => {
  const raiz = rutaArte();
  const archivos = archivosDeTexto(raiz);

  it('encuentra el código, las pruebas y el README', () => {
    const relativos = archivos.map((a) => relative(raiz, a));
    expect(relativos).toContain('README.md');
    expect(relativos).toContain(join('src', 'nucleo', 'lienzo.ts'));
    expect(relativos).toContain(join('tests', 'lienzo.test.ts'));
  });

  it('ningún texto ni comentario usa rayas largas ni medias (la prueba arma el patrón con códigos para no romper la regla ella misma)', () => {
    const prohibidos = new RegExp(`[${String.fromCharCode(0x2013)}${String.fromCharCode(0x2014)}]`);
    const infractores: string[] = [];
    for (const archivo of archivos) {
      readFileSync(archivo, 'utf8')
        .split('\n')
        .forEach((linea, i) => {
          if (prohibidos.test(linea)) infractores.push(`${relative(raiz, archivo)}:${i + 1}`);
        });
    }
    expect(infractores).toEqual([]);
  });

  it('los archivos de código del núcleo declaran qué hacen en un comentario inicial', () => {
    const nucleo = archivos.filter((a) => a.includes(join('src', 'nucleo')) && a.endsWith('.ts') && !a.endsWith('index.ts'));
    expect(nucleo.length).toBeGreaterThanOrEqual(10);
    for (const archivo of nucleo) {
      const inicio = readFileSync(archivo, 'utf8').trimStart();
      expect(inicio.startsWith('/**'), relative(raiz, archivo)).toBe(true);
    }
  });
});
