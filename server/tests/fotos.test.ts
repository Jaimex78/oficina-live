import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { LimiteFotos, tipoPorFirma } from '../src/fotos/servicio';
import { crearEntorno, cliente, sesionComo, type Entorno } from './ayudas';

type Sesion = Awaited<ReturnType<typeof sesionComo>>;

async function jpegConExif(ancho = 600, alto = 300): Promise<Buffer> {
  return sharp({ create: { width: ancho, height: alto, channels: 3, background: { r: 200, g: 40, b: 40 } } })
    .jpeg()
    .withExif({ IFD0: { Copyright: 'dato-privado-de-prueba' } })
    .toBuffer();
}

async function png(ancho = 64, alto = 64): Promise<Buffer> {
  return sharp({ create: { width: ancho, height: alto, channels: 4, background: { r: 0, g: 90, b: 200, alpha: 1 } } }).png().toBuffer();
}

describe('foto de perfil', () => {
  let env: Entorno;
  let ana: Sesion;
  let beto: Sesion;
  let jefa: Sesion;
  let dirFotos: string;

  beforeAll(async () => {
    env = await crearEntorno();
    ana = await sesionComo(env, 'ana', 'usuario');
    beto = await sesionComo(env, 'beto', 'usuario');
    jefa = await sesionComo(env, 'jefa', 'admin');
    dirFotos = path.join(env.dir, 'fotos');
  });
  afterAll(async () => {
    await env.cerrar();
  });

  const archivos = (): string[] => (fs.existsSync(dirFotos) ? fs.readdirSync(dirFotos) : []);
  const subir = (s: Sesion, cuerpo: Buffer, tipo = 'image/jpeg') => s.api.put('/api/cuenta/foto').set('Content-Type', tipo).send(cuerpo);

  it('una foto válida se reduce a 256x256 cuadrada, sin metadatos EXIF, y queda en la carpeta de datos', async () => {
    const original = await jpegConExif();
    expect((await sharp(original).metadata()).exif).toBeDefined();

    const r = await subir(ana, original);
    expect(r.status).toBe(200);
    expect(r.body.usuario.foto).toBeGreaterThan(0);

    const guardados = archivos();
    expect(guardados).toHaveLength(1);
    expect(guardados[0]).toMatch(/^[0-9a-f]{32}\.webp$/);
    const bytes = fs.readFileSync(path.join(dirFotos, guardados[0]!));
    const meta = await sharp(bytes).metadata();
    expect(meta.format).toBe('webp');
    expect(meta.width).toBe(256);
    expect(meta.height).toBe(256);
    expect(meta.exif).toBeUndefined();
    expect(bytes.includes(Buffer.from('dato-privado-de-prueba'))).toBe(false);
  });

  it('la foto aparece en la sesión, en la lista de cuentas y en el Planner', async () => {
    const yo = await ana.api.get('/api/cuenta');
    const version = yo.body.usuario.foto as number;
    expect(version).toBeGreaterThan(0);
    const lista = await jefa.api.get('/api/admin/usuarios');
    const fila = (lista.body.usuarios as { usuario: string; foto: number }[]).find((u) => u.usuario === 'ana');
    expect(fila?.foto).toBe(version);
    const planner = await jefa.api.get('/api/planner');
    const persona = (planner.body.personas as { usuario: string; foto?: number }[]).find((p) => p.usuario === 'ana');
    expect(persona?.foto).toBe(version);
  });

  it('se lee con sesión, con ETag y caché privado; con la versión correcta es inmutable', async () => {
    const id = ana.cuenta.id;
    const version = (await ana.api.get('/api/cuenta')).body.usuario.foto as number;
    const r = await beto.api.get(`/api/fotos/${id}?v=${version}`).buffer(true).parse((res, cb) => {
      const trozos: Buffer[] = [];
      res.on('data', (t: Buffer) => trozos.push(t));
      res.on('end', () => cb(null, Buffer.concat(trozos)));
    });
    expect(r.status).toBe(200);
    expect(r.headers['content-type']).toBe('image/webp');
    expect(r.headers['x-content-type-options']).toBe('nosniff');
    expect(r.headers['cache-control']).toBe('private, max-age=31536000, immutable');
    expect((await sharp(r.body as Buffer).metadata()).width).toBe(256);

    const etag = r.headers['etag'] as string;
    expect(etag).toBeTruthy();
    const igual = await beto.api.get(`/api/fotos/${id}?v=${version}`).set('If-None-Match', etag);
    expect(igual.status).toBe(304);

    const sinVersion = await beto.api.get(`/api/fotos/${id}`);
    expect(sinVersion.status).toBe(200);
    expect(sinVersion.headers['cache-control']).toBe('private, no-cache');
    const vieja = await beto.api.get(`/api/fotos/${id}?v=${version - 1}`);
    expect(vieja.headers['cache-control']).toBe('private, no-cache');
  });

  it('la lectura exige sesión', async () => {
    const id = ana.cuenta.id;
    const sin = await cliente(env.app).get(`/api/fotos/${id}`);
    expect(sin.status).toBe(401);
    const falsa = await cliente(env.app, 'token-falso').get(`/api/fotos/${id}`);
    expect(falsa.status).toBe(401);
    // Sin la cabecera propia tampoco hay un camino de lectura anónimo: la carpeta no se sirve como archivos estáticos.
    const estatico = await request(env.app).get('/fotos/x.webp');
    expect(estatico.status).toBe(404);
  });

  it('quien no tiene foto da 404', async () => {
    expect((await ana.api.get(`/api/fotos/${jefa.cuenta.id}`)).status).toBe(404);
    expect((await ana.api.get('/api/fotos/9999')).status).toBe(404);
    expect((await ana.api.get('/api/fotos/abc')).status).toBe(404);
  });

  it('reemplazar borra el archivo anterior y sube la versión', async () => {
    const antes = archivos();
    const v1 = (await ana.api.get('/api/cuenta')).body.usuario.foto as number;
    const r = await subir(ana, await png(), 'image/png');
    expect(r.status).toBe(200);
    expect(r.body.usuario.foto).toBeGreaterThan(v1);
    const despues = archivos();
    expect(despues).toHaveLength(1);
    expect(despues[0]).not.toBe(antes[0]);
  });

  it('un WebP también se acepta', async () => {
    const webp = await sharp({ create: { width: 90, height: 40, channels: 3, background: '#33aa55' } }).webp().toBuffer();
    const r = await subir(beto, webp, 'image/webp');
    expect(r.status).toBe(200);
    const nombre = archivos().find((a) => a !== archivos()[0]);
    expect(nombre).toBeTruthy();
  });

  it('borrar quita el archivo, deja la foto en 0 y la versión nunca vuelve atrás', async () => {
    const v = (await ana.api.get('/api/cuenta')).body.usuario.foto as number;
    const r = await ana.api.delete('/api/cuenta/foto');
    expect(r.status).toBe(200);
    expect(r.body.usuario.foto).toBe(0);
    expect((await ana.api.get(`/api/fotos/${ana.cuenta.id}`)).status).toBe(404);
    expect(archivos()).toHaveLength(1); // solo queda la de beto
    const fila = await env.ctx.prisma.usuario.findUnique({ where: { id: ana.cuenta.id } });
    expect(fila?.fotoArchivo).toBe('');
    expect(fila!.fotoVersion).toBeGreaterThan(v);
    // Borrar sin foto no falla.
    expect((await ana.api.delete('/api/cuenta/foto')).status).toBe(200);
    // Una foto nueva usa una versión que nunca se había usado.
    const nueva = await subir(ana, await png(), 'image/png');
    expect(nueva.body.usuario.foto).toBeGreaterThan(fila!.fotoVersion);
  });

  it('un archivo de texto o un ejecutable con extensión de imagen se rechaza por su firma', async () => {
    const antes = archivos().length;
    const texto = await subir(ana, Buffer.from('esto no es una imagen, solo texto'), 'image/jpeg');
    expect(texto.status).toBe(415);
    const exe = Buffer.concat([Buffer.from('MZ'), Buffer.alloc(500, 1)]);
    const r = await subir(ana, exe, 'image/png');
    expect(r.status).toBe(415);
    const svg = await subir(ana, Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'), 'image/png');
    expect(svg.status).toBe(415);
    expect(archivos()).toHaveLength(antes);
  });

  it('una imagen cortada o con firma falsa también se rechaza', async () => {
    const buena = await jpegConExif(200, 200);
    const cortada = buena.subarray(0, 40);
    expect((await subir(ana, cortada)).status).toBe(415);
    const falsa = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(300, 7)]);
    expect((await subir(ana, falsa)).status).toBe(415);
  });

  it('más de 3 MB da 413', async () => {
    const grande = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(3 * 1024 * 1024 + 1, 0)]);
    const r = await subir(ana, grande, 'image/png');
    expect(r.status).toBe(413);
  });

  it('un cuerpo vacío da 400', async () => {
    expect((await subir(ana, Buffer.alloc(0))).status).toBe(400);
  });

  it('sin sesión no se puede subir ni borrar (401)', async () => {
    const sin = cliente(env.app);
    expect((await sin.put('/api/cuenta/foto').set('Content-Type', 'image/png').send(await png())).status).toBe(401);
    expect((await sin.delete('/api/cuenta/foto')).status).toBe(401);
  });

  it('solo se cambia la foto propia: no existe ninguna ruta para cambiar la de otra cuenta', async () => {
    const ajena = ana.cuenta.id;
    const antes = await env.ctx.prisma.usuario.findUnique({ where: { id: ajena }, select: { fotoArchivo: true, fotoVersion: true } });
    for (const ruta of [`/api/fotos/${ajena}`, `/api/cuenta/foto/${ajena}`, `/api/admin/usuarios/${ajena}/foto`]) {
      for (const metodo of ['put', 'post', 'delete'] as const) {
        const r = await beto.api[metodo](ruta).set('Content-Type', 'image/png').send(await png());
        expect([403, 404, 405]).toContain(r.status);
      }
    }
    // Ni siquiera la administración tiene ruta para eso: la de ella solo toca la suya.
    const rAdmin = await jefa.api.delete(`/api/fotos/${ajena}`);
    expect(rAdmin.status).toBe(404);
    const despues = await env.ctx.prisma.usuario.findUnique({ where: { id: ajena }, select: { fotoArchivo: true, fotoVersion: true } });
    expect(despues).toEqual(antes);
    // Y subir como beto solo cambia a beto.
    const filaBeto = await env.ctx.prisma.usuario.findUnique({ where: { id: beto.cuenta.id }, select: { fotoVersion: true } });
    await subir(beto, await png(), 'image/png');
    const filaBeto2 = await env.ctx.prisma.usuario.findUnique({ where: { id: beto.cuenta.id }, select: { fotoVersion: true } });
    expect(filaBeto2!.fotoVersion).toBeGreaterThan(filaBeto!.fotoVersion);
    expect(await env.ctx.prisma.usuario.findUnique({ where: { id: ajena }, select: { fotoVersion: true } })).toMatchObject({ fotoVersion: antes!.fotoVersion });
  });

  it('demasiados intentos seguidos dan 429', async () => {
    const diana = await sesionComo(env, 'diana', 'usuario');
    const estados: number[] = [];
    for (let i = 0; i < 16; i++) estados.push((await subir(diana, Buffer.from('no es una imagen'))).status);
    expect(estados.slice(0, 15).every((e) => e === 415)).toBe(true);
    expect(estados[15]).toBe(429);
  });

  it('una cuenta desactivada ya no entrega su foto', async () => {
    const ext = await sesionComo(env, 'carla', 'usuario');
    await subir(ext, await png(), 'image/png');
    expect((await beto.api.get(`/api/fotos/${ext.cuenta.id}`)).status).toBe(200);
    await env.ctx.prisma.usuario.update({ where: { id: ext.cuenta.id }, data: { activo: false } });
    expect((await beto.api.get(`/api/fotos/${ext.cuenta.id}`)).status).toBe(404);
  });
});

describe('utilidades de la foto', () => {
  it('reconoce JPG, PNG y WebP por la firma y nada más', async () => {
    expect(tipoPorFirma(await jpegConExif(8, 8))).toBe('jpeg');
    expect(tipoPorFirma(await png(8, 8))).toBe('png');
    expect(tipoPorFirma(await sharp({ create: { width: 8, height: 8, channels: 3, background: '#fff' } }).webp().toBuffer())).toBe('webp');
    expect(tipoPorFirma(Buffer.from('GIF89a......'))).toBeNull();
    expect(tipoPorFirma(Buffer.from('MZ\x90\x00'))).toBeNull();
    expect(tipoPorFirma(Buffer.alloc(0))).toBeNull();
  });

  it('el límite permite pocas fotos por ventana y libera después', () => {
    const l = new LimiteFotos(3, 1000);
    expect(l.permitir(1, 0)).toBe(true);
    expect(l.permitir(1, 10)).toBe(true);
    expect(l.permitir(1, 20)).toBe(true);
    expect(l.permitir(1, 30)).toBe(false);
    expect(l.permitir(2, 30)).toBe(true);
    expect(l.permitir(1, 1500)).toBe(true);
  });
});
