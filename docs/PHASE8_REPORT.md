# Phase 8: Patient Prescription Experience

Implemented in the standalone JavaScript/JSX frontend and backend projects only. The old Medora monorepo was not read or modified. Both standalone working trees were clean at the start. No commits or pushes were made. Existing environment files and configured databases were not modified.

## Screens and behavior

- Home: recent active prescription and next-step copy; link to all prescriptions.
- Prescriptions: server-paginated Active/History segmented control, prescription cards, status, doctor/hospital, issue date, medication summary, loading/error/empty/retry states.
- Details: public RX code, status, care-provider names, issue/expiry/cancellation information, complete medication snapshots, quantities, directions, frequency, duration, strength/form and relevant brand.
- Patient-friendly labels preserve GENERIC_ALLOWED, BRAND_SPECIFIC and DO_NOT_SUBSTITUTE values. Patients cannot edit clinical fields.
- Find My Medication: appears only when the backend returns isActive=true; re-fetches details before proceeding. Opens an explicit upcoming-matching placeholder with a return action. No matching endpoint is called and no pharmacy results are invented.
- Bottom navigation remains Home, Prescriptions, Orders, Profile. Notifications stay in the header. Orders remains a placeholder; Profile retains sign-out.
- Screens use existing theme tokens/Inter/Lucide. Internal navigation returns to the top; Android hardware back returns from the placeholder/details. Lists retain their selected category/page when returning from details.

## API and minimal backend additions

Uses existing authenticated endpoints:

- GET /api/patient/prescriptions?view=active&page=1&limit=10
- GET /api/patient/prescriptions?view=history&page=1&limit=10
- GET /api/patient/prescriptions/:id

Home requests active page 1 with limit 1. The client never supplies a Patient ID. The backend derives ownership from the authenticated User and Patient profile. Existing unfiltered requests remain compatible.

Two additive backend changes were necessary: optional view filtering before pagination (so Active/History are correct across all pages), and minimal doctor {displayName}/hospital {name} summaries. Previously the patient responses contained only their IDs and no authorized endpoint for patient clients to resolve their names. No new endpoints were added. Existing prescription IDs/fields remain unchanged. Queries and status transitions use the existing ISSUED/VIEWED/CANCELLED/EXPIRED semantics; isActive remains server-owned. No clinical, dispensing, ownership or authentication rule was changed.

The frontend refreshes on foreground/periodically and asks the server to recalculate at a supplied expiry. It does not duplicate status eligibility rules. Unknown/malformed responses fail closed with a safe retry message. Missing optional doctor/hospital names display a fallback. Explicit 401 responses share the existing refresh mechanism, retry once, and clear the displayed patient session if invalid. Native refresh storage remains Expo SecureStore; web refresh remains HttpOnly cookies. Prescription data stays in component memory.

## Tests and fixtures

Three Node unit tests cover response validation, substitution labels and safe errors. Expo web browser tests cover actual rendered patient components with HTTP mocks, including loading, empty/error/malformed responses, active/history, pagination, all rule labels, eligibility, cancelled/expired action suppression, navigation, invalid and successful refresh. A browser integration flow uses the real standalone Express/MongoDB API, seeded fictional Patient profile and active/history prescriptions.

The backend suite adds patient response projection/filter/pagination/ownership tests. The existing disposable browser fixture now permits the test Expo origin and supplies cancelled/expired history without changing its record count. It does not read .env or expose test setup routes. Expired time is simulated directly in this isolated fixture only. Existing development seed and configured database are unchanged.

Added mobile dev dependency @playwright/test 1.63.0, reusing the already-locked web test version; no production dependencies or transitive upgrades. No TypeScript was introduced. Existing Expo dependency audit findings from the migration (22 reported during online install) were not addressed by unrelated upgrades.

## Run and manual check

Start the independent backend in its own terminal, then:

```powershell
cd "C:\Users\INFINIX\OneDrive\Documents\Medora-Workspace\medora-frontend"
npm.cmd run dev:mobile
```

For normal use, configure the existing EXPO_PUBLIC_API_URL and backend origins. A physical phone needs the computer's reachable LAN address instead of loopback. Browser origin configuration does not weaken native/browser authentication protections.

