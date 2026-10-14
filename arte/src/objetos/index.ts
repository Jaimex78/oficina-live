// Cada grupo de objetos registra su propio constructor. Este archivo solo los junta.
// Cada grupo se carga por separado: si el archivo de un grupo está a medias y no compila,
// los demás grupos siguen funcionando y aquí queda un aviso.
import './escena-inicial';

for (const grupo of ['./lote1', './lote2a', './lote2b', './lote4', './lote3b', './lote5', './lote6', './lote7', './lote8', './lote9', './lote10', './lote11', './lote12', './lote13', './lote14']) {
  try {
    await import(grupo);
  } catch (error) {
    console.warn(`[objetos] No se pudo cargar ${grupo}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
