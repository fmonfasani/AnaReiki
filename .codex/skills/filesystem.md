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

## Usage Instructions
When asked to read a file, use the MCP `filesystem` server.
When asked to locate a function, search by filename pattern or component name.
Always prefer reading the actual file over guessing its contents.
