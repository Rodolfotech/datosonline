# MEMORY.md
datosonline
Memoria del proyecto entre sesiones. Máximo ~50 líneas.

## Estado actual
- Sitio estático en HTML, CSS y JavaScript puros: sin Vite, sin Tailwind, sin dependencias ni compilación. Se abre con Live Server o cualquier servidor estático. Tests: `pnpm test` (o `node --test`).
- Todos los estilos están en `src/style.css` (CSS propio con clases por componente: `.navbar__*`, `.footer__*`, `.card__*`); los tokens de marca son variables `--ink`, `--accent`, etc.
- Componentes activos: `<site-navbar>` y `<site-footer>` (`src/components/`).
- `<product-card>` y `<product-grid>` activos: la portada lista los productos de `src/data/products.js`, filtrados por la categoría de la URL.
- Pendiente: portada con buscador, chips de categoría con contador y selector de orden.

## Decisiones (y por qué)
- Constitución aprobada el 2026-11-15 en `docs/constitution.md` (6 principios).
- Navbar y footer son Web Components sin Shadow DOM: reutilizables en cualquier página con una etiqueta, sin dependencias, y el CSS global les aplica.
- Las categorías viven en `src/data/categories.js`; navbar y footer se generan desde ahí, así agregar una categoría es agregar una línea.
- La lógica pura está en `src/lib/categories.js` (sin DOM) para probarla con `node --test`.
- La categoría activa se lee de la URL: `./?categoria=<slug>`; `./` es "Todo".
- Por el crecimiento de categorías: el navbar muestra 4 en escritorio y el resto bajo "Más"; el footer muestra las primeras 8.
- Producto: solo `code`, `title`, `category` y `url` son obligatorios; el resto es opcional (compatibilidad hacia atrás). Sin `url` https no se muestra.
- Cards: texto `ink` sobre naranja en "Ver precio" y etiquetas (mejor contraste); el navbar aún usa blanco sobre naranja.
- El enlace de afiliado lleva `rel="sponsored nofollow noopener noreferrer"`; compartir envía ese mismo enlace.
- Fotos: van en `img/<código en minúsculas>/` en WebP (máx. 800 px) y se listan en `images`; con varias, la card muestra una galería con flechas y deslizamiento. El campo antiguo `image` sigue funcionando.
- Versiones: un producto con un enlace de afiliado por versión usa `variants: [{ label, url }]`; la card muestra un selector y "Ver precio" abre el enlace de la versión elegida (la primera viene marcada). `url` sigue sirviendo para productos de un solo enlace.
- Protección de contenido (pedido del dueño): `user-select: none` en toda la página y fotos sin eventos de puntero, en `src/style.css`. Es disuasivo: no impide capturas ni abrir la URL directa de una foto.
- Popover reutilizable: `<info-popover text="...">` (`src/components/popover.js`) envuelve cualquier enlace o botón y muestra el texto al pasar el mouse o enfocar con teclado. Se usa en "Ver precio" para avisar que redirige a Mercado Libre. En pantallas táctiles no hay hover; ahí informa la nota bajo el botón.
- Características de la card: ocultas al inicio tras el botón "Ver características"; se despliegan mientras el mouse está encima (solo con puntero) y quedan abiertas con un clic (necesario en táctiles y teclado). Pedido del dueño.
- La barra de scroll de la página está oculta por CSS (pedido del dueño); el desplazamiento sigue funcionando.
- Fuentes locales en `src/fonts/` (Archivo Black e Inter variable, subconjunto latino), cargadas con `@font-face`; no se usa Google Fonts.
- Se quitaron Tailwind y Vite (pedido del dueño, 2026-11-15) porque GitHub Pages y Live Server sirven los archivos tal cual y no encontraban los estilos.

- Panel, fotos: se agregan con el botón o arrastrándolas sobre la sección de fotos (pedido del dueño, 2026-11-16). Soltar fuera de esa zona no abre la imagen, para no perder el formulario.

- Vista previa pendiente de aprobación (2026-11-16, sin commit): una tarjeta por versión (`getCards`), título con versión ("Producto • 256 GB"), botón "Ver precio en Mercado Libre" con popover, sin características, sin selector de versiones ni nota bajo el botón, y enlace directo por tarjeta (`datosonline.cl/#<cardId>`, p. ej. `#iphone-17-pro-max-256-gb`). Pendiente: buscador, tamaño de letra y decisión sobre el contador ("6 productos" cuenta tarjetas).

- Panel: no se pueden agregar ni editar características (pedido del dueño, 2026-11-16). Las que ya tienen los productos se guardan tal como están; no se muestran en la tarjeta.

- Panel: no se pueden agregar versiones nuevas (pedido del dueño, 2026-11-16). Cada producto se publica con un enlace; los productos que ya tienen varias versiones las conservan y pueden quitarse una.

