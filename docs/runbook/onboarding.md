# Onboarding: AnaReiki

Bienvenido al equipo. Esta guía te permite tener el proyecto corriendo en menos de 15 minutos.

---

## Requisitos Previos

- Node.js >= 18.x
- Git
- Python >= 3.10
- Cuenta en Supabase (o acceso al proyecto existente)
- API Key de OpenAI (para Codex CLI)

---

## Setup Inicial — Proyecto Next.js

```powershell
# 1. Clonar el repositorio
git clone <repo-url>
cd AnaReiki

# 2. Instalar dependencias
npm install

# 3. Crear variables de entorno
# Copiar y completar con los valores del proyecto:
```

Crear `.env.local` en la raíz:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
```

```powershell
# 4. Correr en desarrollo
npm run dev
# → http://localhost:3000
```

---

## Setup del Sistema de Agentes

El proyecto incluye un sistema de agentes autónomos basado en Codex CLI.

### Instalación de herramientas

```powershell
# Codex CLI (global)
npm install -g @openai/codex

# MCP servers para filesystem y git
pip install mcp mcp-server-git

# Dependencias del agente
cd agent
npm install
```

### Arrancar los agentes

```powershell
# Terminal 1 — monitor de cambios (encendido siempre)
cd agent && npm run watch

# Terminal 2 — build check cada 10 min
npm run build-watch

# Terminal 3 — scheduler nocturno
npm run nightly
```

Ver [docs/runbook/agent_system.md](./agent_system.md) para documentación completa.

---

## Puntos Clave

| Recurso | Ubicación |
|---------|-----------|
| Admin Panel | `/admin` |
| Área miembros | `/miembros` |
| Base de datos | Supabase (ver migraciones en `supabase/migrations/`) |
| Arquitectura del proyecto | `AGENTS.md` |
| Mapa semántico | `.codex/PROJECT_MEMORY.md` |
| Documentación técnica | `docs/runbook/` |
| ADRs (decisiones) | `docs/adr/` |
| Changelog | `docs/changelog/CHANGELOG.md` |

---

## Estructura del proyecto

```
src/
├── app/          # Rutas Next.js (App Router)
├── components/   # Componentes reutilizables
└── lib/supabase/ # Clientes Supabase (browser / server)

supabase/migrations/  # Schema de la base de datos
agent/                # Sistema de agentes autónomos
.codex/               # Configuración MCP + skills del agente
docs/                 # Runbooks, ADRs, changelog
```
