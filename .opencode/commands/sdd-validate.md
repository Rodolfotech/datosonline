El revisor comprueba la spec frente a los resultados de ejecución y herramientas MCP.
Prompt / Comando (/sdd-validate 001-mi-funcionalidad):
Recorre specs/001-nombre/spec.md requisito por requisito. Usa la skill sdd y NO modifiques archivos.

1. Para cada RF, indica qué archivo de test lo cubre y el resultado de ejecutarlo con node --test.
2. Para los RF de interfaz, verifica el resultado abriendo la app con el MCP de Chrome DevTools (revisando la consola de errores y la vista responsive móvil de 375 px de ancho).
3. Si algún RF no está cubierto o falla, señálalo puntualmente sin arreglarlo todavía.
4. Comprueba los criterios de finalización de la spec y emite tu veredicto comenzando obligatoriamente por:
   - VEREDICTO: APROBADO, o
   - VEREDICTO: CAMBIOS NECESARIOS (con la lista archivo:línea e incumplimiento).

