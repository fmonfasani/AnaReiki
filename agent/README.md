# 🤖 Agent System — AnaReiki

Sistema de desarrollo autónomo asistido por Codex CLI. El agente monitorea el repositorio, detecta errores, propone fixes y hace commits automáticamente.

---

## Estructura

```
agent/
├── watcher.js       # Monitor de cambios en src/ (lint + autofix + commit)
├── buildWatcher.js  # Build cada 10 min con autofix si falla
├── guardian.js      # Watcher liviano: solo Codex review on change
├── nightly.js       # Tarea nocturna (3AM) — scan completo + fix + commit
├── team.js          # 3 agentes concurrentes: Guardian / Builder / Tester
└── package.json
```

---

## Instalación

```powershell
cd agent
npm install
```

**Dependencias:**

| Paquete | Uso |
|---------|-----|
| `chokidar` | File watcher |
| `execa` | Ejecutar comandos shell |
| `node-cron` | Scheduler nocturno |
| `simple-git` | Auto-commits |

---

## Comandos

```powershell
npm run watch        # Monitor de archivos → lint → autofix → commit
npm run build-watch  # Build cíclico cada 10 min → autofix si falla
npm run nightly      # Scheduler nocturno (cron 3AM)
npm run team         # 3 agentes en paralelo (Guardian + Builder + Tester)
npm run guardian     # Solo: detección de bugs
npm run builder      # Solo: implementación de features
npm run tester       # Solo: escritura de tests
```

---

## Arquitectura del sistema

```
Cambio en src/
      │
      ▼
  watcher.js ──────────────────────────────────────────┐
      │                                                 │
      ├─▶ [1] Codex audita el cambio                    │
      │                                                 │
      ├─▶ [2] npm run lint                              │
      │        └── Si falla → Codex autofix             │
      │                                                 │
      └─▶ [3] git add + git commit (si todo OK)         │
                                                        │
buildWatcher.js (cada 10 min) ──────────────────────────┤
      │                                                 │
      ├─▶ npm run build                                 │
      └── Si falla → Codex autofix                      │
                                                        │
nightly.js (cron 3AM) ──────────────────────────────────┘
      │
      ├─▶ Codex: scan repo → bugs + security + tests
      ├─▶ npm run build
      ├─▶ npm run lint
      └─▶ git commit (fixes del día)
```

---

## Agentes del equipo (`team.js`)

| Agente | Prompt rol |
|--------|-----------|
| **Guardian** | QA senior — detecta bugs, edge cases, security issues |
| **Builder** | Dev senior — implementa funcionalidad faltante |
| **Tester** | QA automation — escribe tests con Vitest |

Corren en paralelo con `Promise.allSettled`. Para un solo rol:

```powershell
node team.js guardian
node team.js builder
node team.js tester
```

---

## Modo de uso recomendado (3 terminales)

```powershell
# Terminal 1 — monitoreo live (siempre encendida)
cd agent && npm run watch

# Terminal 2 — build check cada 10 min
npm run build-watch

# Terminal 3 — scheduler nocturno (dejarla corriendo)
npm run nightly
```

---

## Configuración del workspace

El agente consume estos archivos de contexto del proyecto:

| Archivo | Contenido |
|---------|-----------|
| `AGENTS.md` | Arquitectura, DB schema, auth flow, patrones |
| `.codex/PROJECT_MEMORY.md` | Mapa semántico, entrypoints, code smells |
| `.codex/mcp.json` | MCP servers + skills registry |
| `.codex/skills/` | Guías de filesystem, git, shell, test |

---

## MCP Servers activos

```json
{
  "filesystem": "python -m mcp.server.fs --root .",
  "git":        "python -m mcp_server_git"
}
```

Prerequisito:
```powershell
pip install mcp mcp-server-git
```

---

## Variables de entorno requeridas (proyecto raíz)

Crear `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
```

---

## Notas

- El `watcher.js` **no corre build** (lento). Build separado en `buildWatcher.js`.
- Los auto-commits usan el mensaje `agent: auto-fix after change in <archivo>`.
- Para detener cualquier agente: `Ctrl+C`.
- `guardian.js` es una versión liviana de `watcher.js` — solo Codex review, sin pipeline.
