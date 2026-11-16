# datosonline

Catálogo de productos de Mercado Libre con enlaces de afiliado. Sitio estático en HTML, CSS y JavaScript, publicado en [datosonline.cl](https://datosonline.cl) con GitHub Pages.

## Token del panel de administración

El panel de administración guarda los productos directamente en este repositorio. Para eso necesita un token personal de GitHub, que se pega al entrar al panel. El token vence (se recomienda cada 90 días), así que hay que generar uno nuevo cada cierto tiempo.

**Cuándo renovarlo:** GitHub envía un correo unos días antes del vencimiento. Si ya venció, el panel mostrará "El token no es válido o está vencido" al intentar entrar o al guardar.

### Generar un token nuevo

1. Entra a [github.com](https://github.com) con la cuenta dueña del repositorio.
2. Haz clic en tu foto de perfil (arriba a la derecha) y elige **Settings**.
3. En el menú de la izquierda, baja hasta el final y entra a **Developer settings**.
4. Abre **Personal access tokens** y luego **Fine-grained tokens**.
5. Haz clic en **Generate new token** y completa:
   - **Token name:** un nombre descriptivo, por ejemplo `panel-datosonline`.
   - **Resource owner:** tu propia cuenta.
   - **Expiration:** 90 días (o el plazo que prefieras; mientras más corto, más seguro).
   - **Repository access:** elige **Only select repositories** y marca únicamente `datosonline`.
   - **Permissions → Repository permissions:** busca **Contents** y cámbialo a **Read and write**. GitHub agrega solo el permiso **Metadata: Read-only**; déjalo así. No actives ningún otro permiso.
6. Haz clic en **Generate token**, al final de la página.
7. Copia el token de inmediato: GitHub lo muestra una sola vez. Guárdalo en un gestor de contraseñas.
8. Abre el panel de administración, pega el token nuevo y entra.

### Eliminar el token anterior

En la misma lista de **Fine-grained tokens** aparece el token antiguo. Ábrelo y elige **Delete** para que deje de servir. Un token vencido ya no funciona, pero conviene borrarlo para mantener la lista ordenada.

Atajo: en vez de crear uno nuevo, puedes abrir el token existente y elegir **Regenerate token**. Conserva el nombre y los permisos, y solo cambia la clave y la fecha de vencimiento.

### Si el token se filtra

Si pegaste el token en un lugar equivocado (un chat, un correo, un archivo del repositorio), elimínalo de inmediato con **Delete** y genera otro. Con ese token alguien podría modificar el sitio.

### Reglas

- El token nunca se guarda en este repositorio ni en ningún archivo del sitio.
- El panel lo mantiene solo mientras la pestaña está abierta; al cerrarla hay que volver a pegarlo.
- La dirección del panel no se escribe en este archivo: el repositorio es público.

datosonline.cl/gestion-k7x2m9/