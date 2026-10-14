#!/bin/bash
# Oficina Live · doble clic para iniciar la VERSIÓN FINAL local (datos reales en data-local, sin ejemplos)
cd "$(dirname "$0")" || exit 1
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

# Si existe un .env local (no va en git), se leen sus variables. Ver .env.example.
if [ -f .env ]; then set -a; . ./.env; set +a; fi

# La primera vez no hay cuentas: hace falta el correo de la primera persona administradora.
if [ ! -f data-local/interna.sqlite ] && [ -z "$OL_ADMIN_CORREO" ]; then
  echo ""
  echo "  Primera vez: se creará la cuenta de administración."
  read -r -p "  Escribe el correo de la persona administradora: " OL_ADMIN_CORREO
  if [ -z "$OL_ADMIN_CORREO" ]; then echo "  Sin correo no se puede crear la cuenta. Intenta de nuevo."; exit 1; fi
  export OL_ADMIN_CORREO
fi

for PUERTO in 5190 8790; do
  VIEJO=$(lsof -tiTCP:$PUERTO -sTCP:LISTEN 2>/dev/null)
  if [ -n "$VIEJO" ]; then echo "$VIEJO" | xargs kill 2>/dev/null; sleep 1; fi
done

echo ""
echo "  Oficina Live · versión final local"
echo "  Abriendo http://localhost:5190"
echo "  La primera vez se crea la cuenta de administración; su enlace para crear la contraseña queda aquí abajo y en data-local/ENLACE-ADMIN.txt"
echo "  (deja esta ventana abierta mientras lo usas; Ctrl+C para apagarlo)"
echo ""
(sleep 5; open "http://localhost:5190") &
npm run local
