import http from 'node:http';
import { crearApp } from './app';
import { cargarConfig } from './config';
import { crearContexto } from './contexto';
import { sembrarDemo } from './demo';
import { ServidorPresencia } from './presencia/servidor';

const config = cargarConfig();
// Aplica las migraciones y deja en memoria los ajustes y el mapa publicado (en el primer arranque, publica la
// oficina de ejemplo). Todo eso ocurre antes de aceptar la primera conexión.
const ctx = await crearContexto(config, { migrar: true });
console.log(`[oficina] versión publicada: ${ctx.oficina.numeroPublicado()}`);

if (config.demo) {
  await sembrarDemo(ctx);
} else {
  // Sin cuentas de ejemplo: la primera persona administradora entra con un enlace de un solo uso para crear su contraseña.
  // Su correo es obligatorio (OL_ADMIN_CORREO) mientras la base no tenga ninguna cuenta.
  const nombre = process.env.OL_ADMIN_NOMBRE?.trim() || 'Administración';
  const correoAdmin = process.env.OL_ADMIN_CORREO?.trim().toLowerCase();
  if (!correoAdmin && (await ctx.prisma.usuario.count()) === 0) {
    console.error('\n[error] Esta base de datos no tiene cuentas y falta el correo de la primera persona administradora.');
    console.error('[error] Defínelo con la variable OL_ADMIN_CORREO. Por ejemplo:\n');
    console.error('    OL_ADMIN_CORREO=tu@correo.com npm run local\n');
    console.error('[error] Opcional: OL_ADMIN_NOMBRE="Tu Nombre" (por defecto, «Administración»).\n');
    await ctx.cerrar();
    process.exit(1);
  }
  const primero = correoAdmin ? await ctx.auth.asegurarPrimerAdmin(nombre, correoAdmin) : null;
  if (primero) {
    console.log(`\n[inicio] Se creó la cuenta de ${nombre} (${correoAdmin}), pendiente de activación.`);
    console.log(`[inicio] Abre este enlace para crear tu contraseña (sirve una sola vez):\n\n    ${primero.enlace.url}\n`);
    console.log(`[inicio] Vence el ${new Date(primero.enlace.vence).toLocaleDateString('es-CO')}. También quedó en ${primero.archivo}: bórralo cuando lo uses.\n`);
  }
}

const app = crearApp(ctx);
const servidor = http.createServer(app);
const presencia = new ServidorPresencia(ctx, { origenesPermitidos: config.origenesPermitidos, salas: ctx.oficina.proveedorSalas() });
ctx.presencia = presencia;
servidor.on('upgrade', (req, socket, head) => {
  if (!presencia.manejarUpgrade(req, socket, head)) socket.destroy();
});

await new Promise<void>((listo) => servidor.listen(config.puerto, config.host, listo));
console.log(`[ok] Oficina Live en http://${config.host}:${config.puerto}${config.demo ? '  (MODO DEMO)' : config.local ? '  (versión final local)' : ''}`);

// Avisos del Planner: cada hora se revisa qué tareas vencen pronto y se limpian los avisos viejos.
async function avisosDelPlanner(): Promise<void> {
  try {
    await ctx.planner.revisarVencimientos();
    await ctx.notificaciones.limpiar();
  } catch (e) {
    console.error('[planner] falló la revisión de vencimientos', e);
  }
}
setTimeout(avisosDelPlanner, 30_000).unref();
setInterval(avisosDelPlanner, 3_600_000).unref();

// Respaldo automático: se revisa cada 10 minutos y solo se hace si pasó el tiempo configurado.
async function respaldoAutomatico(): Promise<void> {
  try {
    const r = await ctx.respaldos.automatico();
    if (r) await ctx.auditoria.registrar({ accion: 'respaldo_auto', objeto: r.nombre });
  } catch (e) {
    console.error('[respaldo] falló el respaldo automático', e);
  }
}
setTimeout(respaldoAutomatico, 5_000).unref();
setInterval(respaldoAutomatico, 10 * 60_000).unref();

async function apagar(): Promise<void> {
  console.log('[fin] cerrando…');
  servidor.close();
  await presencia.detener();
  await ctx.cerrar();
  process.exit(0);
}
process.on('SIGINT', apagar);
process.on('SIGTERM', apagar);