## Aprendizajes y errores a evitar
- `src/data/products.js` y `categories.js` están en formato generado (JSON estricto dentro de `export const … = [ … ];`, con cabecera de comentarios). No editarlos a mano con otro formato: se escriben con `serializeDataFile` y se leen con `parseDataFile` (`src/lib/data-file.js`); un test falla si se salen del formato. La descripción de los campos está al inicio de `src/lib/products.js`.
- No reintroducir pasos de compilación: el sitio debe funcionar servido "tal cual" desde la raíz del repositorio. `.github/workflows/deploy.yml` solo corre los tests y copia los archivos.
- Todas las rutas internas son relativas (`./`, `img/...`, `src/...`), para que funcione en `rodolfotech.github.io/datosonline/` y también con dominio propio.
- `position: sticky` debe ir en el elemento `<site-navbar>`, no en el `<header>` interno.
- Despliegue: `.github/workflows/deploy.yml` copia `gestion-k7x2m9/` junto al sitio. Si se agrega un archivo nuevo al panel que no esté en esa carpeta o en `src/`, revisar que el workflow también lo copie.
- `opencode.json` contiene la clave de Context7 y está en `.gitignore`; no subirlo.

## Próximos pasos
- Panel de administración (`specs/001-panel-administracion/`): spec y plan aprobados el 2026-11-15; `tasks.md` listo (parte A sitio público, parte B panel). Hecha A1 (lógica de disponibilidad en `src/lib/products.js`: `available`, `ribbon`, `UNAVAILABLE_SLUG`); hecha A2 (`getSiteCategories` en `src/lib/categories.js`: navbar, footer, grilla y `main.js` muestran "No disponible" solo si hay productos así); hecha A3 (cinta `.ribbon--horizontal` / `.ribbon--diagonal` fuera de la galería, bajo flechas, contador y etiquetas); hecha A4 (no disponible: botón "No disponible", versiones y compartir desactivados, sin enlaces `meli.la` en la card; el código `DO-00N` ya no se muestra en ninguna card, sigue existiendo en los datos); hecha A5 (modal reutilizable: `confirmDialog({ title, message, detail, confirmLabel, cancelLabel, tone })` en `src/components/confirm-dialog.js`, devuelve una promesa con verdadero o falso; usa `<dialog>` nativo); hecha A6; parte A completa. Hecha B1 (`src/lib/catalog.js`: código siguiente, agregar primero, editar, eliminar, categorías nuevas; solo devuelve para borrar fotos bajo `img/`); hecha B2 (`src/lib/product-form.js`: validación, enlaces solo `https://meli.la/<código>`, formulario ↔ producto); hecha B3 (`gestion-k7x2m9/github-client.js`: valida el token y lee el catálogo desde GitHub; recibe `fetch` para probarse con uno falso); hecha B4 (`publish()`: datos + fotos nuevas + fotos borradas en un commit; `main` se mueve al final y sin forzar; detecta cambios ajenos comparando los dos archivos de datos; solo toca `img/` y los dos archivos de datos); hecha B5 (página del panel en `gestion-k7x2m9/`: ingreso con token en `sessionStorage`, cerrar sesión, `noindex` y CSP que solo permite conectar a `api.github.com`; `panel.js` es el único archivo del panel que toca el DOM); hecha B6 (listado con portada, categoría y aviso de no disponible; "Eliminar" usa `confirmDialog` y publica un commit que quita el producto y sus fotos); hecha B7 (formulario de producto en `panel.js`: los valores viven en `state.form.values` y se validan con `validateProductForm`; "No disponible" solo aparece al editar); hecha B8 (fotos: `gestion-k7x2m9/photos.js` reduce a 800 px; la sección de fotos del formulario sube hasta 10); hecha B9 (vista previa con `product-card` real; "Publicar" hace un solo commit con `publish()`; ante fallo el formulario conserva lo escrito; sesión vencida guarda el formulario en memoria y lo recupera al entrar); B10 hecha. Panel de administración completo (B1 a B10); pendiente la prueba final con el token real del dueño y el commit que hace el dueño. Se implementa de a una tarea, deteniéndose tras cada una. Dirección aprobada del panel: carpeta `gestion-k7x2m9/` (no escribirla en README ni robots.txt). El README explica cómo generar y renovar el token.
- Confirmar la URL real de Instagram en `src/data/site.js`.
- Construir el buscador de la portada con `id="buscador"` (el ícono de lupa del navbar apunta ahí).
- Categorías actuales: Smartphones (antes "Tecnología"), Colchones y PC Gamer. Se quitaron los productos de ejemplo DO-002 y DO-003 (sin fotos ni enlace real). Todos los productos tienen enlace de afiliado real (meli.la).
