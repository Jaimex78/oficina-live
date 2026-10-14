import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ServicioAjustes } from '../src/ajustes/servicio';
import { DEFINICIONES } from '../src/ajustes/definiciones';
import { cliente, crearEntorno, sesionComo, type Entorno } from './ayudas';

let env: Entorno;
let admin: ReturnType<typeof cliente>;

beforeAll(async () => {
  env = await crearEntorno();
  admin = (await sesionComo(env, 'jefa', 'admin')).api;
});
afterAll(async () => {
  await env.cerrar();
});

describe('configuración editable', () => {
  it('entrega todos los ajustes agrupados, con sus límites y valores por defecto', async () => {
    const r = await admin.get('/api/admin/ajustes');
    expect(r.status).toBe(200);
    const claves = r.body.grupos.flatMap((g: { ajustes: { clave: string }[] }) => g.ajustes.map((a) => a.clave));
    expect(claves.sort()).toEqual(DEFINICIONES.map((d) => d.clave).sort());
    const sesion = r.body.grupos.flatMap((g: { ajustes: { clave: string }[] }) => g.ajustes).find((a: { clave: string }) => a.clave === 'sesion_horas');
    expect(sesion).toMatchObject({ valor: 8, defecto: 8, min: 1, max: 72, tipo: 'entero' });
  });

  it('guarda cambios válidos, los conserva al recargar y los audita', async () => {
    const r = await admin.put('/api/admin/ajustes').send({ cambios: { sesion_horas: '12', nombre_plataforma: '  Oficina Live Digital ', color_primario: '#ff0000' } });
    expect(r.status).toBe(200);
    expect(r.body.cambiados.sort()).toEqual(['color_primario', 'nombre_plataforma', 'sesion_horas']);

    const nuevo = new ServicioAjustes(env.ctx.prisma);
    await nuevo.cargar();
    expect(nuevo.obtener('sesion_horas')).toBe(12);
    expect(nuevo.obtener('nombre_plataforma')).toBe('Oficina Live Digital');
    expect(nuevo.obtener('color_primario')).toBe('#FF0000');

    const registro = await env.ctx.prisma.actividad.findFirstOrThrow({ where: { accion: 'ajustes_guardados' } });
    expect(registro.detalle).toContain('sesion_horas=12');
  });

  it('no registra nada si no cambió ningún valor', async () => {
    const antes = await env.ctx.prisma.actividad.count({ where: { accion: 'ajustes_guardados' } });
    const r = await admin.put('/api/admin/ajustes').send({ cambios: { sesion_horas: 12 } });
    expect(r.body.cambiados).toEqual([]);
    expect(await env.ctx.prisma.actividad.count({ where: { accion: 'ajustes_guardados' } })).toBe(antes);
  });

  it('rechaza valores fuera de rango, de otro tipo o ajustes que no existen', async () => {
    const casos: Record<string, unknown>[] = [
      { sesion_horas: 0 },
      { sesion_horas: 500 },
      { sesion_horas: 'mucho' },
      { sesion_horas: 3.5 },
      { color_primario: 'rojo' },
      { nombre_plataforma: '' },
      { nombre_plataforma: 'x'.repeat(41) },
      { horario_activo: 'si' },
      { horario_desde: '25:00' },
      { zona_horaria: 'Marte/Olympus' },
      { horario_dias: '1,9' },
      { ajuste_inventado: 1 },
    ];
    for (const cambios of casos) {
      const r = await admin.put('/api/admin/ajustes').send({ cambios });
      expect(r.status, JSON.stringify(cambios)).toBe(422);
      expect(r.body.error).toBeTruthy();
    }
  });

  it('valida el horario completo, no solo cada campo', async () => {
    const r = await admin.put('/api/admin/ajustes').send({ cambios: { horario_desde: '18:00', horario_hasta: '08:00' } });
    expect(r.status).toBe(422);
    expect(r.body.error).toMatch(/cierre/);
    const sinDias = await admin.put('/api/admin/ajustes').send({ cambios: { horario_activo: true, horario_dias: '' } });
    expect(sinDias.status).toBe(422);
  });

  it('un rechazo no guarda nada de lo demás (todo o nada)', async () => {
    const r = await admin.put('/api/admin/ajustes').send({ cambios: { bloqueo_min: 30, sesion_horas: 0 } });
    expect(r.status).toBe(422);
    expect(env.ctx.ajustes.obtener('bloqueo_min')).toBe(5);
  });

  it('solo publica sin sesión lo necesario para dibujar el ingreso', async () => {
    const r = await cliente(env.app).get('/api/publico/config');
    expect(r.status).toBe(200);
    expect(Object.keys(r.body).sort()).toEqual(['claveMin', 'colorPrimario', 'colorSecundario', 'nombre', 'solicitudesActivas', 'version']);
    expect(r.body.nombre).toBe('Oficina Live Digital');
  });

  it('la duración de la sesión cambia el vencimiento del token', async () => {
    await env.ctx.ajustes.guardar({ sesion_horas: 1 });
    const token = await env.ctx.tokens.emitir({ id: 1, versionToken: 1 });
    const payload = JSON.parse(Buffer.from(token.split('.')[1] as string, 'base64url').toString()) as { exp: number; iat: number };
    expect(payload.exp - payload.iat).toBe(3600);
  });
});
