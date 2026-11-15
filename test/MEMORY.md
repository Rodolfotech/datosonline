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
- Fuentes locales en `src/fonts/` (Archivo Black e Inter variable, subconjunto latino), cargadas con `@font-face`; no se usa Google Fonts.
- Se quitaron Tailwind y Vite (pedido del dueño, 2026-11-15) porque GitHub Pages y Live Server sirven los archivos tal cual y no encontraban los estilos.

## Aprendizajes y errores a evitar
- No reintroducir pasos de compilación: el sitio debe funcionar servido "tal cual" desde la raíz del repositorio. `.github/workflows/deploy.yml` solo corre los tests y copia los archivos.
- Todas las rutas internas son relativas (`./`, `img/...`, `src/...`), para que funcione en `rodolfotech.github.io/datosonline/` y también con dominio propio.
- `position: sticky` debe ir en el elemento `<site-navbar>`, no en el `<header>` interno.
- `opencode.json` contiene la clave de Context7 y está en `.gitignore`; no subirlo.

## Próximos pasos
- Confirmar la URL real de Instagram en `src/data/site.js`.
- Construir el buscador de la portada con `id="buscador"` (el ícono de lupa del navbar apunta ahí).
- DO-001, DO-004 y DO-007 ya tienen enlaces reales (meli.la); reemplazar las URL de ejemplo de DO-002 y DO-003 y agregar las fotos de los otros productos (DO-001 ya tiene).
