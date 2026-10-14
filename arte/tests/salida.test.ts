import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
  DIR_JSON_CATALOGO,
  DIR_PNG_PUBLICO,
  Lienzo,
  MARCADORES,
  PALETA,
  codificarPng,
  empaquetar,
  jsonLegible,
  leerPng,
  marcadoresJson,
  publicarAtlas,
  rutaArte,
  rutaRaiz,
  rutaSalida,
} from '../src/nucleo';
import { bloque, carpetaTemporal } from './ayudas';

const tmp = carpetaTemporal('ol-arte-salida-');
afterAll(() => tmp.limpiar());

function atlasDePrueba(): ReturnType<typeof empaquetar> {
  return empaquetar([
    { id: 'silla', lienzo: bloque(32, 32, 'tela-gris-2') },
    { id: 'escritorio', lienzo: bloque(64, 32, 'madera-oscura-2') },
    { id: 'planta', lienzo: bloque(32, 64, 'planta-2') },
  ]);
}

describe('rutas', () => {
  it('rutaRaiz apunta al monorepo: package.json con workspaces y la carpeta arte', () => {
    const raiz = rutaRaiz();
    const paquete = JSON.parse(readFileSync(join(raiz, 'package.json'), 'utf8')) as { workspaces: string[] };
    expect(paquete.workspaces).toContain('arte');
    expect(existsSync(join(raiz, 'arte', 'package.json'))).toBe(true);
    expect(existsSync(join(raiz, 'web'))).toBe(true);
    expect(existsSync(join(raiz, 'shared'))).toBe(true);
  });

  it('rutaArte y rutaSalida cuelgan de la raíz', () => {
    expect(rutaArte()).toBe(join(rutaRaiz(), 'arte'));
    expect(rutaSalida()).toBe(join(rutaRaiz(), 'arte', 'salida'));
    expect(DIR_PNG_PUBLICO).toBe(join('web', 'public', 'assets', 'arte'));
    expect(DIR_JSON_CATALOGO).toBe(join('shared', 'src', 'catalogo'));
  });
});

