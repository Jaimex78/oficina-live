#!/bin/bash
# Oficina Live · doble clic para abrir la DEMOSTRACIÓN (datos de ejemplo, carpeta data-demo)
cd "$(dirname "$0")" || exit 1
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

# Si ya hay una copia corriendo (por ejemplo la que deja abierta Claude), se reemplaza.
for PUERTO in 5190 8790; do
  VIEJO=$(lsof -tiTCP:$PUERTO -sTCP:LISTEN 2>/dev/null)
  if [ -n "$VIEJO" ]; then echo "$VIEJO" | xargs kill 2>/dev/null; sleep 1; fi
done

echo ""
echo "  Oficina Live · demostración"
echo "  Abriendo http://localhost:5190"
echo "  Las cuentas de ejemplo están en docs/ACCESOS.md"
echo "  (deja esta ventana abierta mientras lo usas; Ctrl+C para apagarlo)"
echo ""
(sleep 5; open "http://localhost:5190") &
npm run demo
