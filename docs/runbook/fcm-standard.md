# Protocolo de Desarrollo y Documentación (FCM Standard)

Este documento establece el "Prompt del Sistema" y la metodología estándar para abordar nuevas funcionalidades, corrección de bugs y refactorizaciones en el proyecto.

## 1. 🧠 Filosofía: "Diagnóstico antes de Prescripción"

Nunca escribir código sin antes entender el problema y planificar la solución. El flujo de trabajo se divide en tres fases documentadas:

1.  **Análisis (Diagnostics)**: ¿Qué pasa? ¿Por qué pasa?
2.  **Propuesta (Treatment)**: ¿Cómo lo vamos a arreglar?
3.  **Tareas (Procedure)**: Pasos ejecutables y checkeables.

---

## 2. 📂 Estructura de Directorios

Toda documentación debe residir en `docs/` siguiendo esta jerarquía según el tipo de trabajo:

```text
docs/
├── guides/             # Protocolos y manuales (como este)
├── analysis/           # Análisis generales del proyecto
├── proposals/          # Propuestas de arquitectura mayor
├── tasks/              # Sprints y listas de tareas
├── bugs/               # Gestión de errores específicos
│   ├── analysis/       # Post-mortems y análisis de causas
│   ├── proposals/      # Soluciones técnicas propuestas
│   └── tasks/          # Checklist de arreglo
└── deployment/         # Guías de despliegue
```

---

## 3. 📝 Plantillas de Documentos

Para generar documentación consistente, utiliza las siguientes estructuras.

### Fase 1: Análisis (`/analysis`)

**Nombre de Archivo:** `YYYY-MM-DD_Topic-Analysis.md`

```markdown
# Análisis de [Tema/Bug]

## 1. 📊 Descripción del Problema

- **Contexto**: ¿Dónde ocurre?
- **Síntomas**: Logs, capturas, comportamiento observado.
- **Impacto**: Bloqueante, visual, performance.

## 2. 🕵️ Diagnóstico

- **Causa Raíz**: Explicación técnica del porqué.
- **Evidencia**: Fragmentos de código o logs relevantes.

## 3. 🔗 Referencias

- Links a documentación oficial o tickets relacionados.
```

### Fase 2: Propuesta (`/proposals`)

**Nombre de Archivo:** `YYYY-MM-DD_Topic-Proposal.md`

```markdown
# Propuesta de Solución: [Tema]

## 1. 🎯 Objetivo

Que se quiere lograr con esta implementación.

## 2. 💡 Solución Técnica

- **Arquitectura**: Diagramas o explicación de flujo.
- **Cambios en Código**:
  - `Archivo.tsx`: Explicación del cambio.
  - `Utils.ts`: Nueva función.
- **Alternativas Descartadas**: Por qué elegimos esta opción.

## 3. 🛡️ Plan de Riesgos/Validación

- ¿Qué podría fallar?
- ¿Cómo vamos a probar que funciona?
```

### Fase 3: Tareas (`/tasks`)

**Nombre de Archivo:** `YYYY-MM-DD_Topic-Tasks.md`

```markdown
# Plan de Implementación: [Tema]

**Estado**: [Planificado | En Progreso | Completado]

## ✅ Checklist de Tareas

### Infraestructura / Configuración

- [ ] Tarea 1
- [ ] Tarea 2

### Código / Desarrollo

- [ ] Tarea 3
- [ ] Tarea 4

### Validación (QA)

- [ ] Smoke Test 1
- [ ] Build Check

## 🏁 Definition of Done (DoD)

1.  El build pasa en verde (Vercel).
2.  Linting sin errores.
3.  Funcionalidad probada en Deploy Preview.
```

---

## 4. 🤖 Prompt para el Agente (Instrucción de Sistema)

Cuando pidas al Agente iniciar un nuevo trabajo complejo, utiliza esta instrucción:

> "Actúa bajo el protocolo 'FCM Standard'. Crea la estructura de carpetas necesaria en `docs/[tipo]` y genera los documentos de Análisis, Propuesta y Tareas antes de escribir cualquier código del proyecto. Quiero ver el plan completo aprobado antes de la implementación."

---

## 5. 🔄 Ciclo de Vida del Código

1.  **Code Review Automático**: Antes de hacer commit, correr `npm run lint` y `npx tsc --noEmit`.
2.  **Commit Semántico**: Usar prefijos `feat:`, `fix:`, `docs:`, `chore:`.
3.  **Deploy Check**: Verificar que Vercel despliegue correctamente tras el push.
