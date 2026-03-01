**Contexto y Rol**
Actúa como **ingeniero DevOps + AI tooling specialist** experto en configuración de entornos de desarrollo asistidos por agentes (LLM agents). Estás operando en **Windows 11 + PowerShell + Node.js + Python + Git** sobre un proyecto Next.js/TypeScript existente. El objetivo es convertir el entorno en un sistema de desarrollo autónomo asistido por agentes usando Codex CLI y herramientas locales.

---

**Consulta / Tarea**
Analiza el entorno actual, detecta qué está configurado y qué no, y configura completamente un entorno funcional de agentes locales.
Debes:

1. Detectar automáticamente:

   * rutas del proyecto
   * dependencias (Node, Python, Git)
   * estructura del repo
   * si existen configuraciones previas de Codex

2. Crear e integrar herramientas (skills) para el agente:

   * lectura de archivos
   * inspección git
   * ejecución de comandos
   * ejecución de tests

3. Convertir el repositorio en un workspace compatible con agentes donde el modelo pueda:

   * explorar código sin copiar/pegar
   * analizar commits
   * detectar bugs
   * modificar archivos
   * iterar correcciones

---

**Especificaciones**

Implementar automáticamente:

### 1) Preparación del workspace

* crear carpeta `.codex/`
* crear carpeta `.codex/skills/`
* validar permisos de escritura
* verificar git init

### 2) Skills del agente

Crear y registrar skills funcionales:

**filesystem skill**
Permite al agente:

* leer código
* mapear arquitectura
* ubicar funciones

**git skill**
Permite:

* analizar commits
* revisar diffs
* detectar regresiones

**shell skill**
Permite:

* correr `npm run dev`
* ejecutar scripts
* correr linters

**test skill**
Debe detectar automáticamente:

* Jest / Vitest / Pytest
  y permitir ejecución de tests desde el agente.

---

### 3) Indexado del proyecto

El agente debe construir un mapa semántico del repositorio:

* identificar entrypoints
* detectar backend/frontend
* detectar autenticación
* detectar ORM (Prisma si existe)

Debe generar un archivo de memoria interna del proyecto.

---

### 4) Validación

Luego de configurar, ejecutar pruebas automáticas:

1. listar estructura del repo
2. ubicar modelo de usuario
3. mostrar último commit
4. encontrar un posible code smell
5. proponer un patch

Si alguno falla → corregir automáticamente la configuración.

---

**Criterios de Calidad**
El entorno queda aprobado solo si el agente puede:

* ubicar archivos sin que el usuario los mencione
* explicar arquitectura real
* detectar un bug potencial
* proponer cambios en diff
* ejecutar al menos un comando del proyecto

No generar explicaciones teóricas.
No pedir intervención manual excepto permisos.

---

**Formato de Respuesta**
Responder únicamente con:

1. pasos ejecutados
2. archivos creados/modificados
3. herramientas activas
4. resultado de validación
