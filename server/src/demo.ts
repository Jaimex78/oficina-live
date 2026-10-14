import type { Rol } from '@ol/shared';
import type { Contexto } from './contexto';

/**
 * Datos de demostración. SOLO para la versión local (OL_DEMO=1, carpeta data-demo).
 * La contraseña es de ejemplo, igual para todas las cuentas de demostración, y nunca se usa fuera de este modo.
 */
export const CLAVE_DEMO = 'DemoLocal2026x';

interface PersonaDemo {
  usuario: string;
  nombre: string;
  cargo: string;
  rol: Rol;
  debeCambiar?: boolean;
}

const PERSONAS: PersonaDemo[] = [
  { usuario: 'demo.admin', nombre: 'Laura Mejía', cargo: 'Dirección Digital', rol: 'admin' },
  { usuario: 'demo.constructor', nombre: 'Andrés Cardona', cargo: 'Diseño de experiencia', rol: 'constructor' },
  { usuario: 'demo.ana', nombre: 'Ana Ruiz', cargo: 'Social Media', rol: 'usuario' },
  { usuario: 'demo.camilo', nombre: 'Camilo Torres', cargo: 'Data', rol: 'usuario' },
  { usuario: 'demo.valentina', nombre: 'Valentina Gómez', cargo: 'Copy', rol: 'usuario' },
  { usuario: 'demo.sebastian', nombre: 'Sebastián Pardo', cargo: 'Estrategia digital', rol: 'usuario' },
  { usuario: 'demo.maria', nombre: 'María Fernanda Ospina', cargo: 'Coordinación', rol: 'usuario' },
  { usuario: 'demo.julian', nombre: 'Julián Herrera', cargo: 'Diseño gráfico', rol: 'usuario' },
  { usuario: 'demo.nuevo', nombre: 'Persona Nueva', cargo: 'Practicante', rol: 'usuario', debeCambiar: true },
];

export async function sembrarDemo(ctx: Contexto): Promise<void> {
  if (!ctx.config.demo) return;
  for (const p of PERSONAS) {
    const existe = await ctx.prisma.usuario.findUnique({ where: { usuario: p.usuario } });
    if (existe) continue;
    await ctx.auth.crearUsuario({
      usuario: p.usuario,
      nombre: p.nombre,
      cargo: p.cargo,
      correo: `${p.usuario.replace('demo.', '')}@demo.local`,
      rol: p.rol,
      clave: CLAVE_DEMO,
      debeCambiar: p.debeCambiar ?? false,
    });
  }
  if ((await ctx.prisma.solicitud.count()) === 0) {
    await ctx.prisma.solicitud.createMany({
      data: [
        { nombre: 'Diana Castaño', correo: 'diana@demo.local', cargo: 'Analista', mensaje: 'Entro la próxima semana al equipo de Data.', ip: '127.0.0.1' },
        { nombre: 'Felipe Rojas', correo: 'felipe@demo.local', cargo: 'Diseñador', mensaje: '', ip: '127.0.0.1' },
      ],
    });
  }
}
