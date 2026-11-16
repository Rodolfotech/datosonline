# Plan técnico 001 — Panel de administración de productos

Estado: aprobado por el dueño (2026-11-15)
Fecha: 2026-11-15
Basado en: `spec.md` (aprobada), `docs/constitution.md`, `test/AGENT.md`.

Este plan no contiene código. Describe el CÓMO; cada parte indica los RF que cubre.

## 0. Resumen en simple

- El sitio público sigue leyendo los mismos dos archivos de datos (`src/data/products.js` y `src/data/categories.js`). El visitante no nota nada salvo lo que pide la spec.
- El panel es una página aparte, en una carpeta de nombre no adivinable. Lee y escribe esos dos archivos y las fotos directamente en GitHub, con el token del dueño.
- Cada "Publicar" o "Eliminar" es **un solo commit** que incluye datos y fotos: o entra todo o no entra nada.
- GitHub Pages está en modo "Deploy from a branch" (rama `main`, raíz): cada commit del panel republica el sitio solo, en 1 a 2 minutos.

## 1. Archivos

### Nuevos

| Archivo | Responsabilidad única | RF |
|---|---|---|
| `gestion-k7x2m9/index.html` | Página del panel: `noindex`, política de seguridad de contenido, carga estilos y `panel.js`. El nombre de la carpeta es la "dirección oculta". | RF-1, RF-7, RF-8, RF-38 |
| `gestion-k7x2m9/panel.js` | Orquesta las vistas del panel (ingreso, listado, formulario, vista previa) y conecta formulario, lógica y GitHub. Único archivo del panel que toca el DOM. | RF-1, RF-9 a RF-11, RF-13, RF-25 a RF-29, RF-33, RF-48 |
| `gestion-k7x2m9/panel.css` | Estilos propios del panel (formulario, listado, estados). Reutiliza los tokens de `src/style.css`. | RNF-2, RNF-6 |
| `gestion-k7x2m9/github-client.js` | Único lugar que habla con la API de GitHub: validar token, leer catálogo, publicar un commit. Recibe `fetch` como parámetro para poder probarlo con uno falso. | RF-2, RF-3, RF-6, RF-27, RF-31, RF-33 a RF-35, RNF-7 |
| `gestion-k7x2m9/session.js` | Guarda, lee y borra el token en `sessionStorage`. | RF-4, RF-5 |
| `gestion-k7x2m9/photos.js` | Convierte un archivo elegido en una foto optimizada (máx. 800 px) usando el lienzo del navegador. | RF-19, RF-20 |
| `src/lib/catalog.js` | Lógica pura del catálogo: agregar, editar, eliminar, siguiente código, categorías nuevas, disponibilidad. | RF-12, RF-17, RF-22, RF-23, RF-31, RF-32, RF-40, RF-41, RF-46, RF-47, RF-49 |
| `src/lib/product-form.js` | Lógica pura del formulario: validar y convertir lo escrito en un producto. | RF-14 a RF-16, RF-18, RF-21, RF-39, RF-42 |
| `src/lib/data-file.js` | Lógica pura para convertir los archivos de datos a texto y de vuelta. | RF-36, RF-37 |
| `src/components/confirm-dialog.js` | Modal de confirmación reutilizable. | RF-30, RF-52, RF-53 |
| `test/catalog.test.js`, `test/product-form.test.js`, `test/data-file.test.js`, `test/github-client.test.js` | Tests de lo anterior. | RNF-5 |

`gestion-k7x2m9` fue aprobada por el dueño. No se agrega a `robots.txt` ni se escribe en `README.md` (eso la delataría).

### Modificados

| Archivo | Cambio | RF |
|---|---|---|
| `src/data/products.js` | Mismo contenido, reescrito en formato generado (ver 5.1). Se agregan los campos opcionales `available` y `ribbon`. | RF-36, RF-37 |
| `src/data/categories.js` | Mismo contenido, en formato generado. | RF-24, RF-36 |
| `src/lib/products.js` | Disponibilidad: `available` y `ribbon` en `normalizeProduct`; `getVisibleProducts` separa disponibles y no disponibles. | RF-43, RF-44, RF-51 |
| `src/lib/categories.js` | `getSiteCategories` agrega la categoría "No disponible" cuando corresponde; `slugify`. | RF-23, RF-45 |
| `src/components/product-card.js` | Cinta, botón desactivado, se quita el código visible. | RF-43, RF-50, RF-51 |
| `src/components/product-grid.js`, `navbar.js`, `footer.js`, `src/main.js` | Usan `getSiteCategories` en vez de la lista fija. | RF-44, RF-45 |
| `src/style.css` | Cinta (`.ribbon`), botón desactivado, modal (`.dialog`). | RF-43, RF-51, RF-53 |
| `test/products.test.js`, `test/categories.test.js` | Casos nuevos. | — |
| `.github/workflows/deploy.yml` | Agrega la carpeta del panel a la copia, por si algún día se vuelve a ese modo de publicación. | — |
| `test/MEMORY.md` | Estado y decisiones. | — |
| `README.md` | Proceso para generar y renovar el token (pedido del dueño). Ya escrito. | RF-3 |