describe('publicarAtlas', () => {
  it('escribe el PNG y el JSON en sus carpetas, creándolas si faltan', () => {
    const { atlas, frames } = atlasDePrueba();
    const r = publicarAtlas('objetos-v1', atlas, frames, { casilla: 32 }, { raiz: tmp.ruta });
    expect(r.rutaPng).toBe(join(tmp.ruta, 'web', 'public', 'assets', 'arte', 'objetos-v1.png'));
    expect(r.rutaJson).toBe(join(tmp.ruta, 'shared', 'src', 'catalogo', 'objetos-v1.json'));
    expect(statSync(r.rutaPng).isFile()).toBe(true);
    expect(statSync(r.rutaJson).isFile()).toBe(true);
    expect(r.cambiado).toBe(true);
    expect(leerPng(r.rutaPng).igual(atlas)).toBe(true);
  });

  it('el JSON trae version, archivo, huella, medidas, frames y los metadatos', () => {
    const { atlas, frames } = atlasDePrueba();
    const r = publicarAtlas('objetos-v2', atlas, frames, { casilla: 32, categoria: 'mobiliario' }, { raiz: tmp.ruta });
    const json = JSON.parse(readFileSync(r.rutaJson, 'utf8')) as Record<string, unknown>;
    expect(Object.keys(json)).toEqual(['version', 'archivo', 'huella', 'ancho', 'alto', 'frames', 'casilla', 'categoria']);
    expect(json['version']).toBe(1);
    expect(json['archivo']).toBe('objetos-v2.png');
    expect(json['ancho']).toBe(atlas.ancho);
    expect(json['alto']).toBe(atlas.alto);
    expect(json['casilla']).toBe(32);
    expect(json['categoria']).toBe('mobiliario');
    expect(json['frames']).toEqual(frames);
    expect(json['marcadores']).toBeUndefined();
  });

  it('la huella son los primeros 10 caracteres hex del sha1 del PNG escrito', () => {
    const { atlas, frames } = atlasDePrueba();
    const r = publicarAtlas('huella', atlas, frames, {}, { raiz: tmp.ruta });
    const sha1 = createHash('sha1').update(readFileSync(r.rutaPng)).digest('hex');
    expect(r.huella).toMatch(/^[0-9a-f]{10}$/);
    expect(r.huella).toBe(sha1.slice(0, 10));
    expect(r.huella).toBe(createHash('sha1').update(codificarPng(atlas)).digest('hex').slice(0, 10));
    const json = JSON.parse(readFileSync(r.rutaJson, 'utf8')) as { huella: string };
    expect(json.huella).toBe(r.huella);
  });

  it('los frames se escriben ordenados por id, sin importar cómo llegaron', () => {
    const { atlas, frames } = atlasDePrueba();
    const alReves: Record<string, (typeof frames)[string]> = {};
    for (const id of Object.keys(frames).sort().reverse()) alReves[id] = frames[id] as (typeof frames)[string];
    const r1 = publicarAtlas('orden-1', atlas, frames, {}, { raiz: tmp.ruta });
    const r2 = publicarAtlas('orden-1', atlas, alReves, {}, { raiz: tmp.ruta });
    expect(r2.cambiado).toBe(false);
    expect(Object.keys(r1.manifiesto.frames)).toEqual(['escritorio', 'planta', 'silla']);
  });

  it('es determinista: publicar de nuevo no cambia nada', () => {
    const { atlas, frames } = atlasDePrueba();
    const a = publicarAtlas('estable', atlas, frames, { n: 1 }, { raiz: tmp.ruta });
    const bytesPng = readFileSync(a.rutaPng);
    const bytesJson = readFileSync(a.rutaJson);
    const b = publicarAtlas('estable', atlas, frames, { n: 1 }, { raiz: tmp.ruta });
    expect(b.cambiado).toBe(false);
    expect(b.huella).toBe(a.huella);
    expect(readFileSync(b.rutaPng).equals(bytesPng)).toBe(true);
    expect(readFileSync(b.rutaJson).equals(bytesJson)).toBe(true);
    // Un cambio mínimo dentro de un sprite sí se nota.
    const silla = frames['silla'] as { x: number; y: number };
    const c = publicarAtlas('estable', atlas.copiar().px(silla.x, silla.y, 'rojo-3'), frames, { n: 1 }, { raiz: tmp.ruta });
    expect(c.cambiado).toBe(true);
    expect(c.huella).not.toBe(a.huella);
  });

  it('incluye la tabla de marcadores solo si el atlas tiene colores marcador', () => {
    const conMarcadores = empaquetar([{ id: 'cuerpo', lienzo: new Lienzo(32, 48).rect(8, 8, 16, 30, MARCADORES.piel[2]) }]);
    const r = publicarAtlas('personaje-v1', conMarcadores.atlas, conMarcadores.frames, { casilla: 32 }, { raiz: tmp.ruta });
    const json = JSON.parse(readFileSync(r.rutaJson, 'utf8')) as Record<string, unknown>;
    expect(json['marcadores']).toEqual(marcadoresJson());
    expect(r.manifiesto.marcadores?.piel).toEqual([...MARCADORES.piel]);
    expect(Object.keys(r.manifiesto.marcadores ?? {})).toEqual(['piel', 'cabello', 'ropaA', 'ropaB', 'pantalon', 'zapatos', 'accA', 'accB']);

    const sin = atlasDePrueba();
    expect(publicarAtlas('sin-marcadores', sin.atlas, sin.frames, {}, { raiz: tmp.ruta }).manifiesto.marcadores).toBeUndefined();
    // Se puede forzar o impedir.
    const forzado = publicarAtlas('forzado', sin.atlas, sin.frames, {}, { raiz: tmp.ruta, incluirMarcadores: true });
    expect(forzado.manifiesto.marcadores).toEqual(marcadoresJson());
    const impedido = publicarAtlas('impedido', conMarcadores.atlas, conMarcadores.frames, {}, { raiz: tmp.ruta, incluirMarcadores: false });
    expect(impedido.manifiesto.marcadores).toBeUndefined();
  });

  it('rechaza nombres inválidos y metadatos con claves reservadas', () => {
    const { atlas, frames } = atlasDePrueba();
    const opciones = { raiz: tmp.ruta };
    for (const malo of ['', 'Objetos', '../fuera', 'a/b', 'con espacio', '-guion', 'a\\b']) {
      expect(() => publicarAtlas(malo, atlas, frames, {}, opciones), malo).toThrow(/Nombre de atlas inválido/);
    }
    for (const clave of ['version', 'archivo', 'huella', 'ancho', 'alto', 'frames', 'marcadores']) {
      expect(() => publicarAtlas('ok', atlas, frames, { [clave]: 1 }, opciones), clave).toThrow(/reservada/);
    }
  });

  it('valida antes de escribir: un color fuera de la paleta o un píxel suelto impiden publicar', () => {
    const { atlas, frames } = atlasDePrueba();
    const raiz = join(tmp.ruta, 'validacion');
    const silla = frames['silla'] as { x: number; y: number };
    const conColorAjeno = atlas.copiar().px(silla.x + 1, silla.y + 1, '#123456');
    expect(() => publicarAtlas('malo-1', conColorAjeno, frames, {}, { raiz })).toThrow(/no pasa la validación.*#123456/s);
    const conSuelto = atlas.copiar().px(0, 0, 'rojo-3');
    expect(() => publicarAtlas('malo-2', conSuelto, frames, {}, { raiz })).toThrow(/fuera de los marcos/);
    expect(existsSync(join(raiz, 'web'))).toBe(false);
    expect(existsSync(join(raiz, 'shared'))).toBe(false);
  });

  it('la validación se puede ajustar o apagar', () => {
    const { atlas, frames } = atlasDePrueba();
    const raiz = join(tmp.ruta, 'validacion-ajustada');
    const ajeno = atlas.copiar().px(2, 2, '#123456');
    expect(publicarAtlas('apagada', ajeno, frames, {}, { raiz, validar: false }).cambiado).toBe(true);
    expect(publicarAtlas('con-paleta', ajeno, frames, {}, { raiz, validar: { paleta: [...Object.values(PALETA), '#123456'] } }).cambiado).toBe(true);
    // Reglas extra: los tres sprites de prueba miden 32 de alto, pero uno mide 64 de ancho.
    expect(() => publicarAtlas('multiplo', atlas, frames, {}, { raiz, validar: { multiplo: { ancho: 64, alto: 32 } } })).toThrow(/no es múltiplo de 64x32/);
  });

  it('no escribe nada fuera de la raíz indicada', () => {
    const { atlas, frames } = atlasDePrueba();
    const raiz = join(tmp.ruta, 'aislada');
    publicarAtlas('aislado', atlas, frames, {}, { raiz });
    expect(existsSync(join(raiz, 'web', 'public', 'assets', 'arte', 'aislado.png'))).toBe(true);
    expect(existsSync(join(rutaRaiz(), DIR_PNG_PUBLICO, 'aislado.png'))).toBe(false);
    expect(existsSync(join(rutaRaiz(), DIR_JSON_CATALOGO, 'aislado.json'))).toBe(false);
  });
});

describe('jsonLegible', () => {
  it('deja cada objeto o lista plana en una línea y el resto con sangría de 2', () => {
    const texto = jsonLegible({ a: 1, b: [1, 2, 3], c: { x: 1, y: 2 }, d: { n: { x: 1 } }, e: [], f: {}, g: null });
    expect(texto).toBe(
      ['{', '  "a": 1,', '  "b": [1, 2, 3],', '  "c": { "x": 1, "y": 2 },', '  "d": {', '    "n": { "x": 1 }', '  },', '  "e": [],', '  "f": {},', '  "g": null', '}'].join('\n'),
    );
    expect(JSON.parse(texto)).toEqual({ a: 1, b: [1, 2, 3], c: { x: 1, y: 2 }, d: { n: { x: 1 } }, e: [], f: {}, g: null });
  });

  it('omite las claves undefined y rechaza NaN', () => {
    expect(jsonLegible({ a: 1, b: undefined })).toBe('{ "a": 1 }');
    expect(() => jsonLegible({ a: Number.NaN })).toThrow(/NaN/);
  });

  it('escapa cadenas con comillas y acentos sin cambiar su valor', () => {
    const valor = { texto: 'Silla "ejecutiva" de oficina ñandú' };
    expect(JSON.parse(jsonLegible(valor))).toEqual(valor);
  });
});
