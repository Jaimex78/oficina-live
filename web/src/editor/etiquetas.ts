import type { TipoZona } from '@ol/shared';

export const ETIQUETA_ZONA: Record<TipoZona, { nombre: string; ayuda: string }> = {
  abierta: { nombre: 'Abierta', ayuda: 'Espacio común. Todas las personas cercanas se ven y pueden chatear.' },
  silenciosa: { nombre: 'Silenciosa', ayuda: 'Para concentrarse: sin chat de cercanía.' },
  privada: { nombre: 'Privada', ayuda: 'Solo quienes están dentro se ven y chatean entre sí.' },
  sala: { nombre: 'Sala de reuniones', ayuda: 'Al entrar, el resto del mundo se atenúa y arriba aparece la barra para unirse en Teams.' },
  coworking: { nombre: 'Coworking', ayuda: 'Al sentarse aquí se puede iniciar una sesión de enfoque, con cronómetro y tema.' },
};