## 2. Funciones puras

### `src/lib/data-file.js`
- `serializeDataFile(exportName, value)` → texto del módulo: comentario de cabecera + `export const <exportName> = <JSON con sangría>;`.
- `parseDataFile(text)` → valor. Toma el texto entre el primer `[` y el último `]` y lo interpreta como JSON. Lanza un error claro si no puede.

### `src/lib/catalog.js`
- `nextProductCode(products)` → `"DO-008"`: mayor número existente + 1, con 3 dígitos.
- `slugify(name)` → minúsculas, sin tildes, espacios a guiones.
- `resolveCategory(categories, name)` → `{ categories, slug }`: devuelve la existente si coincide sin distinguir mayúsculas ni tildes; si no, agrega una nueva al final.
- `isReservedCategoryName(name)` → verdadero para "No disponible" en cualquier forma.
- `addProduct(products, product)` → nueva lista con el producto **al inicio**.
- `updateProduct(products, code, changes)` → nueva lista; conserva código y posición.
- `removeProduct(products, code)` → `{ products, removedImages }`.
- `removedImagePaths(before, after)` → fotos que estaban y ya no están (para borrarlas del repositorio al editar o eliminar).
- `describeChange(action, product)` → mensaje del commit, por ejemplo `Panel: agrega "Colchón Emma"`.

Ninguna modifica la lista recibida.

### `src/lib/product-form.js`
- `MAX_IMAGES = 10`, `MELI_LINK = /^https:\/\/meli\.la\/[A-Za-z0-9]+$/`.
- `isAffiliateLink(url)`.
- `validateProductForm(values)` → lista de `{ field, message }`; vacía si es válido.
- `formToProduct(values, code)` → producto en el formato de datos, sin campos vacíos.
- `productToForm(product)` → valores para cargar el formulario al editar (acepta `url` suelto, `variants`, `image` antiguo).
- `canAddImage(count)`.

### `src/lib/products.js` (cambios)
- `normalizeProduct` agrega `available` (verdadero salvo que el dato diga `false`) y `ribbon` (`"horizontal"` o `"diagonal"`; por defecto `"diagonal"`).
- `getVisibleProducts(products, categorySlug)`:
  - sin categoría → solo disponibles;
  - `"no-disponible"` → solo no disponibles;
  - otra → disponibles de esa categoría.
- `UNAVAILABLE_SLUG = "no-disponible"`.

### `src/lib/categories.js` (cambios)
- `getSiteCategories(categories, products)` → las categorías reales más `{ slug: "no-disponible", name: "No disponible" }` al final, solo si hay algún producto no disponible.

## 3. Algoritmos principales

### 3.1 Ingreso (RF-2, RF-3)
```
al enviar el token:
  pedir a GitHub los datos del repositorio con el token
    401            → "El token no es válido o está vencido"
    403 / 404      → "El token no tiene acceso al repositorio datosonline"
    sin conexión   → "No hay conexión; revisa tu internet"
  pedir a GitHub crear un objeto de prueba vacío (no cambia nada visible)
    403            → "El token solo permite leer; necesita permiso de escritura en Contents"
  si todo responde bien → guardar el token en la sesión y mostrar el listado
```
La comprobación de escritura con un objeto de prueba se confirmará contra la documentación de GitHub al implementar; si no sirve, se reemplaza por la que la documentación indique.

### 3.2 Cargar el catálogo (RF-9, RF-34)
```
leer el commit actual de main                    → recordar su identificador
leer products.js y categories.js de ese commit   → recordar el identificador de cada archivo
convertir con parseDataFile
```

### 3.3 Publicar (RF-27, RF-29, RF-33 a RF-35, RF-40)
```
bloquear el botón y mostrar "Publicando…"
leer otra vez el commit actual de main y los identificadores de los dos archivos de datos
si alguno cambió respecto de lo cargado:
    recargar el catálogo, avisar, conservar el formulario, terminar          (RF-34)
calcular la lista nueva con addProduct / updateProduct (+ resolveCategory)
por cada foto nueva: subirla como objeto suelto (todavía no aparece en el sitio)
armar UN commit sobre el commit actual con:
    products.js nuevo, categories.js si cambió,
    las fotos nuevas en img/<código>/,
    el borrado de las fotos quitadas
mover main a ese commit (sin forzar)
    si GitHub lo rechaza porque main avanzó → tratar como RF-34
si cualquier paso falla → no se movió main: el sitio queda como estaba;
    mostrar el motivo, conservar el formulario, permitir reintentar          (RF-33, RF-35)
si todo bien → confirmar y avisar "se verá en unos minutos"                  (RF-28)
```
Como `main` solo se mueve al final, el visitante ve la versión anterior completa o la nueva completa.

