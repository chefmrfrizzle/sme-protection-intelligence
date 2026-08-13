# [PRODUCT] - SME Protection Intelligence Demo

> SMEs change every day. Their protection may not.

[PRODUCT] is a synthetic-data, evidence-first demonstration of continuous exposure-to-protection reconciliation for growing SMEs. It detects `Protection Drift`: material differences between how a business operates now and what its supplied insurance programme appears to protect.

This application is decision support only. It does not determine, confirm, deny, bind, or price coverage; provide legal advice; decide claim validity; or replace an insurer, broker, underwriter, or risk professional.

## What works in the demo

- deterministic baseline and five material change scenarios;
- explicit protection states, including abstention and interpretation-required outcomes;
- versioned rules with complete calculation traces;
- source-linked evidence and conflict-aware provenance;
- adversarial Coverage Challenge Pass for every candidate gap;
- Simple, Insurance, and Evidence explanation lenses;
- Protection Diff, event timeline, scenario simulator, human review, and append-only audit history;
- replayed validated AI extraction behind a typed agent harness;
- downloadable professional PDF report and reproducible assessment receipt;
- a canonical structured event API (`POST /api/events`) with a synthetic
  unsigned preview and an optional signed, replay-resistant durable boundary;
- optional passwordless sign-in for a saved demonstration workspace;
- a validated review API (`POST /api/reviews`) with durable signed-in receipts;
- tenant-scoped PostgreSQL persistence with Supabase Auth and row-level security;
- a private evidence bucket for future PDF/document intake;
- resettable, third-party-independent demo mode.

All company, person, policy, financial, asset, supplier, infrastructure, and document data is synthetic.

## Quick start

Requirements: Node.js 22+ and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. The demo itself needs no secrets or external services.

The deployed site also has an optional **Sign in to save** flow. Signed-out users
remain in deterministic replay mode. Signed-in users save assessment versions,
reviews, audit events, and report receipts to the protected Singapore database.

## Quality gate

```bash
npm run quality
```

This runs formatting checks, lint, typecheck, unit/golden tests, production build, and Playwright end-to-end tests. Install the browser once with `npx playwright install chromium` if needed.

## Demo rehearsal

1. Reset to Protection Profile v1 on Overview.
2. Open Changes and apply **New warehouse**.
3. Open the new-location finding and inspect Simple, Insurance, and Evidence lenses.
4. Open the source excerpts and Coverage Challenge result.
5. Apply **Cloud dependency** and show `EVIDENCE_INCOMPLETE` abstention.
6. Request professional review.
7. Open Reports and download the assessment PDF.
8. Open the audit trail and compare assessment versions.

## Canonical event API

`POST /api/events` validates the integration-ready event envelope and returns the deterministic impact preview. The unsigned demo endpoint does not persist data.
When server-side integration credentials and PostgreSQL metadata are configured,
the same route accepts the versioned signed envelope, enforces freshness, digest,
tenant, nonce, idempotency, and rate controls, and atomically writes an event,
receipt, audit event, and queued job. See
[Signed Intake Profile](docs/SIGNED_INTAKE_PROFILE.md).

```json
{
  "organizationId": "org_pacific_components",
  "eventType": "LOCATION_ADDED",
  "observedAt": "2026-07-01T02:00:00.000Z",
  "source": { "type": "sandbox", "name": "asset-system" },
  "payload": { "locationId": "loc_b", "country": "SG" },
  "evidenceReferences": ["ev_lease_b"]
}
```

## Repository map

See [Architecture](docs/ARCHITECTURE.md), [Algorithms](docs/ALGORITHMS.md),
[Implementation Plan](docs/IMPLEMENTATION_PLAN.md), and
[Backend Setup](docs/BACKEND_SETUP.md). Engineering and safety constraints are
in [AGENTS.md](AGENTS.md).

## Dependencies and why they exist

- `next`, `react`, `react-dom`: application and server runtime;
- `zod`: validated domain, event, agent, and API boundaries;
- `lucide-react`: accessible interface icons;
- `pdf-lib`: deterministic server-side PDF generation without a browser service;
- `@supabase/supabase-js`, `@supabase/ssr`: passwordless sign-in and secure
  server-session cookies;
- `postgres`: small server-only PostgreSQL driver for transactional persistence;
- `dotenv-cli`: loads ignored local environment values for migration scripts;
- `vitest`: domain, schema, rules, challenge, and report tests;
- `@playwright/test`: reset-to-report browser validation;
- TypeScript and ESLint: static correctness and code-quality gates.

No analytics, model call, identity, or database session is required by the
public demonstration. Supabase is used only by the optional signed-in workspace.

## Security and privacy boundary

- Synthetic data only; no real SME or insurer information.
- `.env*`, `.vercel`, secrets, tokens, private source documents, build output, and local reports are ignored.
- Signed-out scenario state stays in the visitor's browser; receipts explicitly
  return `persisted: false` / `DEMO_REPLAY`.
- Signed-in review and report actions use a server-verified Supabase identity,
  tenant membership checks, append-only tables, and `POSTGRES` receipts.
- Every application table has row-level security. Anonymous Data API reads are
  revoked, and the evidence bucket is private.
- This is still a synthetic prototype. Real SME data requires retention/deletion
  workflows, monitoring, backups, role onboarding, signed document delivery, and
  independent security/privacy/legal review.

## AI boundary

Replay mode loads previously validated structured extraction fixtures. A future live adapter must use the same Zod input/output contract, capped retries/timeouts, explicit tools, provenance requirements, run IDs, prompt/model versions, token/cost telemetry, and deterministic post-validation. An agent can never promote its own output into a confirmed finding.

## Branding

Temporary branding is centralized in `domain/brand.ts`. Change the name, logo mark, accent tokens, and report metadata there without modifying domain logic. Do not add insurer logos or imply endorsement without permission.
