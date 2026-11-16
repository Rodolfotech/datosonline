NO escribas código en ningún momento. Vamos a redactar la especificación de una nueva funcionalidad. Lee docs/constitution.md y MEMORY.md, y usa la skill sdd.

debes crear un panel administración y subir productos 

La Arquitectura: Panel SPA con JavaScript puro
Curas la necesidad de un backend haciendo que tu panel en el navegador actúe como un cliente que interactúa directamente con el repositorio de GitHub a través de su API oficial.

1. Estructura de archivos en tu repositorio
Plaintext
/mi-web/
├── index.html          (Tu tienda / catálogo)
├── assets/
│   ├── css/style.css
│   └── js/app.js
├── data/
│   └── productos.json  (Donde se guardarán los productos)
└── admin/
    └── index.html      (Tu panel de administración protegido)
2. El flujo de seguridad sin backend
Acceso a /admin/: Creas un archivo admin/index.html. Al entrar, si no hay una sesión activa, el script muestra un formulario pidiendo dos cosas:

Una contraseña maestra (o directamente tu GitHub Personal Access Token con permisos de escritura en el repo).

Almacenamiento volátil (sessionStorage): Una vez introducido, lo guardas únicamente en la sesión del navegador (sessionStorage.setItem('github_token', token)). Al cerrar la pestaña, desaparece. Jamás se sube al repositorio.

Escritura en GitHub: Cuando rellenas el formulario de un nuevo producto en tu panel y haces clic en "Guardar", tu JavaScript hace lo siguiente de forma transparente:

Hace un GET a la API de GitHub para leer el archivo data/productos.json actual (y obtener su sha actual, obligatorio para actualizarlo).

Añade el nuevo producto al array JSON en memoria.

Hace un PUT a la API de GitHub para sobrescribir data/productos.json con el array actualizado, enviando el Token en los headers de autorización.

GitHub recibe el cambio, hace commit automático y vuelve a desplegar tu GitHub Pages con el producto agregado en segundos.

Ejemplo práctico del código JavaScript para el Admin
Este script resume cómo se conecta tu panel estático con GitHub para subir un producto sin backend:

JavaScript
// admin/index.html (Ejemplo simplificado de la lógica de subida)

async function subirProducto(nuevoProducto) {
    const token = sessionStorage.getItem('github_token');
    const repo = 'tu-usuario/tu-repositorio';
    const rutaArchivo = 'data/productos.json';
    
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json'
    };

    try {
        // 1. Obtener el archivo actual y su SHA
        const resGet = await fetch(`https://api.github.com/repos/${repo}/contents/${rutaArchivo}`, { headers });
        const dataArchivo = await resGet.json();
        
        let productos = [];
        if (resGet.ok) {
            // Decodificar el contenido base64 actual
            const contenidoDecodificado = decodeURIComponent(escape(atob(dataArchivo.content)));
            productos = JSON.parse(contenidoDecodificado);
        }

        // 2. Agregar el nuevo producto con ID único
        nuevoProducto.id = Date.now().toString();
        productos.push(nuevoProducto);

        // 3. Codificar de nuevo a Base64
        const nuevoContenidoBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(productos, null, 2))));

        // 4. Enviar el commit mediante PUT a la API de GitHub
        const resPut = await fetch(`https://api.github.com/repos/${repo}/contents/${rutaArchivo}`, {
            method: 'PUT',
            headers: {
                ...headers,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Agregado producto: ${nuevoProducto.nombre}`,
                content: nuevoContenidoBase64,
                sha: dataArchivo.sha // Requerido por GitHub para actualizar archivos existentes
            })
        });

        if (resPut.ok) {
            alert('¡Producto subido con éxito! GitHub Pages se actualizará en unos segundos.');
        } else {
            alert('Error al guardar el producto. Revisa tu token.');
        }
    } catch (error) {
        console.error('Error de red:', error);
    }
}
¿Por qué esta solución cumple lo que pides?
Mismas tecnologías: 100% HTML, CSS y JavaScript vainilla.

Cero backend: No hay servidores intermedios, Node.js ni bases de datos de pago.

Seguridad: El panel está oculto en una ruta (/admin/), y al no guardar nunca las credenciales en el código del repositorio, nadie que visite tu web públicamente podrá ver contraseñas ni modificar tus archivos.

adapta el proyecto para que funcione como lo hace y la ruta de panel administración debe estar oculta.


Tu trabajo:
1. Hazme preguntas de UNA en UNA para eliminar ambigüedades (casos límite, comportamiento ante errores y qué queda explícitamente fuera de esta versión). Máximo 5 preguntas.
2. Con mis respuestas, genera specs/001-nombre/spec.md con la plantilla oficial:
   - Contexto y objetivo
   - Usuarios / actores
   - Historias de usuario (Como... quiero... para...)
   - Requisitos funcionales numerados (RF-x) redactados estrictamente en sintaxis EARS en español (CUANDO..., SI... ENTONCES..., MIENTRAS..., EL SISTEMA...)
   - Requisitos no funcionales
   - Casos límite
   - Fuera de alcance
   - Criterios de finalización
   - Dudas abiertas ([NECESITA ACLARACIÓN])
3. Enfréntate únicamente al QUÉ y al POR QUÉ. Nada de stack ni arquitectura. Deja el estado en "Estado: borrador".