### 3.4 Eliminar (RF-30, RF-31, RF-52)
```
abrir confirm-dialog con el mensaje y el título del producto
si Cancelar / Escape / clic fuera → no hacer nada
si Eliminar → mismo flujo de 3.3 con removeProduct y el borrado de todas sus fotos
```

### 3.5 Foto (RF-19, RF-20, RF-39)
```
si ya hay 10 → avisar y no agregar
si el navegador no puede leerla como imagen → avisar su nombre y seguir con las demás
dibujarla en un lienzo con lado mayor de 800 px como máximo (sin agrandar las pequeñas)
exportar a WebP; si el navegador no lo soporta, a JPEG
nombre: img/<código>/<orden>-<6 caracteres al azar>.<extensión>
```
El nombre al azar evita choques entre fotos de igual nombre y que el navegador muestre una foto vieja guardada en caché.

## 4. Interfaz

### Panel
- **Ingreso:** un campo para el token (tipo contraseña), botón "Entrar" y una ayuda corta de cómo crear el token. Nada más (RF-1).
- **Listado:** una fila por producto con portada, título, categoría y, si corresponde, el aviso "No disponible"; botones "Editar" y "Eliminar". Arriba: "Agregar producto" y "Cerrar sesión" (RF-9, RF-10, RF-48).
- **Formulario:** título; categoría (lista con la opción "Nueva categoría…" que muestra un campo de texto); subcategoría; características (hasta 6, con agregar y quitar); etiqueta y su estilo; versiones (filas de nombre + enlace, con agregar y quitar; con una sola fila el nombre es opcional); fotos (elegir, quitar, subir y bajar de posición, contador "3 de 10"); al editar, interruptor "Producto no disponible" con las opciones de cinta "A media foto" y "En diagonal". Los errores aparecen junto al campo (RF-11 a RF-23, RF-39, RF-41, RF-42).
- **Vista previa:** el mismo `<product-card>` del sitio público con el producto del formulario, y los botones "Publicar" y "Volver a editar" (RF-25, RF-26, RF-48).
- **Salida con cambios sin publicar:** aviso del navegador antes de cerrar o recargar.
- Una sola columna en 375 px; botones de al menos 44 px de alto (RNF-2, RNF-6).

### Sitio público
- **Cinta:** franja amarilla y negra en rayas diagonales con "NO DISPONIBLE" en negro sobre amarillo, superpuesta al área de fotos y fija mientras se desliza la galería, por lo que se ve en todas las fotos. Dos variantes por CSS: horizontal a media altura o rotada en diagonal. Lleva además un texto para lectores de pantalla (RF-43).
- **Botón:** "Ver precio" pasa a ser un botón desactivado con el texto "No disponible"; el selector de versiones y "Compartir" quedan desactivados también, porque comparten el mismo enlace (RF-51).
- **Categoría "No disponible":** aparece al final del navbar y del footer solo si hay productos en ese estado (RF-45).
- **Código:** se quita la etiqueta visible `DO-00N` de la card (RF-50).

### Modal reutilizable
`confirm-dialog.js` exporta una función que recibe título, mensaje, texto de los dos botones y el estilo del botón principal, y devuelve si el usuario confirmó. Usa el elemento nativo `<dialog>`, que ya atrapa el foco, cierra con Escape y oscurece el fondo (RF-30, RF-52, RF-53).

## 5. Decisiones técnicas

### 5.1 Los datos siguen en archivos `.js`, en formato generado
- **Elegido:** `products.js` y `categories.js` siguen siendo módulos (`export const … = [ … ];`), pero su contenido pasa a ser JSON estricto para que el panel pueda leerlos y reescribirlos.
- **Descartado:** `data/productos.json` cargado con `fetch` (lo que sugería el documento de origen). Obligaría a que navbar, footer y grilla esperen una descarga antes de dibujarse, cambiando código que ya funciona y agregando un parpadeo al cargar. Con el formato elegido el sitio público carga exactamente igual que hoy (RNF-4, RF-36).
- **Costo:** se pierden los comentarios explicativos dentro de `products.js`; se mueven a la cabecera generada y a MEMORY.md.
- **Compatibilidad:** los campos no cambian; `available` y `ribbon` son opcionales y su ausencia significa "disponible".

