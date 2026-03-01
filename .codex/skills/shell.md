# Skill: shell

## Purpose
Allows the agent to execute project scripts, run the dev server, and invoke linters from PowerShell.

## Environment
```
Shell:    PowerShell (Windows 11)
Node:     (detected from system)
Package:  npm
Root:     C:\Users\fmonf\Desktop\Software Enginnering LAPTOP\Agencia B2B\AnaReiki\
```

## Available npm Scripts
| Script       | Command              | Description                        |
|--------------|----------------------|------------------------------------|
| dev          | `npm run dev`        | Start Next.js dev server (port 3000) |
| build        | `npm run build`      | Production build (Next.js)         |
| start        | `npm start`          | Start production server            |
| lint         | `npm run lint`       | Run ESLint                         |

## How to Run Dev Server
```powershell
cd "C:\Users\fmonf\Desktop\Software Enginnering LAPTOP\Agencia B2B\AnaReiki"
npm run dev
```
The app will be available at http://localhost:3000

## Linting
```powershell
cd "C:\Users\fmonf\Desktop\Software Enginnering LAPTOP\Agencia B2B\AnaReiki"
npm run lint
```
Config: `eslint.config.mjs` (ESLint 9 flat config)

## TypeScript Type Check
```powershell
npx tsc --noEmit
```

## Install Dependencies
```powershell
npm install
```

## Environment Variables
Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`

## Safety Rules
- Never run `npm run build` in production CI without checking lint first
- Never expose `.env` values in logs or diffs
- Always `cd` to project root before running scripts
