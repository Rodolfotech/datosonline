# Tareas 001 — Panel de administración de productos

Basado en `spec.md` (aprobada) y `plan.md` (aprobado). Fecha: 2026-11-15.

El plan supera las 10 tareas, así que se divide en dos partes que se ejecutan en orden. Cada tarea sigue TDD cuando tiene lógica: primero el test en rojo, después el código. Al terminar cada una se corre `node --test` y se actualiza `test/MEMORY.md`.

## Parte A — Sitio público

- [x] **A1. Disponibilidad en la lógica de productos.** `normalizeProduct` entrega `available` y `ribbon`; `getVisibleProducts` deja los no disponibles fuera de "Todo" y de su categoría, y los entrega en `no-disponible`. Cubre RF-43, RF-44, RF-46, RF-37.
  Hecho cuando: los tests nuevos de `test/products.test.js` pasan y un producto sin `available` sigue visible.
  Hecha el 2026-11-15: `src/lib/products.js` y 4 tests nuevos; `node --test` con 20 de 20 en verde.

- [x] **A2. Categoría "No disponible" calculada.** `getSiteCategories` en `src/lib/categories.js`; navbar, footer, grilla y `main.js` la usan en vez de la lista fija. Cubre RF-44, RF-45.
  Hecho cuando: con un producto no disponible la categoría aparece al final del navbar y del footer, y sin ninguno no aparece; tests de `test/categories.test.js` en verde.
  Hecha el 2026-11-15: `getSiteCategories` y 5 tests nuevos; `node --test` con 25 de 25 en verde; comprobado en navegador con y sin un producto no disponible.

- [x] **A3. Cinta "NO DISPONIBLE" en la card.** Franja tipo cinta policial sobre el área de fotos, en variante horizontal a media altura o diagonal, visible en todas las fotos de la galería y con texto para lectores de pantalla. Cubre RF-43.
  Hecho cuando: capturas a 1280 px y 375 px muestran ambas variantes sin tapar las flechas de la galería ni desbordar la card.
  Hecha el 2026-11-15: `.ribbon` en `src/style.css` y marcado en `product-card.js`; revisada a 1280 px y 375 px con galería, con etiqueta y sin fotos. Sin lógica nueva, por eso no suma tests; `node --test` sigue en 25 de 25.

- [x] **A4. Botón desactivado y código oculto.** En un producto no disponible, "Ver precio" pasa a botón desactivado "No disponible" y se desactivan versiones y "Compartir"; se quita el código `DO-00N` de todas las cards. Cubre RF-50, RF-51.
  Hecho cuando: en la card no disponible ningún control abre un enlace de Mercado Libre, y ninguna card muestra el código.
  Hecha el 2026-11-15: `product-card.js` y `src/style.css`; comprobado en navegador que las cards no disponibles no contienen ningún enlace `meli.la` y que ninguna card muestra `DO-00N`. `node --test` en 25 de 25.

- [x] **A5. Modal de confirmación reutilizable.** `src/components/confirm-dialog.js` y sus estilos: recibe título, mensaje y textos de los botones, y devuelve si se confirmó. Cubre RF-30, RF-52, RF-53.
  Hecho cuando: en una página de prueba, "Cancelar", Escape y el clic fuera devuelven "no", el botón principal devuelve "sí", y el foco queda dentro del modal mientras está abierto.
  Hecha el 2026-11-15: `confirmDialog()` en `src/components/confirm-dialog.js` y estilos `.dialog`; probado en navegador real a 1280 px y 375 px (Cancelar, Eliminar, Escape, clic fuera, página de fondo sin responder). Sin lógica pura, por eso no suma tests; `node --test` en 25 de 25.

- [x] **A6. Archivos de datos en formato generado.** `src/lib/data-file.js` (convertir a texto y de vuelta) y reescritura de `products.js` y `categories.js` con ese formato. Cubre RF-36, RF-37.
  Hecho cuando: `test/data-file.test.js` pasa y el sitio muestra los cuatro productos y las tres categorías igual que antes del cambio (comparación de capturas).
  Hecha el 2026-11-15: `src/lib/data-file.js`, 6 tests nuevos y los dos archivos de datos reescritos; datos idénticos a los anteriores y página renderizada idéntica (títulos, enlaces, versiones, etiquetas, características y fotos). `node --test` en 31 de 31. Parte A completa.

