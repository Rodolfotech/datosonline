# Spec 001 — Panel de administración de productos

Estado: aprobada (2026-11-15)
Fecha: 2026-11-15
Origen: `specs/panel-admistracion/funciones-panel.md`, cinco respuestas del dueño y sus aclaraciones posteriores (producto no disponible, 10 fotos, orden, dirección y enlaces).

## Contexto y objetivo

Hoy, publicar o corregir un producto en datosonline.cl exige editar a mano los archivos del sitio. Eso es lento, propenso a errores y depende de tener el computador de desarrollo a mano.

El objetivo es que el dueño pueda agregar, editar y eliminar productos, con sus fotos, desde una página de administración del propio sitio, usando el computador o el celular, sin tocar archivos y sin contratar ni mantener un servidor.

El sitio no tiene servidor: los cambios se guardan en el repositorio de GitHub del sitio, y lo que autoriza a guardar es una credencial personal del dueño (token de GitHub limitado a ese repositorio). Que la dirección del panel esté oculta es solo disuasivo; la protección real es que sin la credencial no se puede cambiar nada.

## Usuarios / actores

- **Dueño (administrador):** única persona que usa el panel. Tiene la credencial.
- **Visitante:** persona mayor de 30 años que navega el catálogo. Nunca ve ni usa el panel; solo ve el resultado publicado.
- **Curioso o atacante:** alguien que descubre la dirección del panel sin tener la credencial.

## Historias de usuario

- HU-1. Como dueño quiero entrar al panel pegando mi credencial para que solo yo pueda cambiar el catálogo.
- HU-2. Como dueño quiero ver la lista de productos publicados para saber qué hay en el sitio y elegir cuál modificar.
- HU-3. Como dueño quiero agregar un producto con sus fotos, enlaces de afiliado y características para publicarlo sin tocar archivos.
- HU-4. Como dueño quiero editar un producto publicado para corregir un texto, una foto o un enlace caído.
- HU-5. Como dueño quiero eliminar un producto para que deje de mostrarse cuando ya no se vende.
- HU-6. Como dueño quiero crear una categoría nueva al subir un producto para que el catálogo crezca sin trabas.
- HU-7. Como dueño quiero ver la card tal como quedará antes de publicar para no mostrar errores a los visitantes.
- HU-8. Como dueño quiero que, si algo falla al guardar, no se pierda lo que escribí.
- HU-10. Como dueño quiero marcar un producto como no disponible sin borrarlo, para reutilizar su publicación cuando vuelva a venderse.
- HU-11. Como visitante quiero distinguir de un vistazo qué productos no están disponibles para no perder tiempo en ellos.
- HU-9. Como visitante quiero seguir viendo el catálogo igual que hoy, sin enterarme de que existe un panel.

## Requisitos funcionales

### Acceso

- RF-1. CUANDO alguien abre la dirección del panel sin una sesión activa, EL SISTEMA debe mostrar únicamente un formulario que pide la credencial, sin mostrar datos ni funciones de administración.
- RF-2. CUANDO el dueño envía una credencial, EL SISTEMA debe comprobar que permite guardar cambios en el repositorio del sitio antes de dar acceso.
- RF-3. SI la credencial es inválida, está vencida o no tiene permiso de escritura, ENTONCES EL SISTEMA debe negar el acceso y explicar el motivo en español.
- RF-4. MIENTRAS la sesión está activa, EL SISTEMA debe conservar la credencial solo en esa pestaña del navegador.
- RF-5. CUANDO el dueño cierra la pestaña o presiona "Cerrar sesión", EL SISTEMA debe olvidar la credencial y volver a pedirla en el siguiente ingreso.
- RF-6. EL SISTEMA no debe guardar la credencial en los archivos del sitio ni enviarla a ningún destino distinto de GitHub.

### Dirección oculta

- RF-38. EL SISTEMA debe ubicar el panel en una dirección que no sea `/admin/` ni otra palabra habitual (como `panel`, `login` o `administrador`) y que no pueda adivinarse probando nombres comunes.
- RF-7. EL SISTEMA no debe mostrar ningún enlace ni mención al panel en las páginas públicas (navbar, footer, cards).
- RF-8. EL SISTEMA debe indicar a los buscadores que no indexen la página del panel.

### Listado

- RF-9. CUANDO el dueño entra al panel, EL SISTEMA debe listar todos los productos publicados con su título, categoría y foto de portada, incluidos los que existían antes del panel.
- RF-10. EL SISTEMA debe permitir, desde cada producto del listado, iniciar su edición o su eliminación.

