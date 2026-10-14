# Accesos a Oficina Live

Cómo entrar, cómo crear perfiles y qué puede hacer cada rol. Todo corre en tu equipo salvo que lo publiques.

## Cómo abrirla

| Quieres | Haz esto | Dirección |
|---|---|---|
| Usar la versión local con tus datos (todo vacío al empezar) | `iniciar.command` (doble clic en macOS) o `npm run local` | http://localhost:5190 |
| Ver la demostración con datos de ejemplo | `demo.command` o `npm run demo` | http://localhost:5190 |
| Ver la demostración desde otro equipo de tu red | `demo-celular.command` o `npm run demo:lan` | `http://<IP de tu equipo>:5190` |

- La interfaz usa el puerto 5190 y la API el 8790. Enciende una versión a la vez, o cambia los puertos con `OL_WEB_PUERTO` y `OL_PUERTO`.
- Deja la terminal abierta mientras la usas. Con `Ctrl+C` se apaga.
- Los datos de cada versión viven en su propia carpeta y no se mezclan: `data-local/` (versión local) y `data-demo/` (demostración). Ninguna va a git.
- Oficina Live es solo para computador. En un celular se pide el sitio de escritorio.

## Primer ingreso a la versión local

1. Define el correo de la primera cuenta de administración. Es obligatorio cuando la base no tiene cuentas:

   ```bash
   OL_ADMIN_CORREO=tu@correo.com npm run local
   ```

   Opcional: `OL_ADMIN_NOMBRE="Tu Nombre"` (por defecto, «Administración»). Con `iniciar.command`, el script pide el correo la primera vez.
2. El servidor crea la cuenta, todavía sin contraseña, y muestra un enlace de activación en la consola. También lo deja en `data-local/ENLACE-ADMIN.txt` (solo tu usuario puede leerlo). Sirve **una sola vez** y vence a los **7 días** (se puede cambiar en Configuración).
3. Ábrelo: sale **Crea tu contraseña**. Elige una que cumpla las reglas y entra. Sigues al creador de personaje y luego a la oficina, que empieza vacía.
4. **Borra `data-local/ENLACE-ADMIN.txt`** cuando lo uses. Después entras con tu correo y tu contraseña.
5. Si pierdes el enlace o vence antes de usarlo, borra el archivo y reinicia con `OL_ADMIN_CORREO` definido: el servidor genera uno nuevo y el anterior deja de servir. Una vez activada la cuenta, no se vuelve a generar nada.

Si la base ya tiene cuentas, `OL_ADMIN_CORREO` no hace falta.

No hay contraseñas fijas ni cuentas de ejemplo en la versión local.

## Crear los perfiles de las demás personas

En **Administración > Cuentas**:

- **Crear perfil**: nombre, correo (obligatorio, único), rol, cargo y paquetes de acceso opcionales. La plataforma muestra el **enlace de activación** una sola vez, con «Copiar enlace». Envíalo por un canal privado; la persona lo abre y crea su contraseña.
- **Crear varios**: pega una lista, una persona por línea, `Nombre, correo, rol` (el rol es opcional: persona, constructor o administración). Sale una tabla de enlaces para copiar o descargar como CSV (se arma en tu navegador; bórralo después).
- Una cuenta pendiente sale como **Pendiente de activación** con su vencimiento. En su menú: **Generar enlace nuevo** (el anterior deja de servir). El servidor no guarda el enlace, solo su huella, así que un enlace ya mostrado no se puede volver a ver: se genera otro.
- **Enviar por correo** está deshabilitado hasta que se configure el correo del servidor. En **Configuración > Correo del servidor** puedes dejar escritos los datos SMTP; hoy no se envía nada.
- **Dominios de correo permitidos** (Configuración > Seguridad): vacío, que es el valor por defecto, permite cualquier dominio. Para restringir los perfiles a tu organización, escribe sus dominios separados por coma, por ejemplo `empresa.com`.
- Un correo sin activar que intenta ingresar recibe el mismo mensaje que una contraseña mala, para no revelar si existe.

