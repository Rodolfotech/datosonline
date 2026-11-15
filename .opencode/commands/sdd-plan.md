Define el CÓMO técnico respetando la constitución y los RF especificados.
Prompt / Comando (/sdd-plan 001-mi-funcionalidad)
Lee docs/constitution.md, AGENTS.md y specs/001-nombre/spec.md. Usa la skill sdd. NO escribas código.

Genera specs/001-nombre/plan.md detallando:
1. Archivos que se crean o modifican y la responsabilidad única de cada uno.
2. Funciones puras de lógica necesarias (aislando efectos secundarios).
3. Algoritmos principales descritos en pseudocódigo.
4. Cómo se refleja e interactúa en la interfaz de usuario.
5. Decisiones técnicas justificadas (incluyendo la alternativa que fue descartada y por qué).
6. Estrategia de tests unitarios (con node --test) y de interfaz.

Todo debe respetar la constitución y cubrir cada uno de los RF. Marca explícitamente qué RF cubre cada parte técnica. Si la spec no está aprobada o contiene dudas abiertas, deténte y avísame.
