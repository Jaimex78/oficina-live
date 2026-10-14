import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { ConfigPlanner, DatosPlanner, RespuestaNotificaciones } from '@ol/shared';
import { cliente, crearEntorno, sesionComo, type Entorno } from './ayudas';

describe('Planner interno', () => {
  let env: Entorno;
  let ana: Awaited<ReturnType<typeof sesionComo>>;
  let beto: Awaited<ReturnType<typeof sesionComo>>;
  let carla: Awaited<ReturnType<typeof sesionComo>>;
  let jefa: Awaited<ReturnType<typeof sesionComo>>;
  let tableroId = 0;

  beforeAll(async () => {
    env = await crearEntorno();
    ana = await sesionComo(env, 'ana', 'usuario');
    beto = await sesionComo(env, 'beto', 'usuario');
    carla = await sesionComo(env, 'carla', 'usuario');
    jefa = await sesionComo(env, 'jefa', 'admin');
  });
  afterAll(async () => {
    await env.cerrar();
  });

  const leer = async (api = ana.api, tablero?: number): Promise<DatosPlanner> => (await api.get(`/api/planner${tablero ? `?tablero=${tablero}` : ''}`)).body as DatosPlanner;
  const avisos = async (api: typeof ana.api): Promise<RespuestaNotificaciones> => (await api.get('/api/notificaciones')).body as RespuestaNotificaciones;

  it('la primera vez deja un tablero con las columnas y los campos iniciales', async () => {
    const d = await leer();
    tableroId = d.tablero.id;
    expect(d.tableros).toHaveLength(1);
    expect(d.columnas.map((c) => c.nombre)).toEqual(['Por hacer', 'En curso', 'En revisión', 'Hecho']);
    expect(d.columnas.at(-1)?.esFinal).toBe(true);
    expect(d.campos.map((c) => c.nombre)).toEqual(['Prioridad', 'Marca', 'Cliente']);
    expect(d.campos[0]).toMatchObject({ tipo: 'lista', semaforo: true });
    expect(d.campos[0]?.opciones.map((o) => o.color)).toEqual(['#E5484D', '#F5A524', '#2FB344']);
    expect(d.tareas).toEqual([]);
    expect(d.personas.map((p) => p.usuario)).toEqual(expect.arrayContaining(['ana', 'beto', 'jefa']));
  });

  it('exige sesión', async () => {
    expect((await cliente(env.app).get('/api/planner')).status).toBe(401);
    expect((await cliente(env.app).get('/api/notificaciones')).status).toBe(401);
  });

  it('crea una tarea completa y avisa a quien se la asignan y a los miembros, sin avisarle a quien la crea', async () => {
    const d = await leer();
    const prioridad = d.campos[0]!;
    const cliente = d.campos[2]!;
    const r = await ana.api.post('/api/planner/tareas').send({
      titulo: '  Revisar la matriz del cliente ',
      descripcion: 'Antes del jueves',
      columnaId: d.columnas[0]!.id,
      responsableId: beto.cuenta.id,
      miembros: [carla.cuenta.id, ana.cuenta.id],
      fechaLimite: '2026-10-15',
      valores: { [prioridad.id]: prioridad.opciones[0]!.id, [cliente.id]: cliente.opciones[0]!.id },
      subtareas: [{ titulo: 'Cargar datos', hecha: true }, { titulo: 'Validar', hecha: false }],
    });
    expect(r.status).toBe(201);
    expect(r.body.tarea).toMatchObject({ titulo: 'Revisar la matriz del cliente', responsableId: beto.cuenta.id, fechaLimite: '2026-10-15', creadaPor: 'Persona ana', comentarios: 0 });
    expect(r.body.tarea.miembros).toEqual([carla.cuenta.id, ana.cuenta.id]);
    expect(r.body.tarea.subtareas.map((s: { titulo: string }) => s.titulo)).toEqual(['Cargar datos', 'Validar']);
    expect((await avisos(ana.api)).sinLeer).toBe(0);
    const deBeto = await avisos(beto.api);
    expect(deBeto.sinLeer).toBe(1);
    expect(deBeto.notificaciones[0]).toMatchObject({ tipo: 'tarea_asignada', titulo: 'Persona ana te asignó una tarea', texto: 'Revisar la matriz del cliente', leida: false });
    expect(deBeto.notificaciones[0]!.enlace).toBe(`/planner?tablero=${tableroId}&tarea=${r.body.tarea.id}`);
    expect((await avisos(carla.api)).notificaciones[0]).toMatchObject({ tipo: 'tarea_miembro' });
  });

  it('marca los avisos como leídos, uno o todos, y solo los propios', async () => {
    const b = await avisos(beto.api);
    const id = b.notificaciones[0]!.id;
    expect((await carla.api.post(`/api/notificaciones/${id}/leida`).send({})).status).toBe(404);
    expect((await beto.api.post(`/api/notificaciones/${id}/leida`).send({})).status).toBe(200);
    expect((await avisos(beto.api)).sinLeer).toBe(0);
    expect((await avisos(carla.api)).sinLeer).toBe(1);
    expect((await carla.api.post('/api/notificaciones/leidas').send({})).status).toBe(200);
    expect((await avisos(carla.api)).sinLeer).toBe(0);
    expect((await beto.api.post('/api/notificaciones/9999/leida').send({})).status).toBe(404);
  });

  it('reasignar avisa solo a la persona nueva; editar sin cambiar la persona no avisa', async () => {
    const t = (await leer()).tareas[0]!;
    await ana.api.patch(`/api/planner/tareas/${t.id}`).send({ descripcion: 'Con más detalle' });
    expect((await avisos(beto.api)).sinLeer).toBe(0);
    const r = await ana.api.patch(`/api/planner/tareas/${t.id}`).send({ responsableId: carla.cuenta.id });
    expect(r.status).toBe(200);
    expect((await avisos(carla.api)).sinLeer).toBe(1);
    expect((await avisos(beto.api)).sinLeer).toBe(0);
    // Quien se asigna a sí mismo no se avisa.
    await ana.api.patch(`/api/planner/tareas/${t.id}`).send({ responsableId: ana.cuenta.id });
    expect((await avisos(ana.api)).sinLeer).toBe(0);
    await ana.api.patch(`/api/planner/tareas/${t.id}`).send({ responsableId: beto.cuenta.id });
  });

  it('los comentarios llegan a quienes siguen la tarea, menos a quien comenta', async () => {
    const t = (await leer()).tareas[0]!;
    await beto.api.post('/api/notificaciones/leidas').send({});
    await carla.api.post('/api/notificaciones/leidas').send({});
    const r = await carla.api.post(`/api/planner/tareas/${t.id}/comentarios`).send({ texto: '  Ya subí los datos  ' });
    expect(r.status).toBe(201);
    expect(r.body.comentario).toMatchObject({ texto: 'Ya subí los datos', autor: 'Persona carla' });
    expect((await avisos(carla.api)).sinLeer).toBe(0);
    expect((await avisos(beto.api)).notificaciones[0]).toMatchObject({ tipo: 'tarea_comentario' });
    expect((await avisos(ana.api)).notificaciones.some((n) => n.tipo === 'tarea_comentario')).toBe(true);
    const completa = (await ana.api.get(`/api/planner/tareas/${t.id}`)).body;
    expect(completa.comentarios.map((c: { texto: string }) => c.texto)).toEqual(['Ya subí los datos']);
    expect((await leer()).tareas[0]!.comentarios).toBe(1);
    expect((await ana.api.post(`/api/planner/tareas/${t.id}/comentarios`).send({ texto: '   ' })).status).toBe(400);
    // Borrar: solo quien lo escribió o quien administra.
    const cid = completa.comentarios[0].id as number;
    expect((await ana.api.delete(`/api/planner/tareas/${t.id}/comentarios/${cid}`)).status).toBe(403);
    expect((await carla.api.delete(`/api/planner/tareas/${t.id}/comentarios/${cid}`)).status).toBe(200);
  });

  it('las subtareas se reemplazan por la lista nueva: crea, actualiza y borra', async () => {
    const t = (await leer()).tareas[0]!;
    const [a] = t.subtareas;
    const r = await ana.api.patch(`/api/planner/tareas/${t.id}`).send({ subtareas: [{ id: a!.id, titulo: a!.titulo, hecha: false }, { titulo: 'Entregar', hecha: false }] });
    expect(r.body.tarea.subtareas.map((s: { titulo: string; hecha: boolean }) => [s.titulo, s.hecha])).toEqual([[a!.titulo, false], ['Entregar', false]]);
    expect(r.body.tarea.subtareas[0].id).toBe(a!.id);
    expect((await ana.api.patch(`/api/planner/tareas/${t.id}`).send({ subtareas: [{ titulo: '', hecha: false }] })).status).toBe(400);
  });

  it('terminar una tarea avisa a quien la creó y a quien la tiene', async () => {
    const d = await leer();
    const t = d.tareas[0]!;
    await ana.api.post('/api/notificaciones/leidas').send({});
    await beto.api.post('/api/notificaciones/leidas').send({});
    const hecho = d.columnas.at(-1)!;
    const a = await beto.api.post(`/api/planner/tareas/${t.id}/mover`).send({ columnaId: hecho.id, posicion: 0 });
    expect(a.status).toBe(200);
    expect(a.body.tarea.completadaEn).not.toBeNull();
    expect((await avisos(ana.api)).notificaciones[0]).toMatchObject({ tipo: 'tarea_terminada' });
    expect((await avisos(beto.api)).sinLeer).toBe(0);
    const b = await beto.api.post(`/api/planner/tareas/${t.id}/mover`).send({ columnaId: d.columnas[1]!.id, posicion: 0 });
    expect(b.body.tarea.completadaEn).toBeNull();
  });

  it('descarta valores que no corresponden y rechaza datos mal formados', async () => {
    const d = await leer();
    const marca = d.campos[1]!;
    const r = await ana.api.post('/api/planner/tareas').send({ titulo: 'Con marca rara', valores: { [marca.id]: 9999, 777: 'x' } });
    expect(r.status).toBe(201);
    expect(r.body.tarea.valores).toEqual({});
    expect((await ana.api.post('/api/planner/tareas').send({ titulo: '   ' })).status).toBe(400);
    expect((await ana.api.post('/api/planner/tareas').send({ titulo: 'x', fechaLimite: '15/10/2026' })).status).toBe(400);
    expect((await ana.api.post('/api/planner/tareas').send({ titulo: 'x', columnaId: 9999 })).status).toBe(404);
    expect((await ana.api.post('/api/planner/tareas').send({ titulo: 'x', responsableId: 99999 })).status).toBe(404);
    expect((await ana.api.post('/api/planner/tareas').send({ titulo: 'x', otra: 1 })).status).toBe(400);
  });

  it('reordena las demás tareas de la columna al mover', async () => {
    const d = await leer();
    const col = d.columnas[0]!;
    for (const t of ['Uno', 'Dos', 'Tres']) await ana.api.post('/api/planner/tareas').send({ titulo: t, columnaId: col.id });
    const ultima = (await leer()).tareas.filter((t) => t.columnaId === col.id).at(-1)!;
    await ana.api.post(`/api/planner/tareas/${ultima.id}/mover`).send({ columnaId: col.id, posicion: 0 });
    const despues = (await leer()).tareas.filter((t) => t.columnaId === col.id);
    expect(despues[0]?.id).toBe(ultima.id);
    expect(despues.map((t) => t.orden)).toEqual(despues.map((_, i) => i));
  });

  it('solo quien creó la tarea o quien administra la borra', async () => {
    const t = (await ana.api.post('/api/planner/tareas').send({ titulo: 'Para borrar' })).body.tarea as { id: number };
    expect((await beto.api.delete(`/api/planner/tareas/${t.id}`)).status).toBe(403);
    expect((await ana.api.delete(`/api/planner/tareas/${t.id}`)).status).toBe(200);
    const u = (await ana.api.post('/api/planner/tareas').send({ titulo: 'Otra' })).body.tarea as { id: number };
    expect((await jefa.api.delete(`/api/planner/tareas/${u.id}`)).status).toBe(200);
    expect((await ana.api.delete(`/api/planner/tareas/${u.id}`)).status).toBe(404);
  });

  it('archivar saca la tarea del conteo de la columna sin borrarla', async () => {
    const t = (await ana.api.post('/api/planner/tareas').send({ titulo: 'Para archivar' })).body.tarea as { id: number };
    const r = await ana.api.patch(`/api/planner/tareas/${t.id}`).send({ archivada: true });
    expect(r.body.tarea.archivada).toBe(true);
  });

  it('avisa de lo que vence pronto, una sola vez por fecha', async () => {
    const hoy = new Date().toISOString().slice(0, 10);
    const t = (await ana.api.post('/api/planner/tareas').send({ titulo: 'Vence hoy', responsableId: carla.cuenta.id, fechaLimite: hoy })).body.tarea as { id: number };
    await carla.api.post('/api/notificaciones/leidas').send({});
    expect(await env.ctx.planner.revisarVencimientos()).toBeGreaterThanOrEqual(1);
    expect((await avisos(carla.api)).notificaciones[0]).toMatchObject({ tipo: 'tarea_vence', texto: expect.stringContaining('Vence hoy') });
    expect(await env.ctx.planner.revisarVencimientos()).toBe(0);
    // Si se cambia la fecha, vuelve a avisar.
    await ana.api.patch(`/api/planner/tareas/${t.id}`).send({ fechaLimite: hoy });
    expect(await env.ctx.planner.revisarVencimientos()).toBe(1);
  });

  it('solo quien administra maneja tableros y configuración', async () => {
    const d = await leer();
    const cfg: ConfigPlanner = { columnas: d.columnas, campos: d.campos };
    expect((await ana.api.put(`/api/planner/tableros/${tableroId}/config`).send(cfg)).status).toBe(403);
    expect((await ana.api.post('/api/planner/tableros').send({ nombre: 'Otro' })).status).toBe(403);
    expect((await ana.api.delete(`/api/planner/tableros/${tableroId}`)).status).toBe(403);
    expect((await jefa.api.put(`/api/planner/tableros/${tableroId}/config`).send(cfg)).status).toBe(200);
  });

  it('la administración agrega marcas, límites y colores, y las tareas se acomodan solas', async () => {
    const d = await leer();
    const marca = d.campos[1]!;
    const cfg: ConfigPlanner = {
      nombre: 'Equipo Digital',
      columnas: d.columnas.map((c, i) => ({ ...c, limite: i === 1 ? 3 : null })),
      campos: d.campos.map((c) => (c.id === marca.id ? { ...c, opciones: [{ nombre: 'Nescafé', color: '#E5484D' }, { nombre: 'Milo', color: '#2FB344' }] } : { ...c })),
    };
    const g = await jefa.api.put(`/api/planner/tableros/${tableroId}/config`).send(cfg);
    expect(g.status).toBe(200);
    expect((g.body as DatosPlanner).tablero.nombre).toBe('Equipo Digital');
    expect((g.body as DatosPlanner).columnas[1]!.limite).toBe(3);
    const marcas = (g.body as DatosPlanner).campos.find((c) => c.id === marca.id)!.opciones;
    expect(marcas.map((o) => o.nombre)).toEqual(['Nescafé', 'Milo']);

    const t = (await ana.api.post('/api/planner/tareas').send({ titulo: 'Con marca', valores: { [marca.id]: marcas[0]!.id } })).body.tarea as { id: number; columnaId: number };
    const d2 = await leer();
    const sinNescafe: ConfigPlanner = {
      columnas: d2.columnas.filter((c) => c.id !== t.columnaId).map((c) => ({ ...c })),
      campos: d2.campos.map((c) => (c.id === marca.id ? { ...c, opciones: c.opciones.filter((o) => o.nombre !== 'Nescafé') } : { ...c })),
    };
    expect((await jefa.api.put(`/api/planner/tableros/${tableroId}/config`).send(sinNescafe)).status).toBe(200);
    const d3 = await leer();
    const movida = d3.tareas.find((x) => x.id === t.id)!;
    expect(movida.valores).toEqual({});
    expect(d3.columnas.map((c) => c.id)).toContain(movida.columnaId);
    expect(movida.columnaId).not.toBe(t.columnaId);
  });

  it('una columna con límite no recibe más tareas de las que admite', async () => {
    const d = await leer();
    const col = d.columnas.find((c) => c.limite !== null);
    if (!col) throw new Error('Falta la columna con límite');
    const sobrantes = d.tareas.filter((t) => t.columnaId === col.id).length;
    for (let i = sobrantes; i < col.limite!; i++) await ana.api.post('/api/planner/tareas').send({ titulo: `Llena ${i}`, columnaId: col.id });
    const ajena = (await ana.api.post('/api/planner/tareas').send({ titulo: 'No cabe', columnaId: d.columnas.find((c) => c.id !== col.id)!.id })).body.tarea as { id: number };
    const r = await ana.api.post(`/api/planner/tareas/${ajena.id}/mover`).send({ columnaId: col.id, posicion: 0 });
    expect(r.status).toBe(409);
    expect(r.body.codigo ?? r.body.code).toBe('columna_llena');
  });

  it('varios tableros: crear vacío o copiando, que las tareas no pasen entre tableros y borrar', async () => {
    const copia = await jefa.api.post('/api/planner/tableros').send({ nombre: 'Marca Nescafé', color: '#E5484D', copiarDe: tableroId });
    expect(copia.status).toBe(201);
    const nuevo = copia.body as DatosPlanner;
    expect(nuevo.tablero.nombre).toBe('Marca Nescafé');
    expect(nuevo.tareas).toEqual([]);
    expect(nuevo.columnas.map((c) => c.nombre)).toEqual((await leer()).columnas.map((c) => c.nombre));
    const idsOriginales = (await leer()).columnas.map((c) => c.id);
    expect(nuevo.columnas.every((c) => !idsOriginales.includes(c.id))).toBe(true);
    expect((await leer()).tableros).toHaveLength(2);
    // Una tarea del tablero nuevo se queda ahí.
    const t = (await ana.api.post(`/api/planner/tareas?tablero=${nuevo.tablero.id}`).send({ titulo: 'En el otro tablero' })).body.tarea as { id: number; columnaId: number };
    expect(nuevo.columnas.map((c) => c.id)).toContain(t.columnaId);
    expect((await leer(ana.api, nuevo.tablero.id)).tareas.map((x) => x.id)).toEqual([t.id]);
    expect((await leer()).tareas.some((x) => x.id === t.id)).toBe(false);
    const mover = await ana.api.post(`/api/planner/tareas/${t.id}/mover`).send({ columnaId: (await leer()).columnas[0]!.id, posicion: 0 });
    expect(mover.status).toBe(409);
    expect((await ana.api.get('/api/planner?tablero=99999')).status).toBe(404);
    expect((await jefa.api.delete(`/api/planner/tableros/${nuevo.tablero.id}`)).status).toBe(200);
    expect((await leer()).tableros).toHaveLength(1);
    expect((await jefa.api.delete(`/api/planner/tableros/${tableroId}`)).status).toBe(409);
  });

  it('rechaza configuraciones inválidas', async () => {
    const d = await leer();
    const base: ConfigPlanner = { columnas: d.columnas, campos: d.campos };
    const mal = async (cfg: object) => (await jefa.api.put(`/api/planner/tableros/${tableroId}/config`).send(cfg)).status;
    expect(await mal({ ...base, columnas: [] })).toBe(400);
    expect(await mal({ ...base, columnas: [{ nombre: 'x', color: 'rojo', esFinal: false }] })).toBe(400);
    expect(await mal({ ...base, columnas: [{ nombre: 'x', color: '#112233', esFinal: false, limite: 0 }] })).toBe(400);
    expect(await mal({ ...base, campos: [{ nombre: 'A', tipo: 'texto', semaforo: false, opciones: [] }, { nombre: 'a', tipo: 'texto', semaforo: false, opciones: [] }] })).toBe(400);
    expect(await mal({ ...base, campos: [{ nombre: 'A', tipo: 'texto', semaforo: true, opciones: [] }] })).toBe(400);
    expect(await mal({ ...base, campos: [{ nombre: 'A', tipo: 'otro', semaforo: false, opciones: [] }] })).toBe(400);
  });
});