For a repeatable fictional integration check:

1. In medora-backend, run npm.cmd run test:browser-server (port 3299).
2. In medora-frontend, run npm.cmd test --workspace @medora/patient-mobile. This starts/stops Expo web on port 8083 automatically. Do not run a second Expo process on that port.
3. The automated UI walkthrough signs in as patient@medora.example.test with the fixture-only password defined in backend tests/doctor-browser-server.js, opens Prescriptions, views a prescription, checks doctor/hospital/medicines/RX/status, opens the placeholder, returns, and opens cancelled and expired history.
4. To perform the same walkthrough interactively, start Expo web with EXPO_PUBLIC_API_URL pointing to the isolated fixture, using port 8083 and an allowed origin. Never use these fixture credentials for real accounts.
   For the interactive fixture walkthrough, run in the frontend terminal:

```powershell
$env:EXPO_PUBLIC_API_URL='http://127.0.0.1:3299'
$env:NODE_OPTIONS='--dns-result-order=ipv4first'
npm.cmd run start --workspace @medora/patient-mobile -- --web --host localhost --port 8083
```

Open http://127.0.0.1:8083 so the browser hostname matches the fixture API cookie hostname. These temporary process variables do not edit .env. Remove the EXPO_PUBLIC_API_URL override or open a new terminal before returning to your normal backend.

5. Stop the fixture when finished. Screenshots/test output are ignored under .tmp.

Expo test tooling uses offline mode and IPv4-first localhost resolution to avoid remote tooling checks and Windows IPv6 readiness mismatch. App API traffic still reaches the real local backend. This only affects test server configuration.

## Changed files

Frontend modified:

- README.md
- package.json
- package-lock.json
- apps/patient-mobile/package.json
- apps/patient-mobile/App.jsx
- apps/patient-mobile/src/PatientLayout.jsx
- apps/patient-mobile/src/auth/AuthGate.jsx
- apps/patient-mobile/src/auth/client.js

Frontend created:

- docs/PHASE8_REPORT.md
- apps/patient-mobile/src/ui/AppText.jsx
- apps/patient-mobile/src/prescriptions/Screens.jsx
- apps/patient-mobile/src/prescriptions/data.js
- apps/patient-mobile/src/prescriptions/usePrescription.js
- apps/patient-mobile/playwright.config.js
- apps/patient-mobile/tests/data.test.js
- apps/patient-mobile/tests/patient.spec.js

Backend modified:

- src/prescriptions/model.js
- src/prescriptions/service.js
- src/prescriptions/routes.js
- tests/prescriptions.test.js
- tests/doctor-browser-server.js

## Verification

- Frontend lint: passed.
- Patient tests: 3 Node unit tests and 12 Expo browser tests passed.
- Existing doctor browser tests: 6 passed against the standalone API.
- Backend tests: 57 passed; backend lint and JavaScript syntax build passed.
- Web production build: passed.
- Expo Android, iOS and web exports: passed.
- Expo startup: confirmed; the seeded-patient UI walkthrough completed against the independently started standalone backend with disposable MongoDB.
- Screenshot review: details, matching placeholder and history inspected at a 390px mobile viewport. Corrected Windows-encoded punctuation and internal scroll restoration, then reran patient tests successfully.
- Source scope audit: no first-party TypeScript, new component API URL literals, real credentials, environment-file changes or backend/frontend source coupling introduced. The only API base configuration remains the existing centralized EXPO_PUBLIC_API_URL client.
- Initial browser attempts encountered a localhost IPv6/IPv4 startup mismatch; the final test configuration resolves localhost IPv4-first and passes. No remaining test failures.
- Frontend/backend formatting and git diff whitespace checks: passed.

## Scope and remaining limitations

No Phase 9/10 inventory/matching, reservations, ordering, payments or new notification/feedback functionality. Find My Medication intentionally stops at its placeholder. Validation uses disposable local data, not the configured live database. Browser interaction covers the actual Expo web rendering; physical Android/iOS device testing and signed native builds are not claimed. The app still requires a valid Patient profile created by the existing backend setup; registration alone does not create domain profiles.
