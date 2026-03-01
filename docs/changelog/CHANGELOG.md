# Changelog

Todos los cambios significativos del proyecto AnaReiki se documentan aquí.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).

---

## [Unreleased]

### Added — 2026-03-01: Sistema de Agentes Autónomos

#### Agent System (`agent/`)
- `agent/watcher.js` — Monitor de cambios en `src/`: audita con Codex, corre lint, hace autofix y commit automático
- `agent/buildWatcher.js` — Build cíclico cada 10 minutos con autofix via Codex si falla
- `agent/guardian.js` — Watcher liviano: solo Codex review on change (sin pipeline)
- `agent/nightly.js` — Tarea cron diaria a las 3AM: scan completo → fix → build → lint → commit
- `agent/team.js` — 3 agentes concurrentes con roles: Guardian (bugs) / Builder (features) / Tester (tests)
- `agent/README.md` — Documentación completa del sistema de agentes

#### Workspace de Agentes (`.codex/`)
- `.codex/skills/filesystem.md` — Skill: mapa de rutas, componentes e inventario del proyecto
- `.codex/skills/git.md` — Skill: comandos git, detección de regresiones
- `.codex/skills/shell.md` — Skill: npm scripts, linter, TypeScript check
- `.codex/skills/test.md` — Skill: guía de setup Vitest (test runner pendiente)
- `.codex/mcp.json` — Actualizado con skills registry, context files y metadatos del proyecto
- `.codex/PROJECT_MEMORY.md` — Mapa semántico: entrypoints, modelos, componentes, code smells

#### Documentación
- `AGENTS.md` — Contexto primario para agentes: arquitectura, DB schema, auth flow, env vars, patrones
- `docs/runbook/agent_system.md` — Runbook completo del sistema de agentes
- `docs/adr/ADR-001-agent-system.md` — Registro de decisión arquitectónica

#### Code Smells detectados (pendiente de fix)
- Admin auth gap: `/admin` protegido solo por layout, no por middleware
- CTA duplicado en `src/app/page.tsx`: "Contactame" y "Contactar" apuntan al mismo destino

---

## Versiones anteriores

> Los cambios previos al 2026-03-01 no están registrados en este changelog.
> Consultar `git log` para historial completo.
