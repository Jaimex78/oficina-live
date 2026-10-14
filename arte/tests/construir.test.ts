import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { Lienzo, empaquetar, leerPng } from '../src/nucleo';
import { RegistroConstructores, constructoresRegistrados, construirTodo } from '../src/construir';
import { bloque, carpetaTemporal } from './ayudas';

const tmp = carpetaTemporal('ol-arte-construir-');
afterAll(() => tmp.limpiar());

describe('RegistroConstructores', () => {
  it('ejecuta los constructores en el orden en que se registraron', async () => {
    const registro = new RegistroConstructores();
    const orden: string[] = [];
    registro.registrar('segundo-nombre-pero-primero', () => void orden.push('a'));
    registro.registrar('b', async () => {
      await Promise.resolve();
      orden.push('b');
    });
    registro.registrar('c', () => void orden.push('c'));
    const mensajes: string[] = [];
    const resultados = await registro.construirTodo({ dirSalida: tmp.ruta, escribir: (l) => mensajes.push(l) });
    expect(orden).toEqual(['a', 'b', 'c']);
    expect(resultados.map((r) => r.nombre)).toEqual(['segundo-nombre-pero-primero', 'b', 'c']);
    expect(resultados.every((r) => r.ok)).toBe(true);
    expect(mensajes.filter((m) => m.includes('listo'))).toHaveLength(3);
    expect(registro.nombres()).toEqual(['segundo-nombre-pero-primero', 'b', 'c']);
  });

  it('un error en un constructor no frena a los demás y queda anotado', async () => {
    const registro = new RegistroConstructores();
    const ejecutados: string[] = [];
    registro.registrar('bien-1', () => void ejecutados.push('bien-1'));
    registro.registrar('mal', () => {
      throw new Error('se rompió el arte');
    });
    registro.registrar('mal-async', async () => {
      await Promise.resolve();
      throw new Error('también async');
    });
    registro.registrar('bien-2', () => void ejecutados.push('bien-2'));
    const mensajes: string[] = [];
    const resultados = await registro.construirTodo({ escribir: (l) => mensajes.push(l), dirSalida: tmp.ruta });
    expect(ejecutados).toEqual(['bien-1', 'bien-2']);
    expect(resultados.map((r) => r.ok)).toEqual([true, false, false, true]);
    expect(resultados[1]?.error).toBe('se rompió el arte');
    expect(resultados[2]?.error).toBe('también async');
    expect(mensajes.some((m) => m.includes('[mal] FALLÓ: se rompió el arte'))).toBe(true);
  });

  it('solo ejecuta los pedidos y avisa si uno no existe', async () => {
    const registro = new RegistroConstructores();
    const corridos: string[] = [];
    for (const n of ['uno', 'dos', 'tres']) registro.registrar(n, () => void corridos.push(n));
    const resultados = await registro.construirTodo({ solo: ['tres', 'uno'], escribir: () => undefined, dirSalida: tmp.ruta });
    expect(corridos).toEqual(['uno', 'tres']);
    expect(resultados).toHaveLength(2);
    await expect(registro.construirTodo({ solo: ['cuatro'], escribir: () => undefined })).rejects.toThrow(/No existe el constructor "cuatro".*uno, dos, tres/);
  });

  it('rechaza nombres vacíos o repetidos', () => {
    const registro = new RegistroConstructores();
    registro.registrar('x', () => undefined);
    expect(() => registro.registrar('x', () => undefined)).toThrow(/Ya hay un constructor/);
    expect(() => registro.registrar('  ', () => undefined)).toThrow(/necesita un nombre/);
    registro.limpiar();
    expect(registro.nombres()).toEqual([]);
  });

  it('ctx.publicarAtlas solo escribe cuando se pidió publicar', async () => {
    const registro = new RegistroConstructores();
    const resultados: Array<unknown> = [];
    registro.registrar('publica', (ctx) => {
      const { atlas, frames } = empaquetar([{ id: 'silla', lienzo: bloque(32, 32, 'tela-gris-2') }]);
      resultados.push(ctx.publicarAtlas('prueba-v1', atlas, frames, { casilla: 32 }));
    });
    const raiz = join(tmp.ruta, 'publicacion');
    const mensajes: string[] = [];
    await registro.construirTodo({ dirSalida: tmp.ruta, raizPublicacion: raiz, escribir: (l) => mensajes.push(l) });
    expect(resultados[0]).toBeNull();
    expect(existsSync(join(raiz, 'web'))).toBe(false);
    expect(mensajes.join('\n')).toMatch(/no se publica \(usa --publicar\)/);

    await registro.construirTodo({ dirSalida: tmp.ruta, raizPublicacion: raiz, publicar: true, escribir: (l) => mensajes.push(l) });
    const publicado = resultados[1] as { rutaPng: string; rutaJson: string; huella: string };
    expect(publicado.rutaPng).toBe(join(raiz, 'web', 'public', 'assets', 'arte', 'prueba-v1.png'));
    expect(existsSync(publicado.rutaJson)).toBe(true);
    expect(mensajes.join('\n')).toContain(`publicado (${publicado.huella}`);
  });

  it('el contexto guarda PNG y hojas en la carpeta de salida y pasa la bandera de publicar', async () => {
    const registro = new RegistroConstructores();
    const visto: { publicar?: boolean; dir?: string } = {};
    registro.registrar('con-contexto', (ctx) => {
      visto.publicar = ctx.publicar;
      visto.dir = ctx.dirSalida;
      ctx.guardarPng('sub/bloque.png', bloque(8, 8, 'rojo-3'));
      ctx.guardarHoja('hoja.png', [{ id: 'a', lienzo: bloque(32, 32, 'metal-2') }], { escala: 1 });
    });
    const dir = join(tmp.ruta, 'ctx');
    await registro.construirTodo({ dirSalida: dir, escribir: () => undefined });
    expect(visto).toEqual({ publicar: false, dir });
    expect(leerPng(join(dir, 'sub', 'bloque.png')).igual(bloque(8, 8, 'rojo-3'))).toBe(true);
    expect(leerPng(join(dir, 'hoja.png')).ancho).toBeGreaterThanOrEqual(32);
    await registro.construirTodo({ dirSalida: dir, publicar: true, escribir: () => undefined });
    expect(visto.publicar).toBe(true);
  });
});

describe('registro global', () => {
  it('trae registrado el demo del estilo de referencia', () => {
    expect(constructoresRegistrados()).toContain('demo-estilo-referencia');
  });

  it('construirTodo con el demo escribe la hoja en la carpeta pedida y no publica nada', async () => {
    const dir = join(tmp.ruta, 'global');
    const mensajes: string[] = [];
    const resultados = await construirTodo({ solo: ['demo-estilo-referencia'], dirSalida: dir, escribir: (l) => mensajes.push(l) });
    expect(resultados).toHaveLength(1);
    expect(resultados[0]?.ok).toBe(true);
    const ruta = join(dir, 'demo-nucleo.png');
    expect(existsSync(ruta)).toBe(true);
    const hoja = leerPng(ruta);
    expect(hoja).toBeInstanceOf(Lienzo);
    expect(hoja.ancho).toBeGreaterThan(300);
    expect(mensajes.join('\n')).toContain('sprites validados');
  });
});
