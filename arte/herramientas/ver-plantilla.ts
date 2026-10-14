/**
 * Dibuja una plantilla del mapa con el compositor del arte y lista lo que no cuadra. Hoja interna: va a
 * arte/referencia/propia/plantillas/<id>.png (no se manda a nadie).
 *
 *   npx tsx arte/herramientas/ver-plantilla.ts naos [--diag] [--recorte=x,y,w,h[,escala]]
 *
 * Con `--diag` las colocaciones que no caben NO lanzan: se anotan y la plantilla se arma sin ellas, así se ven todos los fallos de una vez.
 */
import { join } from 'node:path';
import { ConstructorSala, hayErrores, plantillaDeMapa, validarMapa, type IdPlantillaMapa } from '@ol/shared';
import { componerConPersonas } from '../src/objetos/l8-personas';
import { resolverDesdePublicados } from '../src/objetos/compositor';
import { escribirPng } from '../src/nucleo';

const args = process.argv.slice(2);
const id = (args.find((a) => !a.startsWith('--')) ?? 'naos') as IdPlantillaMapa;
const diag = args.includes('--diag');
const recorte = args.find((a) => a.startsWith('--recorte='))?.slice(10).split(',').map(Number);
const fallos: string[] = [];
if (diag) {
  const original = ConstructorSala.prototype.poner;
  ConstructorSala.prototype.poner = function (this: ConstructorSala, ...a: Parameters<typeof original>) {
    try {
      return original.apply(this, a);
    } catch (e) {
      fallos.push(e instanceof Error ? e.message : String(e));
      return this;
    }
  };
  const sillas = ConstructorSala.prototype.sillasAlrededor;
  ConstructorSala.prototype.sillasAlrededor = function (this: ConstructorSala, ...a: Parameters<typeof sillas>) {
    try {
      return sillas.apply(this, a);
    } catch (e) {
      fallos.push(e instanceof Error ? e.message : String(e));
      return this;
    }
  };
}
const mapa = plantillaDeMapa(id);
const sala = mapa.salas[0]!;
const problemas = validarMapa(mapa);
console.log(`${id}: ${sala.colocaciones.length} objetos, ${sala.zonas.length} zonas, ${problemas.filter((p) => p.nivel === 'error').length} errores, ${problemas.filter((p) => p.nivel === 'aviso').length} avisos`);
for (const f of fallos) console.log('  FALLO', f);
for (const p of problemas) console.log(`  ${p.nivel.toUpperCase()} ${p.codigo} (${p.x},${p.y}) ${p.mensaje}`);
void hayErrores;
const margen = 40;
let img = componerConPersonas(sala, resolverDesdePublicados(), [], null, margen);
if (recorte && recorte.length >= 4) img = img.recortar(recorte[0]! * 32, recorte[1]! * 32 + margen - 40, recorte[2]! * 32, recorte[3]! * 32 + 40).escalar(recorte[4] ?? 2);
const salida = join(process.cwd(), `arte/referencia/propia/plantillas/${id}${recorte ? '-recorte' : ''}.png`);
escribirPng(img, salida);
console.log('→', salida);