### Agregar y editar

- RF-11. CUANDO el dueño elige "Agregar producto", EL SISTEMA debe mostrar un formulario con: título, categoría, subcategoría (opcional), características (opcional, hasta 6), etiqueta con su estilo (opcional), fotos (opcional) y enlace de afiliado, ya sea uno solo o uno por versión con su nombre (por ejemplo "256 GB").
- RF-12. CUANDO el dueño agrega un producto, EL SISTEMA debe asignarle automáticamente un código interno único, sin pedírselo al dueño y sin relación con el número de reel.
- RF-50. EL SISTEMA no debe mostrar el código interno a los visitantes en el sitio público.
- RF-13. CUANDO el dueño elige editar un producto, EL SISTEMA debe mostrar el mismo formulario con los datos actuales del producto cargados.
- RF-14. SI falta el título, la categoría o el enlace de afiliado, ENTONCES EL SISTEMA debe impedir continuar y señalar el campo que falta.
- RF-15. SI un enlace de afiliado no es un enlace corto entregado por Mercado Libre (comienza con `https://meli.la/` seguido de su código), ENTONCES EL SISTEMA debe impedir continuar y señalar el enlace incorrecto.
- RF-16. SI el producto tiene más de una versión y alguna no tiene nombre o enlace, ENTONCES EL SISTEMA debe impedir continuar y señalar la versión incompleta.
- RF-17. CUANDO el dueño edita un producto, EL SISTEMA debe conservar su código.

### Fotos

- RF-18. EL SISTEMA debe permitir elegir hasta 10 fotos por producto desde el dispositivo, quitarlas y definir su orden; la primera es la portada.
- RF-39. SI el dueño intenta superar las 10 fotos, ENTONCES EL SISTEMA debe impedirlo y avisar que se alcanzó el máximo, conservando las ya elegidas.
- RF-19. CUANDO el dueño elige una foto, EL SISTEMA debe reducirla y optimizarla antes de guardarla, de modo que su lado mayor no supere los 800 píxeles.
- RF-20. SI un archivo elegido no es una imagen, ENTONCES EL SISTEMA debe rechazarlo y avisar cuál fue, sin descartar las demás fotos.
- RF-21. SI el producto no tiene fotos, ENTONCES EL SISTEMA debe permitir publicarlo igualmente, y el sitio lo mostrará con la imagen de reemplazo actual.

### Categorías

- RF-22. EL SISTEMA debe permitir elegir una categoría existente o crear una nueva escribiendo su nombre en el mismo formulario.
- RF-23. SI el nombre de la categoría nueva coincide con una existente (sin distinguir mayúsculas ni tildes), ENTONCES EL SISTEMA debe usar la existente en lugar de crear un duplicado.
- RF-24. CUANDO se publica un producto con una categoría nueva, EL SISTEMA debe mostrar esa categoría en el navbar y el footer del sitio igual que las demás.

### Vista previa y publicación

- RF-25. CUANDO el formulario es válido y el dueño presiona "Vista previa", EL SISTEMA debe mostrar la card tal como la verá el visitante, con sus fotos, versiones y características.
- RF-26. MIENTRAS se muestra la vista previa, EL SISTEMA debe ofrecer "Publicar" y "Volver a editar".
- RF-27. CUANDO el dueño presiona "Publicar", EL SISTEMA debe guardar el producto y sus fotos en el sitio, sin pasos manuales adicionales.
- RF-40. CUANDO se publica un producto nuevo, EL SISTEMA debe mostrarlo en el sitio en el primer lugar de su categoría.
- RF-28. CUANDO el guardado termina bien, EL SISTEMA debe confirmarlo e informar que el cambio se verá en datosonline.cl en unos minutos.
- RF-29. MIENTRAS se está guardando, EL SISTEMA debe mostrar que hay una operación en curso e impedir un segundo envío.

### Producto no disponible