## Parte B — Panel

- [x] **B1. Lógica del catálogo.** `src/lib/catalog.js`: siguiente código, agregar al inicio, editar, eliminar con sus fotos, categorías nuevas sin duplicar, nombre reservado, mensaje del cambio. Cubre RF-12, RF-17, RF-22, RF-23, RF-31, RF-32, RF-40, RF-41, RF-47, RF-49, RNF-7.
  Hecho cuando: `test/catalog.test.js` pasa y ninguna función modifica la lista que recibe.
  Hecha el 2026-11-15: `src/lib/catalog.js` y 18 tests nuevos; `node --test` en 49 de 49.

- [x] **B2. Lógica del formulario.** `src/lib/product-form.js`: validación, límite de 6 características y 10 fotos, enlaces solo `https://meli.la/…`, conversión formulario ↔ producto. Cubre RF-14, RF-15, RF-16, RF-18, RF-21, RF-39, RF-42.
  Hecho cuando: `test/product-form.test.js` pasa, incluidos los enlaces rechazados y los productos antiguos.
  Hecha el 2026-11-15: `src/lib/product-form.js` y 18 tests nuevos; los cuatro productos publicados se cargan y se guardan sin cambios. `node --test` en 67 de 67.

- [x] **B3. Cliente de GitHub: ingreso y lectura.** `gestion-k7x2m9/github-client.js`: validar el token (válido, con acceso y con escritura) y cargar el catálogo. Cubre RF-2, RF-3, RF-6, RF-9.
  Hecho cuando: `test/github-client.test.js` pasa con un `fetch` falso, cada error devuelve su mensaje en español y el token solo viaja a `api.github.com`.
  Hecha el 2026-11-15: `gestion-k7x2m9/github-client.js` (`validateToken`, `loadCatalog`) y 14 tests nuevos con `fetch` falso; `node --test` en 81 de 81. Formas de las respuestas confirmadas contra la documentación y la API real de GitHub (solo lectura).

- [x] **B4. Cliente de GitHub: publicar en un solo commit.** Datos, fotos nuevas y fotos borradas en un commit; detección de cambios ajenos; ningún fallo deja el sitio a medias. Cubre RF-27, RF-31, RF-33, RF-34, RF-35, RNF-7.
  Hecho cuando: los tests demuestran que `main` solo se mueve en el último paso y que un cambio ajeno o un fallo intermedio no lo mueven.
  Hecha el 2026-11-15: `publish()` en `gestion-k7x2m9/github-client.js` y 11 tests nuevos; `node --test` en 92 de 92. Sin probar contra GitHub real: requiere el token del dueño (prueba final, B10).

- [x] **B5. Página del panel e ingreso.** `index.html` (sin indexar, política de seguridad de contenido), `session.js`, vista de ingreso y "Cerrar sesión". Cubre RF-1, RF-4, RF-5, RF-7, RF-8, RF-38.
  Hecho cuando: sin sesión solo se ve el formulario del token, un token inválido muestra su mensaje, y al cerrar sesión o la pestaña se vuelve a pedir.
  Hecha el 2026-11-15: `gestion-k7x2m9/index.html`, `panel.js`, `panel.css` y `session.js`; probada en navegador a 1280 px y 375 px contra un GitHub simulado (token vacío, inválido, solo lectura, sin conexión, correcto, vencido en sesión, cerrar sesión). La política de seguridad de contenido bloquea envíos a cualquier servidor que no sea `api.github.com`. `node --test` en 92 de 92.

- [x] **B6. Listado y eliminación.** Productos con portada, título, categoría y aviso de no disponible; "Editar" y "Eliminar" con el modal de A5. Cubre RF-9, RF-10, RF-30, RF-31, RF-48, RF-52.
  Hecho cuando: el listado muestra los cuatro productos actuales y "Eliminar" abre el modal con el mensaje y el título correctos.
  Hecha el 2026-11-15: listado y eliminación en `gestion-k7x2m9/panel.js`; probado en navegador a 1280 px y 375 px contra un GitHub simulado (cancelar, Escape, clic fuera, fallo al guardar, cambio ajeno, eliminación correcta con sus fotos, token vencido). El botón "Editar" se agrega en B7, junto con el formulario. `node --test` en 92 de 92.

