# Cómo contribuir

Gracias por querer ayudar. Este proyecto tiene licencia de **todos los derechos reservados** (ver [LICENSE](LICENSE)), y aun así acepta propuestas.

## Antes de empezar

1. Abre un issue y cuenta qué quieres cambiar. Así evitamos trabajo repetido.
2. Haz un fork, crea una rama (`arreglo-sillas`, `idea-mascotas`) y trabaja ahí.
3. Corre `npm run typecheck` y `npm test`. Todo tiene que pasar.
4. Abre el pull request con la plantilla.

## Licencia de las contribuciones

Al abrir un pull request declaras que el trabajo es tuyo (o que tienes derecho a aportarlo) y que Jaime Orozco puede usarlo, modificarlo y distribuirlo dentro de Oficina Live bajo los términos de [LICENSE](LICENSE). Tú conservas la autoría de tu aporte. Si no estás de acuerdo, no abras el pull request.

No incluyas material de terceros (sprites, tipografías, música, capturas de otros productos) sin que su licencia lo permita y sin listarlo en [AVISOS.md](AVISOS.md).

## Estilo del código

- TypeScript estricto. Nombres, comentarios y textos de la interfaz en español neutro.
- Frases cortas en los textos que ve la gente. Sin rayas largas.
- Lógica pura y reglas compartidas en `shared/`. Nada de acceso a red ni a disco ahí.
- Arte por código en `arte/`: una paleta cerrada, luz arriba a la izquierda y salida determinista.
- Prueba lo que cambias. El mapa, los permisos y la seguridad siempre llevan pruebas.

## Commits

Mensajes cortos, en español, en presente: «Sillas: se sientan solo si el personaje se detiene». Si una herramienta de IA te ayudó, añade al final la línea `Co-Authored-By:` correspondiente.

## Seguridad

Para vulnerabilidades no uses issues públicos: sigue [SECURITY.md](SECURITY.md).
