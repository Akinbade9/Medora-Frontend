# Medora frontend

Independent JavaScript/JSX npm workspace containing React/Vite web-dashboard and React Native/Expo patient-mobile. Phase 1–7 layouts, theme, authentication and doctor workflows are preserved; Phase 8 patient prescription screens are connected to the standalone API. Backend validation is authoritative. No backend source imports or shared backend packages are used.

## Setup

Use Node >=22.13 <23 or >=24.3 and npm >=10. Run npm install at this root. Copy each app's .env.example to .env in that app. The root .env.example is a reference; Vite/Expo read the app-specific files.

- apps/web-dashboard/.env: VITE_API_URL=http://127.0.0.1:3000
- apps/patient-mobile/.env: EXPO_PUBLIC_API_URL=http://127.0.0.1:3000 and EXPO_PUBLIC_WEB_DASHBOARD_URL=http://127.0.0.1:5173

These variables are public bundle values. Never put credentials or backend secrets in them. The central src/auth/client.js in each app reads its API variable. Restart the dev server/rebuild after changing values.

Start the separately installed backend first. Run npm run dev:web for Vite, and npm run dev:mobile for Expo. Expo supports Expo Go/development builds as appropriate for the installed SDK; Android/iOS device tooling is separate. A physical phone cannot use your computer's 127.0.0.1: set EXPO_PUBLIC_API_URL to a reachable LAN/tunnel API URL and configure the backend host/firewall. For Expo web add its exact origin to backend WEB_ORIGINS. Native refresh tokens remain in secure storage; browser refresh cookies and origin protections are preserved.

## Validation

- npm run lint
- npm run build:web
- npm run build:mobile (Expo Android, iOS and web production exports; not signed native binaries)
- npm run build (both apps)
- npm run format:check
- npm exec --workspace @medora/web-dashboard -- playwright install chromium (first-time browser setup)
- npm test: patient unit/browser tests and the existing six doctor browser tests. First start npm run test:browser-server in the backend project; it supplies isolated fictional fixtures at http://127.0.0.1:3299. Tests start their own Vite server at port 5299 and use VITE_API_URL, defaulting to that fixture URL. No backend checkout path is referenced. For a remote fixture, set VITE_API_URL to its HTTP URL and allow the test web origin in that fixture.

TypeScript checking has been replaced by JavaScript linting, API/browser tests and Vite/Expo builds. Patient tests render the actual Expo web screens with mocked HTTP responses, then exercise the standalone API with isolated seeded data. Native device interaction still needs device testing. packages/ is reserved for frontend-only reuse.

See [the migration report](docs/MIGRATION_REPORT.md) for exact verification results, environment setup, known dependency audit findings and platform limitations, and [the file inventory](docs/MIGRATION_FILES.json) for all source/configuration files.

## Patient prescriptions (Phase 8)

The mobile app has a recent-active Home card, paginated Active/History prescription lists, read-only prescription details, and a Find My Medication placeholder. Eligibility comes from the backend isActive flag and is rechecked before opening the placeholder. No pharmacy matches, reservations, orders or payments are implemented.

Run `npm run dev:mobile` from this project. For Expo web use `npm run start --workspace @medora/patient-mobile -- --web` or press w in Expo. Keep EXPO_PUBLIC_API_URL in the existing app-local configuration; use a reachable LAN address for physical phones and allow the browser origin for Expo web. No new environment variables are required.

For tests, first run `npm run test:browser-server` in the standalone backend. Its fictional patient has a Patient profile, active prescriptions and cancelled/expired history. Then run `npm test` here (or `npm test --workspace @medora/patient-mobile` for patient tests only). Patient browser tests use Expo at IPv4 loopback port 8083 and the isolated API at port 3299. Install Chromium once with `npm exec --workspace @medora/patient-mobile -- playwright install chromium`. The frontend never starts/imports backend source.

See [Phase 8 report](docs/PHASE8_REPORT.md) for files, API changes, verification and manual flow.