- [x] **B7. Formulario de producto.** Todos los campos, categoría nueva, características, versiones, estado no disponible con elección de cinta, errores junto a cada campo. Cubre RF-11, RF-13, RF-14 a RF-16, RF-22, RF-41, RF-42, RF-49.
  Hecho cuando: a 375 px se puede completar el formulario entero, y cada error de B2 se ve junto a su campo.
  Hecha el 2026-11-15: formulario en `gestion-k7x2m9/panel.js`, con "Agregar producto" y "Editar" en el listado; probado en navegador a 1280 px y 375 px (errores por campo, categoría nueva y reservada, 6 características, versiones, etiqueta, no disponible con cinta, descartar cambios, carga de los 4 productos publicados). Las fotos son B8 y la vista previa y publicación, B9. `node --test` en 92 de 92.

- [x] **B8. Fotos.** `photos.js`: elegir, reducir a 800 px, quitar, reordenar, contador y rechazo de archivos que no son imagen. Cubre RF-18, RF-19, RF-20, RF-39.
  Hecho cuando: una foto de 4000 px queda con 800 px de lado mayor, un PDF se rechaza con su nombre y la foto 11 no se agrega.
  Hecha el 2026-11-15: `gestion-k7x2m9/photos.js` (reduce a 800 px, WebP o JPEG) y la sección de fotos en `panel.js`; `src/lib/product-form.js` con 12 tests nuevos. Probado en navegador a 1280 px y 375 px: 4000x3000 queda en 800x600, un PDF y un archivo falso se rechazan con su nombre, la foto 11 no se agrega, se puede mover, quitar y cambiar la portada, y los botones quedan dentro de cada foto. `node --test` en 98 de 98.

- [x] **B9. Vista previa y publicación.** Card real en vista previa, "Publicar" y "Volver a editar", estado "Publicando…", confirmación, conservación del formulario ante errores y aviso al salir con cambios. Cubre RF-25 a RF-29, RF-33, RF-34, RF-48.
  Hecho cuando: con un `fetch` falso que falla, el formulario conserva lo escrito y permite reintentar; el doble clic en "Publicar" envía una sola vez.
  Hecha el 2026-11-15: vista previa con la card real, "Publicar" y "Volver a editar" en `gestion-k7x2m9/panel.js`. Probado en navegador a 1280 px y 375 px contra un GitHub simulado: fallo de GitHub (el formulario conserva todo y se reintenta), doble clic (un solo commit), producto nuevo con categoría nueva y foto, edición quitando una foto (la foto se borra del repositorio), cambio ajeno (no se publica y el catálogo se recarga), sesión vencida (vuelve al ingreso y, al entrar de nuevo, el formulario sigue con lo escrito). `node --test` en 98 de 98. Limitación conocida: en la vista previa de una categoría nueva, la card no muestra su nombre (usa las categorías publicadas); se ve bien después de publicar.

- [x] **B10. Cierre.** Carpeta del panel en `deploy.yml`, MEMORY.md, revisión a 375 px sin errores en consola, y lista de la prueba final que hace el dueño con su token (criterios 1 a 4 y 10 de la spec). Cubre los criterios de finalización.
  Hecho cuando: `node --test` pasa completo y el dueño tiene la lista de pasos de su prueba final.
  Hecha el 2026-11-15: `.github/workflows/deploy.yml` copia `gestion-k7x2m9/` a la publicación; se verificó que todos los archivos que importa el panel se publican. `node --test` en 98 de 98. Revisión final a 375 px y 1280 px sin errores de la aplicación (los 404 de `favicon.ico` ya existían en el sitio). La lista de pasos para la prueba final con el token real se entregó en el chat, no en el repositorio, porque la dirección del panel no se escribe en archivos públicos.
