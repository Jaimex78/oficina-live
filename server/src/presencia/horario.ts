export interface Horario {
  activo: boolean;
  /** Días ISO separados por coma: 1 lunes ... 7 domingo. */
  dias: string;
  desde: string;
  hasta: string;
  zona: string;
}

const DIA_ISO: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

/** Día ISO y minutos desde medianoche en la zona horaria dada. */
function enZona(fecha: Date, zona: string): { dia: number; minutos: number } {
  const partes = new Intl.DateTimeFormat('en-US', { timeZone: zona, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(fecha);
  const valor = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? '';
  return { dia: DIA_ISO[valor('weekday')] ?? 1, minutos: Number(valor('hour')) * 60 + Number(valor('minute')) };
}

function aMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** ¿La oficina está abierta ahora? Sin horario activo, siempre. */
export function oficinaAbierta(h: Horario, ahora: Date = new Date()): boolean {
  if (!h.activo) return true;
  const { dia, minutos } = enZona(ahora, h.zona);
  const dias = h.dias
    .split(',')
    .filter(Boolean)
    .map(Number);
  return dias.includes(dia) && minutos >= aMinutos(h.desde) && minutos < aMinutos(h.hasta);
}

export function textoHorario(h: Horario): string {
  const nombres = ['', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
  const dias = h.dias
    .split(',')
    .filter(Boolean)
    .map((d) => nombres[Number(d)] ?? '');
  return `${dias.join(', ')} de ${h.desde} a ${h.hasta}`;
}
