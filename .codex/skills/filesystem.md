# Skill: filesystem

## Purpose
Allows the agent to read, navigate, and map the AnaReiki codebase without manual copy-paste.

## Capabilities
- Read any file in the project
- Map directory architecture
- Locate functions, components, and types
- Detect patterns and cross-file dependencies

## Key Project Paths
```
Root:         C:\Users\fmonf\Desktop\Software Enginnering LAPTOP\Agencia B2B\AnaReiki\
App Router:   src/app/
Components:   src/components/
Lib:          src/lib/supabase/
Middleware:   src/middleware.ts
DB Schema:    supabase/migrations/
Config:       next.config.ts, tsconfig.json, package.json
Styles:       src/app/globals.css
```

## Route Map
| Route            | File                                      |
|------------------|-------------------------------------------|
| /                | src/app/page.tsx                          |
| /miembros        | src/app/miembros/                         |
| /admin           | src/app/admin/layout.tsx + page.tsx       |
| /contacto        | src/app/contacto/                         |
| /login           | src/app/login/                            |
| /registro        | src/app/registro/                         |
| /servicios       | src/app/servicios/                        |
| /filosofia       | src/app/filosofia/                        |
| API              | src/app/api/                              |

## Component Inventory
- `Navbar.tsx` - Navigation bar (public)
- `Footer.tsx` - Site footer
- `Therapies.tsx` - Service cards section
- `Encounters.tsx` - Encounters/sessions section
- `Timeline.tsx` - Journey/process timeline
- `BookingCalendar.tsx` - Date picker for appointments
- `MoodTracker.tsx` - Member mood logging
- `Encounters.tsx` - Session/encounters display
- `AdminLayoutUI.tsx` - Admin panel shell
- `LogoutButton.tsx` - Supabase signout
- `VideoPlayer.tsx` - Cloudinary video embed
- `PodcastPlayer.tsx` - Audio embed

## Surgical Discovery Patterns (Token Saving)
To maximize productivity and minimize token usage, follow these patterns instead of reading full files:

1. **Symbol Location**:
   Instead of reading a file to find a function, use `shell` search:
   `grep -nE "function|const|class" src/lib/supabase/server.ts`

2. **Usage Tracking**:
   `grep -r "createClient" src/`

3. **Partial Reading (PowerShell)**:
   If the file is > 100 lines, read only the target range:
   `Get-Content -Path "file.ts" -TotalCount 50 | Select-Object -Last 10` (reads lines 40-50)

4. **Component Props Check**:
   Instead of reading the whole component, check the `interface` or `type` definition using `grep`.

---

## Usage Instructions
1. Use **Surgical Discovery** tools (grep/findstr) before reading full files.
2. If you must read a file, use the MCP `read_file` tool.
3. Always check `PROJECT_MEMORY.md` first to find the correct path.
