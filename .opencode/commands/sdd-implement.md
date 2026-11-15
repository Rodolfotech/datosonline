Se ejecuta mediante el agente de implementación (mode: build), exigiendo TDD y deteniéndose tras cada bloque.
Prompt / Comando (/sdd-implement 001-mi-funcionalidad T1):
Implementa ÚNICAMENTE la tarea T1 de specs/001-nombre/tasks.md, siguiendo specs/001-nombre/plan.md, docs/constitution.md y la skill sdd.

Pasos obligatorios:
1. Escribe primero los tests asociados y ejecuta node --test para comprobar que fallan (rojo).
2. Escribe el código mínimo necesario hasta que los tests pasen (verde).
3. Ejecuta node --test y muéstrame el resultado limpio en la terminal.
4. Marca T1 como hecha en tasks.md indicando qué RF cubre.

Al terminar, DETENTE. No comiences la siguiente tarea bajo ninguna circunstancia.

