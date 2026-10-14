import express, { Router } from 'express';
import { z } from 'zod';
import { FOTO_PERFIL, MAX_NOMBRE_MASCOTA, type AvatarSpec } from '@ol/shared';
import { aPublico, leerAcceso } from '../auth/servicio';
import type { Contexto } from '../contexto';
import { ErrorHttp, parsear } from '../errores';
import { LimiteFotos, borrarArchivoFoto, guardarArchivoFoto, procesarFoto } from '../fotos/servicio';
import { catalogoMascotas, catalogoPersonajes, motivoNoValido } from '../personaje/catalogo';

const id = z.string().min(1).max(60);
const esqPersonaje = z
  .object({
    v: z.literal(1),
    cuerpo: id,
    piel: id,
    peinado: id,
    pelo: id,
    arriba: id,
    colorArriba: id,
    colorArriba2: id,
    abajo: id,
    colorAbajo: id,
    zapatos: id,
    colorZapatos: id,
    accesorios: z.array(z.object({ id, color: id, color2: id.optional() }).strict()).max(8),
    barba: z.object({ id, color: id }).strict().optional(),
    chaqueta: z.object({ id, color: id }).strict().optional(),
    especial: z.object({ id, color: id.optional(), color2: id.optional() }).strict().optional(),
    movilidad: z.object({ id, color: id.optional() }).strict().optional(),
    mascota: z.object({ id, color: id, nombre: z.string().trim().max(MAX_NOMBRE_MASCOTA, `El nombre de la mascota admite hasta ${MAX_NOMBRE_MASCOTA} letras.`).optional() }).strict().optional(),
  })
  .strict();

/** El personaje que la persona ya tenía guardado (para conservar lo premium que lleva puesto). */
function leerPrevio(texto: string | null): AvatarSpec | null {
  if (!texto) return null;
  try {
    const v = JSON.parse(texto) as AvatarSpec;
    return v && v.v === 1 ? v : null;
  } catch {
    return null;
  }
}

const esqPerfil = z
  .object({
    apodo: z.string().trim().max(24, 'El apodo admite hasta 24 caracteres.').optional(),
    personaje: esqPersonaje.optional(),
    /** Confirma el personaje: la primera vez que entra, la persona lo hace al terminar el creador. */
    confirmar: z.boolean().optional(),
  })
  .strict();

/** Mi cuenta: lo que cada persona ve de sí misma y puede cambiar (su apodo y su personaje). */
export function rutasCuenta(ctx: Contexto): Router {
  const r = Router();
  const limiteFotos = new LimiteFotos();

  r.get('/', (req, res) => {
    res.json({ usuario: aPublico(req.usuario!) });
  });

  // El catálogo de partes, con lo que esta persona puede usar hoy. La interfaz lo usa para mostrar lo bloqueado y por qué.
  r.get('/personaje/catalogo', (req, res) => {
    res.json({ catalogo: catalogoPersonajes(), mascotas: catalogoMascotas(), paquetes: leerAcceso(req.usuario!.acceso), hoy: new Date().toISOString() });
  });

  r.put('/perfil', async (req, res) => {
    const d = parsear(esqPerfil, req.body);
    const yo = req.usuario!;
    const paquetes = leerAcceso(yo.acceso);
    const data: { apodo?: string; personaje?: string; personajeListo?: boolean } = {};
    if (d.apodo !== undefined) data.apodo = d.apodo;
    if (d.personaje) {
      const motivo = motivoNoValido(d.personaje as AvatarSpec, paquetes, new Date(), leerPrevio(yo.personaje));
      if (motivo) throw new ErrorHttp(422, motivo, 'personaje_no_valido');
      data.personaje = JSON.stringify(d.personaje);
    }
    if (d.confirmar) data.personajeListo = true;
    if (Object.keys(data).length === 0) {
      res.json({ usuario: aPublico(yo) });
      return;
    }
    const nuevo = await ctx.prisma.usuario.update({ where: { id: yo.id }, data });
    // Quien está en la oficina ve el cambio en el acto.
    ctx.presencia?.perfilCambiado?.(nuevo);
    res.json({ usuario: aPublico(nuevo) });
  });

  // Foto de perfil: el cuerpo es la imagen tal cual (JPG, PNG o WebP, hasta 3 MB). Solo cambia la de quien tiene la sesión.
  // El servidor decide el tipo por la firma de bytes, la reduce a 256x256 y la vuelve a codificar sin metadatos.
  r.put('/foto', express.raw({ type: () => true, limit: FOTO_PERFIL.maxBytes }), async (req, res) => {
    const yo = req.usuario!;
    if (!limiteFotos.permitir(yo.id)) throw new ErrorHttp(429, 'Cambiaste tu foto muchas veces seguidas. Espera unos minutos e intenta de nuevo.', 'foto_limite');
    const cuerpo: unknown = req.body;
    const webp = await procesarFoto(Buffer.isBuffer(cuerpo) ? cuerpo : Buffer.alloc(0));
    const nombre = await guardarArchivoFoto(ctx.config.dataDir, webp);
    const anterior = yo.fotoArchivo;
    const nuevo = await ctx.prisma.usuario.update({ where: { id: yo.id }, data: { fotoArchivo: nombre, fotoVersion: yo.fotoVersion + 1 } });
    if (anterior) await borrarArchivoFoto(ctx.config.dataDir, anterior);
    ctx.presencia?.perfilCambiado?.(nuevo);
    res.json({ usuario: aPublico(nuevo) });
  });

  r.delete('/foto', async (req, res) => {
    const yo = req.usuario!;
    if (!yo.fotoArchivo) {
      res.json({ usuario: aPublico(yo) });
      return;
    }
    // La versión sube también al borrar: así el navegador nunca confunde una foto nueva con una vieja guardada.
    const nuevo = await ctx.prisma.usuario.update({ where: { id: yo.id }, data: { fotoArchivo: '', fotoVersion: yo.fotoVersion + 1 } });
    await borrarArchivoFoto(ctx.config.dataDir, yo.fotoArchivo);
    ctx.presencia?.perfilCambiado?.(nuevo);
    res.json({ usuario: aPublico(nuevo) });
  });

  return r;
}