### 5.2 Un commit por operación, no un archivo a la vez
- **Elegido:** armar un commit completo (datos + fotos + borrados) y mover `main` al final.
- **Descartado:** la API de "contenidos", un archivo por llamada (la del ejemplo de origen). Con 10 fotos serían 11 commits y 11 republicaciones, y un fallo a mitad dejaría el producto publicado a medias, contra RF-35.

### 5.3 "No disponible" es una categoría calculada, no guardada
- **Elegido:** el producto conserva su categoría de origen y lleva `available: false`; la categoría "No disponible" se calcula al mostrar.
- **Descartado:** cambiarle la categoría al producto y recordar la anterior en otro campo. Duplicaría información y podría quedar inconsistente; así, volver a disponible es cambiar un solo dato (RF-46, RF-47).

### 5.4 Orden
- **Elegido:** el producto nuevo se inserta al inicio de la lista; el sitio muestra en el orden de la lista (RF-40).
- **Descartado:** un campo de fecha y ordenar al mostrar: más datos y más lógica para el mismo resultado.

### 5.5 Seguridad del panel
- Token solo en `sessionStorage` (RF-4 a RF-6).
- Política de seguridad de contenido en la página del panel: solo se permite cargar código del propio sitio y conectarse a `api.github.com`. Así, aunque hubiera un error, el navegador no deja enviar el token a otro destino (RF-6).
- `noindex, nofollow` y sin referencias desde el sitio público (RF-7, RF-8).
- Todo texto escrito por el dueño se escapa antes de mostrarse, igual que hoy.
- **Descartado:** cifrar o esconder el código del panel. El repositorio es público; la protección aceptada es el token.
- **Recomendación para el token:** de tipo "fine-grained", solo el repositorio `datosonline`, solo permiso "Contents: Read and write", vencimiento de 90 días.

### 5.6 Fotos sin dependencias
- **Elegido:** reducir con el lienzo del navegador.
- **Descartado:** una librería de compresión (prohibido por la constitución) o subir el original (fotos de 5 a 15 MB harían lento el sitio).

## 6. Estrategia de tests

### Automáticos (`node --test`, sin dependencias)
- `data-file.test.js`: ida y vuelta de los dos archivos; el archivo actual convertido conserva los 4 productos idénticos; texto inválido da error claro.
- `catalog.test.js`: siguiente código; producto nuevo queda primero; editar conserva código y posición; eliminar devuelve sus fotos; categoría duplicada con tildes o mayúsculas se reutiliza; "No disponible" es nombre reservado; ninguna función modifica su entrada.
- `product-form.test.js`: campos obligatorios; enlaces aceptados (`https://meli.la/2QGS1m7`) y rechazados (`http://meli.la/x`, `https://mercadolibre.cl/...`, `https://meli.la.evil.com/x`, `javascript:`); versión incompleta; máximo de 6 características y 10 fotos; ida y vuelta formulario ↔ producto, incluidos productos antiguos.
- `products.test.js` y `categories.test.js`: no disponibles fuera de "Todo" y de su categoría; visibles en "no-disponible"; la categoría aparece solo si hay alguno; datos sin `available` siguen visibles.
- `github-client.test.js`: con un `fetch` falso, comprueba el orden de las llamadas, que el token solo viaja a `api.github.com`, que un cambio ajeno detiene la publicación sin mover `main`, y la traducción de cada error a su mensaje.

### De interfaz (navegador, 1280 px y 375 px, consola sin errores)
- Sitio público: card normal sin código; card no disponible con cada cinta; galería con cinta; categoría "No disponible" aparece y desaparece; "Todo" sin no disponibles.
- Panel: ingreso con token inválido; formulario con cada error; vista previa; modal con Eliminar, Cancelar, Escape y clic fuera.
- **Límite de la verificación:** publicar de verdad requiere el token del dueño. La prueba final de punta a punta (criterios 1 a 4 y 10 de la spec) la hace el dueño con su token; el plan no usa ni pide el token para probar.

## 7. Riesgos

- **Caché de GitHub Pages (10 minutos):** tras publicar, un navegador que ya visitó el sitio puede tardar hasta 10 minutos en ver el cambio. El panel siempre lee de GitHub, así que muestra el estado real.
- **Trabajo manual en paralelo:** si el dueño edita `products.js` a mano y lo deja fuera del formato generado, el panel no podrá leerlo y lo dirá. Desde este cambio, el catálogo se edita por el panel.
- **Tamaño:** supera las 10 tareas recomendadas. División en `tasks.md`: (A) sitio público —no disponible, cinta, código oculto, modal— y (B) panel —ingreso, formulario, fotos, publicación—.
