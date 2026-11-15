# MEMORY.md
datosonline
Memoria del proyecto entre sesiones. Máximo ~50 líneas.

## Estado actual
- Proyecto Vite + Tailwind 4 con pnpm. Comandos: `pnpm dev`, `pnpm build`, `pnpm test`.
- Tokens globales de marca (colores y tipografías) en `src/style.css`.
- Componentes activos: `<site-navbar>` y `<site-footer>` (`src/components/`).
- `<product-card>` y `<product-grid>` activos: la portada lista los productos de `src/data/products.js`, filtrados por la categoría de la URL.
- Pendiente: portada con buscador, chips de categoría con contador y selector de orden.

## Decisiones (y por qué)
- Navbar y footer son Web Components sin Shadow DOM: reutilizables en cualquier página con una etiqueta, sin dependencias, y las clases de Tailwind siguen funcionando.
- Las categorías viven en `src/data/categories.js`; navbar y footer se generan desde ahí, así agregar una categoría es agregar una línea.
- La lógica pura está en `src/lib/categories.js` (sin DOM) para probarla con `node --test`.
- La categoría activa se lee de la URL: `/?categoria=<slug>`; `/` es "Todo".
- Por el crecimiento de categorías: el navbar muestra 4 en escritorio y el resto bajo "Más"; el footer muestra las primeras 8.
- Producto: solo `code`, `title`, `category` y `url` son obligatorios; el resto es opcional (compatibilidad hacia atrás). Sin `url` https no se muestra.
- Cards: texto `ink` sobre naranja en "Ver precio" y etiquetas (mejor contraste); el navbar aún usa blanco sobre naranja.
- El enlace de afiliado lleva `rel="sponsored nofollow noopener noreferrer"`; compartir envía ese mismo enlace.
- Fotos: van en `public/img/<código en minúsculas>/` en WebP (máx. 800 px) y se listan en `images`; con varias, la card muestra una galería con flechas y deslizamiento. El campo antiguo `image` sigue funcionando.
- Versiones: un producto con un enlace de afiliado por versión usa `variants: [{ label, url }]`; la card muestra un selector y "Ver precio" abre el enlace de la versión elegida (la primera viene marcada). `url` sigue sirviendo para productos de un solo enlace.
- Protección de contenido (pedido del dueño): `user-select: none` en toda la página y fotos sin eventos de puntero, en `src/style.css`. Es disuasivo: no impide capturas ni abrir la URL directa de una foto.
- Fuentes instaladas con pnpm (@fontsource), no desde Google Fonts.

## Aprendizajes y errores a evitar
- `position: sticky` debe ir en el elemento `<site-navbar>`, no en el `<header>` interno.
- `opencode.json` contiene la clave de Context7 y está en `.gitignore`; no subirlo.

## Próximos pasos
- Confirmar la URL real de Instagram en `src/data/site.js`.
- Construir el buscador de la portada con `id="buscador"` (el ícono de lupa del navbar apunta ahí).
- DO-001, DO-004 y DO-007 ya tienen enlaces reales (meli.la); reemplazar las URL de ejemplo de DO-002 y DO-003 y agregar las fotos de los otros productos (DO-001 ya tiene).
