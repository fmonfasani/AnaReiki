# AnaReiki — Codex Agent Instructions

> Este archivo es el system prompt persistente para Codex CLI en este proyecto.

---

## Regla #1 — Eficiencia de Tokens (Token Saving)

Para maximizar la productividad y minimizar el costo:

1. **Discovery first**: Nunca leas un archivo sin antes usar `grep` o herramientas de MCP para verificar si es el correcto.
2. **Lectura parcial**: Si necesitas entender una función, lee solo el rango de líneas de esa función, no el archivo de 500 líneas.
3. **No reasumir**: Usa `PROJECT_MEMORY.md` para navegar. No pierdas tokens pidiendo al agente "explorar el proyecto" si el mapa ya existe.

---

## Regla #2 — Orden de Contexto Quirúrgico

Al iniciar una tarea:
1. Revisa `PROJECT_MEMORY.md` para ubicar el componente/función.
2. Usa MCP `filesystem` para leer solo la parte relevante.
3. SOLO lee `AGENTS.md` si la tarea implica lógica de negocio core o base de datos.

---

## Regla #2 — Usar las skills disponibles

Para cada tipo de tarea, usar el skill correspondiente:

| Necesito... | Skill a usar |
|-------------|-------------|
| Leer/navegar código | `.codex/skills/filesystem.md` |
| Analizar commits, diffs | `.codex/skills/git.md` |
| Correr npm scripts, lint, build | `.codex/skills/shell.md` |
| Ejecutar o configurar tests | `.codex/skills/test.md` |

---

## Regla #3 — Cómo proponer cambios

**Siempre** proponer cambios en formato diff. Nunca reescribir archivos completos.

```diff
- código que se elimina
+ código que se agrega
  línea sin cambios
```

Antes de modificar un archivo:
1. Leerlo completo
2. Identificar exactamente qué líneas cambian
3. Proponer el diff mínimo necesario

---

## Regla #4 — Commits

Formato de commits del agente:

```
feat: descripción breve del cambio        # feature nueva
fix: descripción del bug corregido         # corrección
refactor: descripción de la refactorización
agent: auto-fix after change in <archivo>  # watcher
agent(nightly): automated maintenance YYYY-MM-DD
```

**Nunca** hacer commit de:
- Archivos `.env` o `.env.local`
- `node_modules/`
- Archivos de build (`.next/`, `build/`)

---

## Regla #5 — Stack del proyecto

Este es el stack. No sugerir alternativas salvo que el usuario lo pida:

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript estricto |
| Estilos | Tailwind CSS v4 |
| Base de datos | Supabase (PostgreSQL) |
| Auth | Supabase SSR (`@supabase/ssr`) |
| ORM | Ninguno — Supabase JS client directo |
| Email | Resend |
| Media | Cloudinary (videos), Spotify (podcasts) |
| Animaciones | Framer Motion |

---

## Regla #6 — Patrones de código obligatorios

### Data fetching
```typescript
// ✅ Correcto: Server Component con cliente de servidor
import { createClient } from "@/lib/supabase/server";
const supabase = await createClient();
const { data, error } = await supabase.from("profiles").select("*");
```

### Verificar autenticación (Server Component)
```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) redirect("/login");
```

### Mutations
Usar Server Actions en `src/actions/`. Nunca fetch a API routes para mutaciones internas.

### Importaciones
Siempre usar alias `@/` para imports internos:
```typescript
import { createClient } from "@/lib/supabase/server"; // ✅
import { createClient } from "../../lib/supabase/server"; // ❌
```

---

## Regla #7 — Seguridad

- **Nunca** exponer valores de `.env` en logs, diffs, o respuestas
- Verificar que toda ruta protegida pase por `updateSession()` en middleware
- Admin routes → verificar en `admin_users` tabla, no solo en layout
- Toda mutación de DB en Server Actions debe verificar sesión activa

---

## Regla #8 — Qué NO hacer

- ❌ No reescribir archivos completos cuando solo cambia una línea
- ❌ No instalar dependencias sin preguntar
- ❌ No cambiar el stack sin aprobación explícita
- ❌ No hacer `npm run build` en el watcher (lento) — está en `buildWatcher.js`
- ❌ No ignorar errores de TypeScript — el proyecto usa `strict: true`
- ❌ No usar `any` como tipo sin comentar por qué

---

## Regla #9 — Ante un bug, seguir este orden

1. Leer el archivo afectado completo
2. Revisar `git log --oneline -10` — ¿cuándo se introdujo?
3. Verificar tipos TypeScript en el área afectada
4. Verificar que el cliente Supabase correcto esté siendo usado (browser vs. server)
5. Proponer el fix mínimo en diff

---

## Regla #10 — Reportar siempre

Al terminar cualquier tarea, reportar:

```
✅ Hecho: [descripción de lo que se hizo]
📁 Archivos modificados: [lista]
⚠️  Pendiente: [si quedó algo sin resolver]
```
