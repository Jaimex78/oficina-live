#!/bin/bash
# Oficina Live · demostración visible desde el celular (misma red Wi-Fi)
cd "$(dirname "$0")" || exit 1
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

for PUERTO in 5190 8790; do
  VIEJO=$(lsof -tiTCP:$PUERTO -sTCP:LISTEN 2>/dev/null)
  if [ -n "$VIEJO" ]; then echo "$VIEJO" | xargs kill 2>/dev/null; sleep 1; fi
done

IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
echo ""
echo "  Oficina Live · demostración en la red"
echo "  En el celular, conectado a la misma red, abre:  http://$IP:5190"
echo "  En este Mac:  http://localhost:5190"
echo ""
echo "  Solo hay datos de ejemplo. Aun así, apágalo al terminar (Ctrl+C):"
echo "  mientras corre, cualquier equipo de esta red puede abrirlo."
echo ""
(sleep 5; open "http://localhost:5190") &
npm run demo:lan
