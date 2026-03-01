# ADR-001: Sistema de Agentes Autónomos con Codex CLI

**Fecha:** 2026-03-01
**Estado:** Aceptado

---

## Contexto

El proyecto AnaReiki es desarrollado por un equipo pequeño. Se necesita:
- Detectar bugs introducidos en cada cambio sin revisión manual permanente
- Mantener la calidad del código (lint, build, tests) de forma continua
- Reducir la carga cognitiva del desarrollador en tareas repetitivas de QA

Se evaluaron opciones:
- GitHub Actions CI/CD (solo en push, no en tiempo real)
- Pre-commit hooks (solo bloquean, no corrigen)
- **Codex CLI + file watcher** (tiempo real, autocorrectivo)

## Decisión

Implementar un sistema de agentes autónomos locales basado en **Codex CLI** orquestado por **Node.js** con tres capas:

1. **Watcher** (`chokidar`) — monitoreo en tiempo real de `src/`
2. **Scheduler** (`node-cron`) — mantenimiento nocturno a las 3AM
3. **Team** — tres agentes concurrentes con roles especializados (Guardian / Builder / Tester)

El modelo recibe contexto estructurado vía:
- `AGENTS.md` — arquitectura del proyecto
- `.codex/PROJECT_MEMORY.md` — mapa semántico
- `.codex/skills/` — guías de herramientas disponibles
- `.codex/mcp.json` — MCP servers (filesystem + git)

## Consecuencias

**Positivas:**
- Detección inmediata de side effects en cada cambio
- Auto-commits de fixes reducen deuda técnica acumulada
- El modelo tiene contexto completo del proyecto sin intervención manual
- Roles separados (Guardian/Builder/Tester) evitan interferencia entre tareas

**Negativas / Riesgos:**
- Requiere Codex CLI instalado globalmente y API key de OpenAI activa
- Auto-commits pueden generar ruido en el historial de git si el modelo propone fixes incorrectos
- `npm run build` es lento (2+ min) — separado del watcher para no bloquear el flujo
- Sin test runner configurado aún (Vitest pendiente de setup)

## Archivos creados

```
agent/
├── watcher.js
├── buildWatcher.js
├── guardian.js
├── nightly.js
├── team.js
├── README.md
└── package.json

AGENTS.md
.codex/mcp.json
.codex/PROJECT_MEMORY.md
.codex/skills/filesystem.md
.codex/skills/git.md
.codex/skills/shell.md
.codex/skills/test.md
```
