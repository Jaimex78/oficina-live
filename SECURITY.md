# Seguridad

## Reportar una vulnerabilidad

No abras un issue público. Usa **Security → Report a vulnerability** en la página del repositorio (aviso privado de GitHub). Incluye los pasos para reproducirla y qué versión probaste. Respondo lo antes posible.

## Qué hace el proyecto hoy

- **Contraseñas:** scrypt con sal por cuenta, nunca en texto. Las cuentas nuevas no tienen contraseña hasta que la persona abre su enlace de activación (256 bits, un solo uso, vence a los 7 días; en la base solo se guarda su hash SHA-256).
- **Sesiones:** JWT firmado (HS256) que viaja en la cabecera `Authorization: Bearer`, sin cookies. Se revoca al cambiar o restablecer la contraseña (versión de token). Bloqueo temporal tras intentos fallidos y límite por IP.
- **CSRF y origen:** sin cookies no hay CSRF clásico, pero toda escritura exige la cabecera propia `X-OL: 1`. Las conexiones WebSocket validan el origen (`OL_ORIGENES`).
- **Cabeceras:** `helmet` con una política de contenido estricta.
- **Correos:** el navegador nunca recibe listas de correos. Los enlaces de Teams los arma el servidor.
- **Datos:** SQLite local en `OL_DATA` (por defecto `data/`), fuera de git. Las fotos se reprocesan con `sharp` (salen en WebP) y solo se sirven con sesión iniciada.
- **Auditoría:** el panel de administración registra altas, cambios de rol, restablecimientos y accesos fallidos.

## Antes de publicarlo en un servidor

Pon la aplicación detrás de HTTPS, define `OL_URL_PUBLICA` y `OL_ORIGENES` con tu dominio real, mantén `data/` fuera de la web y del control de versiones, y respáldalo (el panel tiene copias de seguridad). No hay llaves ni secretos en este repositorio: si encuentras uno, repórtalo.
