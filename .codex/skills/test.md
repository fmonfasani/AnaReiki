# Skill: test

## Purpose
Auto-detect and execute tests for the AnaReiki project.

## Current Test Status
> ⚠️ **No test framework configured.**
> The project has no Jest, Vitest, or Pytest dependency in `package.json`.
> Tests need to be set up from scratch.

## Auto-Detection Logic
Run this to check if any test runner is present:
```powershell
cd "C:\Users\fmonf\Desktop\Software Enginnering LAPTOP\Agencia B2B\AnaReiki"
cat package.json | Select-String "jest|vitest|pytest|test"
```

## Recommended Setup: Vitest (for Next.js 16 + TypeScript)

### Install
```powershell
npm install --save-dev vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom
```

### vitest.config.ts
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### Add to package.json scripts
```json
"test": "vitest run",
"test:watch": "vitest"
```

### Run tests (once configured)
```powershell
npm test
```

## Priority Test Targets
Once configured, write tests for:
1. `src/lib/supabase/server.ts` - Supabase client factory
2. `src/components/BookingCalendar.tsx` - Date selection logic
3. `src/components/MoodTracker.tsx` - Mood save/load logic
4. `src/app/api/` - API route handlers
5. `src/middleware.ts` - Auth redirect logic

## E2E Testing (Playwright)
```powershell
npm install --save-dev @playwright/test
npx playwright install
npx playwright test
```

## Usage Instructions
When asked to run tests, first check if `vitest` or `jest` is in `package.json`.
If not, recommend installing Vitest and offer to scaffold the first test file.
