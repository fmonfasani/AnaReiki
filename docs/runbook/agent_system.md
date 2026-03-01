# Runbook: Sistema de Agentes Autónomos

**Fecha de creación:** 2026-03-01
**Versión:** 1.0

Sistema de desarrollo autónomo basado en Codex CLI que monitorea el repositorio, detecta errores, propone fixes y hace commits automáticamente.

---

## Arquitectura del sistema

```
agent/
├── watcher.js       # Monitor de cambios (lint → autofix → commit)
├── buildWatcher.js  # Build cíclico cada 10 min (autofix si falla)
├── guardian.js      # Watcher liviano: Codex review on change
├── nightly.js       # Cron 3AM: scan completo → fix → commit
└── team.js          # 3 agentes concurrentes (Guardian/Builder/Tester)
```

**Contexto del agente (archivos que el modelo lee):**

| Archivo | Rol |
|---------|-----|
| `AGENTS.md` | Arquitectura, DB, auth flow, patrones del proyecto |
| `.codex/PROJECT_MEMORY.md` | Mapa semántico, entrypoints, code smells |
| `.codex/mcp.json` | MCP servers + skills registry |
| `.codex/skills/filesystem.md` | Skill: navegación de código |
| `.codex/skills/git.md` | Skill: historial, diffs, blame |
| `.codex/skills/shell.md` | Skill: npm scripts, linter, typecheck |
| `.codex/skills/test.md` | Skill: guía de setup Vitest |

---

## Instalación

### 1. Prerrequisitos

```powershell
# Node.js >= 18
node --version

# Codex CLI (instalación global)
npm install -g @openai/codex

# Python packages para MCP servers
pip install mcp mcp-server-git
```

### 2. Instalar dependencias del agente

```powershell
cd agent
npm install
```

---

## Uso

### Modo 1 — Watcher (monitoreo continuo)

```powershell
cd agent
npm run watch
```

**Flujo:**
```
Cambio en src/ → Codex audita → npm run lint → autofix si falla → git commit
```

### Modo 2 — Build Watcher (build cíclico)

```powershell
npm run build-watch
```

Corre `npm run build` del proyecto cada 10 minutos. Si falla, pasa el log de error a Codex para autofix.

### Modo 3 — Guardian (watcher liviano)

```powershell
node guardian.js
```

Solo Codex review on change. Sin pipeline de lint/build. Útil cuando querés el agente más rápido.

### Modo 4 — Nightly (mantenimiento nocturno)

```powershell
npm run nightly
```

Scheduler cron `0 3 * * *` (3:00 AM diario). Acciones:
1. Codex scan completo del repo (bugs + security + tests faltantes)
2. `npm run build`
3. `npm run lint`
4. `git commit` de todos los fixes

### Modo 5 — Team (3 agentes en paralelo)

```powershell
npm run team          # los 3 juntos
npm run guardian      # solo detector de bugs
npm run builder       # solo implementador de features
npm run tester        # solo escritor de tests
```

| Agente | Rol |
|--------|-----|
| Guardian | QA senior: bugs, edge cases, security |
| Builder | Dev senior: features faltantes |
| Tester | QA automation: tests con Vitest |

---

## Configuración recomendada (producción)

Abrir 3 terminales:

```powershell
# Terminal 1 — siempre encendida
cd agent && npm run watch

# Terminal 2 — build check
npm run build-watch

# Terminal 3 — dejarla corriendo overnight
npm run nightly
```

---

## MCP Servers (.codex/mcp.json)

```json
{
  "servers": {
    "filesystem": { "command": "python", "args": ["-m", "mcp.server.fs", "--root", "."] },
    "git":        { "command": "python", "args": ["-m", "mcp_server_git"] }
  }
}
```

---

## Auto-commits

El watcher y el nightly hacen commits automáticos con los mensajes:

```
agent: auto-fix after change in src/components/BookingCalendar.tsx
agent(nightly): automated maintenance 2026-03-01
```

Para desactivar los auto-commits: comentar el bloque `autoCommit()` en `watcher.js`.

---

## Troubleshooting

| Problema | Causa probable | Solución |
|----------|---------------|----------|
| `codex: command not found` | Codex CLI no instalado | `npm install -g @openai/codex` |
| MCP server no arranca | Paquete Python faltante | `pip install mcp mcp-server-git` |
| Watcher no detecta cambios | Path incorrecto en `watcher.js` | Verificar `PROJECT` const |
| Build falla en watcher | `npm run build` es lento | Usar solo `buildWatcher.js` para builds |
| Auto-commit falla | git config sin usuario | `git config user.email` y `user.name` |