- RF-41. EL SISTEMA debe permitir al dueño marcar cualquier producto como "no disponible" y volver a marcarlo como disponible, desde el formulario de edición.
- RF-42. CUANDO el dueño marca un producto como no disponible, EL SISTEMA debe pedirle elegir la posición de la cinta: horizontal a media altura de la foto o en diagonal.
- RF-43. MIENTRAS un producto está no disponible, EL SISTEMA debe seguir mostrándolo en el sitio público con una cinta sobre sus fotos, con aspecto de cinta policial (franjas de advertencia) y el texto "NO DISPONIBLE", en la posición elegida.
- RF-44. MIENTRAS un producto está no disponible, EL SISTEMA debe mostrarlo únicamente en la categoría "No disponible": no debe aparecer en su categoría de origen ni en la vista "Todo".
- RF-51. MIENTRAS un producto está no disponible, EL SISTEMA debe mostrar su botón "Ver precio" desactivado, sin llevar a Mercado Libre, y el selector de versiones sin efecto sobre ningún enlace.
- RF-45. MIENTRAS existe al menos un producto no disponible, EL SISTEMA debe mostrar la categoría "No disponible" en el sitio; SI no hay ninguno, ENTONCES no debe mostrarla.
- RF-46. EL SISTEMA debe conservar todos los datos del producto no disponible (fotos, características, enlaces, etiqueta y categoría de origen) para que el dueño pueda editarlos.
- RF-47. CUANDO el dueño vuelve a marcar el producto como disponible, EL SISTEMA debe quitar la cinta y devolverlo a su categoría de origen.
- RF-48. EL SISTEMA debe mostrar la cinta también en la vista previa del panel y distinguir los productos no disponibles en el listado.
- RF-49. EL SISTEMA no debe permitir elegir ni crear "No disponible" como categoría de un producto en el formulario.

### Eliminar

- RF-30. CUANDO el dueño presiona "Eliminar" en un producto, EL SISTEMA debe abrir una ventana de confirmación (modal) con el mensaje "¿Estás seguro de eliminar el producto? Nada se podrá recuperar.", el título del producto y los botones "Eliminar" y "Cancelar".
- RF-52. CUANDO el dueño presiona "Cancelar", la tecla Escape o fuera de la ventana, EL SISTEMA debe cerrarla sin eliminar nada.
- RF-53. EL SISTEMA debe ofrecer esa ventana de confirmación como una pieza reutilizable, de modo que cualquier otra acción del sitio pueda usarla con su propio mensaje y sus propios botones.
- RF-31. CUANDO el dueño presiona "Eliminar" en la ventana, EL SISTEMA debe quitar el producto del catálogo publicado y borrar todas sus fotos.
- RF-32. SI al eliminar un producto su categoría queda sin productos, ENTONCES EL SISTEMA debe conservar la categoría.

### Errores

- RF-33. SI el guardado falla por falta de conexión, por una credencial que dejó de ser válida o por un error de GitHub, ENTONCES EL SISTEMA debe conservar lo escrito en el formulario, explicar el motivo en español y permitir reintentar.
- RF-34. SI el catálogo cambió desde que el panel lo cargó (por ejemplo desde otro dispositivo), ENTONCES EL SISTEMA no debe sobrescribir esos cambios: debe avisar, recargar el catálogo y conservar lo escrito en el formulario.
- RF-35. SI el guardado falla después de haber subido algunas fotos, ENTONCES EL SISTEMA no debe dejar el producto publicado a medias: el visitante ve la versión anterior completa o la nueva completa.

### Compatibilidad

- RF-36. EL SISTEMA debe mostrar en el sitio público los productos y categorías existentes con el mismo contenido y aspecto que tienen hoy, con la única excepción del código interno, que deja de mostrarse (RF-50).
- RF-37. EL SISTEMA debe seguir aceptando productos que solo tengan los datos obligatorios actuales (código, título, categoría y enlace).

## Requisitos no funcionales

- RNF-1. Interfaz y mensajes en español; lenguaje simple, sin términos técnicos salvo "token".
- RNF-2. El panel debe poder usarse completo en un celular de 375 px de ancho.
- RNF-3. Sin servidor propio, sin servicios pagados y sin dependencias nuevas.
- RNF-4. El sitio público no debe cargar más lento para el visitante por la existencia del panel.
- RNF-5. La lógica de validación debe poder probarse de forma automática sin navegador.
- RNF-6. Controles con texto legible, botones grandes y foco visible, pensando en personas mayores de 30 años.
- RNF-7. Cada cambio hecho desde el panel debe quedar registrado con fecha y descripción (qué producto se agregó, editó o eliminó).

## Casos límite

