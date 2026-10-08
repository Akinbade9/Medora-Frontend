# Medora split and JavaScript migration — 7 October 2026

## Created projects

- Backend: C:\Users\INFINIX\OneDrive\Documents\Medora-Workspace\medora-backend
- Frontend: C:\Users\INFINIX\OneDrive\Documents\Medora-Workspace\medora-frontend

Each project includes its own package.json, generated package-lock.json, ESLint/Prettier configuration, .gitignore, .env.example, README, copied product specification and exact source/configuration file inventory at docs/MIGRATION_FILES.json. Backend owns src/, tests/ and verification scripts/. Frontend owns apps/web-dashboard/, apps/patient-mobile/ and a packages/ directory reserved for frontend-only reuse. No Git repository was initialized. Installed dependencies and generated build/test output are excluded from the inventories and Git.

The original Medora source remains unchanged. No original .env, credentials, Git metadata, dependencies, caches, temporary files or build outputs were copied. Dependencies were installed afresh in each project. New caches, screenshots and bundles were produced by validation, not copied from the original.

## Conversion and removed coupling

- Converted all 38 backend TypeScript source/test/helper files to JavaScript ES modules. Converted backend tests to .test.js, retaining all 54 original test cases and adding two migration regressions (56 total).
- Converted 19 web component/module/config/test files to JS/JSX; dropped the twentieth, a purely type-only doctor/types.ts module. Converted all six Expo TS/TSX files to JS/JSX, including index.js and App.jsx.
- Removed direct TypeScript, tsx, typescript-eslint and @types/* dependencies, all tsconfig files and typecheck scripts. Third-party dependencies may still contain their own types/tooling. Backend build now checks JavaScript syntax; frontend validation uses ESLint, browser tests and Vite/Expo builds.
- Removed @medora/shared-types from all app manifests and erased type-only imports. The unused @medora/validation placeholder was not carried over. Zod, Mongoose validation and all business/authorization logic remain backend-owned; no backend validation was copied into the frontend.
- Replaced the browser test's direct sibling API process launch with an explicitly started standalone backend fixture at port 3299. The frontend connects using VITE_API_URL and never imports or launches backend source. Start a fresh fixture per test-suite run to reset test data and rate-limit state.
- Updated Vite/Expo entrypoints, lint patterns, package scripts and local configuration for JavaScript. Web and mobile retain central HTTP clients at src/auth/client.js, reading VITE_API_URL and EXPO_PUBLIC_API_URL respectively.
- No new direct npm dependency was introduced. Existing development tooling was moved into the appropriate independent manifests. react-native-svg is pinned to 15.15.4, the installed Expo SDK's expected version, instead of the old caret range that freshly resolved to 15.15.5.

## Verification

- Backend npm install: passed; installation audit reported zero vulnerabilities.
- Backend npm test: 56/56 passed. Covers auth, RBAC, sessions, CSRF/origins, domain validation, catalogue, seed idempotency, prescription permissions/codes/cancellation and patient ownership.
- Backend lint and JavaScript syntax build: passed.
- Backend npm run seed:dev and npm run dev: passed with disposable MongoDB and fresh ephemeral credentials; GET http://127.0.0.1:3300/api/health returned HTTP 200. Normal startup also passed through npm run test:startup.
- Port 3000 was already occupied. The existing process was not stopped; standalone startup was verified on 3300. No claim is made that the process on 3000 was the new backend.
- Frontend install, lint and Vite production build: passed.
- Doctor browser tests: 6/6 passed against the standalone backend over HTTP..
- Expo Android/iOS/web exports: passed after the SDK-compatible SVG pin..
- Expo development startup: passed at localhost:8083; /status returned HTTP 200. This verifies Metro startup, not native-device interaction.
- Expo dependency compatibility: passed after pinning react-native-svg 15.15.4.
- Separation audit: no first-party TS/TSX/tsconfig files, real .env files, Git metadata, shared backend packages or relative imports escaping either project.

## Failures encountered and differences

- An initial startup probe encountered an existing listener on port 3000. Fixed misleading success logging by waiting for the actual listening event; reran successfully on isolated port 3300.
- Unrestricted Node watch mode repeatedly restarted in this Windows/OneDrive workspace. The dev command now watches src explicitly; the exact npm development command was rechecked successfully. The scoped watch option targets Windows/macOS; on platforms without --watch-path support use npm start or node --watch src/server.js.
- The refresh browser test exposed timing sensitivity around duplicate development-mode profile requests and its HTTP response waiter. It now exercises one actual frontend API-client request on an idle screen with the waiter armed before the one-shot 401, confirms the real refresh and retried response, then checks the profile UI. Diagnostic output was removed. Intermediate suite attempts also encountered session/startup timing failures during concurrent validation; final results above refer to a fresh fixture run.
- Generic parseInput rejection text now says 'Invalid input. Check the required fields and values.' rather than mislabelling non-auth failures as authentication errors. Validation rules, HTTP statuses and response structure are unchanged.
- Startup diagnostics identify configuration, database connection or index initialization failures without printing connection strings/credentials. API paths, product workflows, auth/CSRF protections, UI styling and Phase 1–7 scope otherwise remain unchanged. No Phase 8 functionality was added.
- npm audit reports 22 frontend dependency-tree findings (7 moderate, 15 high), through Expo/React Native dependencies including braces, node-forge and uuid. These remain unresolved; suggested major Expo/React Native changes were not applied during the migration. Audit is not a passing check.
- The final online Expo compatibility check encountered a transient TLS failure; a retry passed with 'Dependencies are up to date'.
- Live Atlas connectivity was not tested because no real credentials were copied or used. Physical Android/iOS device interaction and signed native builds were not performed. Expo exports are bundles, not store-ready binaries.

## Environment setup

Create three .env files manually by copying each project's/app's .env.example, not the old project's real .env.

Backend .env: NODE_ENV=development, HOST=127.0.0.1, PORT=3000, your MONGODB_URI, a new random 64-hex-character JWT_ACCESS_SECRET, optional SEED_PASSWORD (12–128 characters, development seed only), and WEB_ORIGINS. The example allows both http://127.0.0.1:5173 and http://localhost:5173, plus Expo web at http://127.0.0.1:8081. Production HTTPS/secure-cookie/origin restrictions are retained.

Web apps/web-dashboard/.env: VITE_API_URL=http://127.0.0.1:3000 and optional VITE_PATIENT_APP_URL=http://127.0.0.1:8081. For localhost browsing use the matching localhost API hostname so SameSite cookies remain same-site; allow the exact browser origin in WEB_ORIGINS.

Mobile apps/patient-mobile/.env: EXPO_PUBLIC_API_URL=http://127.0.0.1:3000 and EXPO_PUBLIC_WEB_DASHBOARD_URL=http://127.0.0.1:5173. A physical phone needs a reachable LAN/tunnel API URL, an appropriate backend HOST and firewall access; its 127.0.0.1 is the phone itself. Public frontend variables must never contain credentials.

The root frontend .env.example is a reference only: Vite and Expo read app-local environment files. If port 3000 remains occupied, choose another backend PORT and update both API URL variables accordingly. Restart/rebuild frontend apps after changing public variables.

## Start commands (PowerShell, separate terminals)

Backend:

```powershell
cd "C:\Users\INFINIX\OneDrive\Documents\Medora-Workspace\medora-backend"
npm.cmd run dev
```

Web:

```powershell
cd "C:\Users\INFINIX\OneDrive\Documents\Medora-Workspace\medora-frontend"
npm.cmd run dev:web
```

Patient app:

```powershell
cd "C:\Users\INFINIX\OneDrive\Documents\Medora-Workspace\medora-frontend"
npm.cmd run dev:mobile
```

For browser integration tests, run npm run test:browser-server in the backend and npm test in the frontend, then stop the fixture. Backend seed commands use the configured database and should only target a dedicated development database. API remains authoritative over all clinical and authorization validation.