Cuando publiques la plataforma en un servidor, fija `OL_URL_PUBLICA` con la dirección pública para que los enlaces de activación salgan completos.

## Roles

| Rol | Qué puede hacer |
|---|---|
| Administración | Arma la oficina y administra cuentas, solicitudes, actividad y configuración. |
| Constructor | Arma y publica la oficina. No administra cuentas ni configuración. |
| Persona | Camina por la oficina, marca su estado y habla con otras personas. |

## Cómo armar la oficina desde cero

La oficina publicada empieza **vacía**: solo el edificio del piso 4 (suelo, muros exteriores, balcón de la esquina sureste con su puerta y dos casillas de llegada). En el modo editor, panel **Salas**, puedes dibujar habitaciones o cargar una plantilla de ejemplo, como **Piso 4 Naos** (la planta completa con muebles, zonas y áreas). Cargarla reemplaza el borrador, se puede deshacer y no cambia lo publicado hasta que publiques.

## Respaldos

Cada respaldo (manual o automático) guarda la base de datos y una copia de la carpeta de fotos de perfil junto a ella (una carpeta con el mismo nombre del respaldo y terminada en `.fotos`). Todo queda en `<carpeta de datos>/respaldos/`.

## Cuentas de la demostración (solo en `data-demo`)

Todas usan la contraseña de demostración **DemoLocal2026x**, que solo vale en este modo.

| Usuario | Rol | Para ver |
|---|---|---|
| `demo.admin` | Administración | Todo: resumen, cuentas, solicitudes, actividad y configuración |
| `demo.constructor` | Constructor | Lo que ve quien arma la oficina |
| `demo.ana`, `demo.camilo`, `demo.valentina`, `demo.sebastian`, `demo.maria`, `demo.julian` | Persona | La experiencia de quien camina por la oficina |
| `demo.nuevo` | Persona, primer ingreso | La pantalla de cambio de contraseña obligatoria |

## Variables de entorno (`OL_*`)

La lista completa, con ejemplos, está en [`.env.example`](../.env.example).

| Variable | Para qué sirve |
|---|---|
| `OL_ADMIN_CORREO` | Correo de la primera cuenta de administración. Obligatoria si la base no tiene cuentas. |
| `OL_ADMIN_NOMBRE` | Nombre de esa cuenta. Por defecto, «Administración». |
| `OL_DEMO`, `OL_LOCAL` | Modo demostración (`data-demo`) o versión local (`data-local`). |
| `OL_PUERTO`, `OL_HOST` | Puerto (8790) y dirección de escucha (127.0.0.1) del servidor. |
| `OL_DATA` | Carpeta de datos (base, respaldos, fotos y secreto). |
| `OL_SECRETO` | Secreto para firmar sesiones. Si falta, se genera en `secreto.key`. |
| `OL_PROXY`, `OL_ORIGENES` | Detrás de un proxy: confiar en su IP y orígenes permitidos del WebSocket. |
| `OL_URL_PUBLICA` | Dirección pública para armar los enlaces de activación. |
| `OL_WEB_PUERTO`, `OL_API` | Puerto de la interfaz de desarrollo y dirección de la API a la que reenvía. |

## Verificar que todo funciona (sin tocar tus datos)

- `npm run typecheck` y `npm test` (shared, servidor, interfaz y arte). Las pruebas de servidor usan bases temporales.
- Para probar el arranque sin gastar tu enlace real, apunta a una carpeta temporal: `OL_LOCAL=1 OL_DATA=/tmp/ol-prueba OL_PUERTO=8799 OL_ADMIN_CORREO=prueba@ejemplo.com npm run local -w @ol/server`. Su enlace queda en `/tmp/ol-prueba/ENLACE-ADMIN.txt`.

## Qué todavía no está

El envío real de correos (la interfaz está lista) y la biblioteca de arte dentro de la plataforma (las hojas de contacto se generan en `arte/salida/`).
