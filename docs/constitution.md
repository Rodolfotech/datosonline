# Constitución de datosonline

Aprobada por el dueño el 2026-11-15. Modificada el 2026-11-17: principio 5 (analítica anónima en el sitio público). Seis principios innegociables.

1. **Stack simple.** Solo HTML, CSS y JavaScript puros. Sin frameworks, sin dependencias y sin paso de compilación: el sitio funciona servido tal cual desde la raíz del repositorio.
2. **Spec antes que código.** No se modifica código sin una spec en estado "aprobada". Si cambia un requisito, primero se actualiza la spec.
3. **Lógica separada de la interfaz.** Las reglas y validaciones viven en `src/lib/` como funciones puras, sin tocar el DOM; los componentes solo muestran y capturan.
4. **Tests sin dependencias.** Toda función de `src/lib/` tiene test con `node --test`. La interfaz se verifica en el navegador a 375 px y sin errores en consola.
5. **Datos protegidos.** El sitio público puede usar analítica anónima (Microsoft Clarity), informada en la página de privacidad. El panel de administración no carga analítica ni herramientas externas. Ninguna clave o token se guarda en el repositorio. Los cambios de formato mantienen funcionando los datos existentes.
6. **Idioma.** Código (nombres, comentarios) en inglés; interfaz, mensajes y documentación en español.
