import { plantillaNaos } from '@ol/shared';
import { registrarConstructor } from '../construir';
import { componerSala, resolverDesdePublicados } from './compositor';

/** Arma la oficina de ejemplo con todo el arte publicado hasta ahora: lo que falta sale como cuadro magenta. */
registrarConstructor('escena-oficina-inicial', (ctx) => {
  const sala = plantillaNaos().salas[0]!;
  const escena = componerSala(sala, resolverDesdePublicados());
  const ruta = ctx.guardarPng('escena-oficina-inicial.png', escena.escalar(2));
  ctx.log(`Oficina de ejemplo (${sala.colocaciones.length} objetos): ${ruta}`);
});