- Credencial válida pero de otro repositorio, o solo de lectura: se trata como RF-3.
- La credencial vence a mitad de una sesión: se trata como RF-33 y se vuelve a pedir.
- Doble clic en "Publicar": RF-29.
- Título muy largo, con comillas, emojis o símbolos como `<` y `&`: debe guardarse y mostrarse tal cual, sin romper la página.
- Foto muy pesada (por ejemplo 15 MB desde el celular) o en formato que el navegador no puede leer: se reduce (RF-19) o se rechaza con aviso (RF-20).
- Dos fotos con el mismo nombre de archivo: ambas deben conservarse.
- Editar un producto y quitarle todas las fotos: queda con la imagen de reemplazo (RF-21).
- Producto con una sola versión con nombre (como el Samsung "256 GB"): debe seguir mostrando su selector.
- Producto no disponible sin fotos: la cinta se muestra sobre la imagen de reemplazo.
- Producto no disponible con varias fotos: la cinta se ve en todas las fotos de la galería, no solo en la portada.
- Texto alternativo: la condición de no disponible debe comunicarse también a quienes usan lector de pantalla, no solo con la cinta.
- Alguien intenta crear una categoría llamada "No disponible" (o "no disponible", "NO DISPONIBLE"): RF-49.
- Undécima foto: RF-39.
- Enlace de Mercado Libre largo (`mercadolibre.cl/...`) o `http://meli.la/...`: se rechaza (RF-15).
- La eliminación falla a medias (se borró el producto pero no alguna foto, o al revés): RF-35; el producto no debe quedar visible sin fotos ni las fotos sin producto de forma permanente.
- Eliminar un producto que está no disponible: funciona igual, y si era el último, la categoría "No disponible" deja de mostrarse (RF-45).
- Ventana de confirmación abierta: el foco queda dentro de ella y el resto del panel no responde hasta cerrarla.
- Todos los productos están no disponibles: la vista "Todo" muestra el mensaje actual de catálogo vacío.
- Más de 6 características: el formulario no permite agregar la séptima.
- Categoría nueva cuyo nombre solo difiere en tildes o mayúsculas de una existente: RF-23.
- Se elimina el último producto de una categoría: RF-32; el sitio muestra la categoría vacía con el mensaje actual.
- Catálogo vacío: el panel muestra el listado vacío y la opción de agregar.
- El dueño recarga la página con el formulario a medio llenar: lo no publicado se pierde; el panel debe advertirlo antes de salir.

## Fuera de alcance

- Renombrar, reordenar o eliminar categorías.
- Borradores o productos ocultos (un producto no disponible sigue visible).
- Cambiar el texto, los colores o el diseño de la cinta; solo se elige su posición.
- Avisar al visitante cuando un producto vuelve a estar disponible.
- Más de un administrador, roles o registro de usuarios.
- Entrar con contraseña en vez de la credencial.
- Mostrar precios, stock o datos traídos desde Mercado Libre.
- Estadísticas de visitas o de clics.
- Editar navbar, footer, Instagram u otros datos del sitio.
- Deshacer cambios desde el panel (el historial queda en GitHub).
- Carga masiva de productos desde un archivo.
- Buscador y orden de productos de la portada (pendientes aparte).

## Criterios de finalización

1. Desde un celular, el dueño publica un producto nuevo con 3 fotos y 2 versiones, y aparece en datosonline.cl sin tocar ningún archivo a mano.
2. El dueño corrige el título de un producto existente y el cambio se ve en el sitio.
3. El dueño presiona "Eliminar", ve la ventana con "Eliminar" y "Cancelar"; con "Cancelar" no cambia nada, y con "Eliminar" el producto y sus fotos desaparecen del sitio.
4. El dueño crea una categoría nueva al subir un producto y esta aparece en el navbar.
5. Sin credencial, o con una inválida, no se muestra ningún dato de administración ni se puede guardar nada.
6. Tras cerrar la pestaña, el panel vuelve a pedir la credencial.
7. Los cuatro productos actuales se ven en el sitio público igual que hoy, salvo que ya no muestran su código.
8. Ninguna página pública enlaza al panel, y este no responde en `/admin/`.
10. El dueño marca un producto como no disponible con cinta diagonal: en el sitio aparece con la cinta y el botón desactivado, solo dentro de "No disponible" (ni en su categoría ni en "Todo"); al marcarlo disponible vuelve a su categoría sin cinta.
11. El formulario rechaza la foto número 11 y un enlace que no sea `https://meli.la/...`.
12. Un producto recién publicado aparece primero en su categoría.
9. Los tests automáticos pasan y el panel se revisó a 375 px sin errores en la consola.

## Dudas abiertas

Ninguna.

## Decisiones cerradas

- Dirección del panel: el dueño acepta que la protección real es la credencial; la dirección poco obvia (RF-38) es solo disuasiva, porque el repositorio es público.
- Constitución: `docs/constitution.md` aprobada el 2026-11-15; esta spec no contradice ninguno de sus seis principios.
- Código interno: deja de mostrarse en las cards públicas (RF-50).
