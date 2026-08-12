# Backend setup boundary

The public application currently runs with `PERSISTENCE_MODE=demo`. Review and
report requests pass through validated server routes, receive append-only
receipts, and explicitly return `persisted: false` / `DEMO_REPLAY`. The browser
keeps the synthetic walkthrough state so the showcase remains deterministic.

Do not switch the application to real-data mode merely by adding a database
URL. Authentication, tenant claims, private evidence storage, retention,
regional processing, and access policies must be established first.

## Implemented now

- tenant-scoped repository contracts for assessments, evidence, reviews, audit
  events, and reports;
- deterministic demo repository with fail-closed tenant checks;
- validated `POST /api/reviews` boundary with assessment/finding reconciliation;
- report-generation receipt boundary and persistence-mode response header;
- append-only PostgreSQL/RLS target migration in
  `db/migrations/0001_protection_core.sql`;
- no database credential, private URL, token, or real customer record in the
  repository.

## Production activation checklist

1. Select the approved deployment region and managed PostgreSQL provider.
2. Add authentication and map every session to an authorized
   `organization_id` and role.
3. Provision separate development, preview, and production databases.
4. Store `DATABASE_URL` only as a server-side Vercel environment variable.
5. Apply the migration using a dedicated migration role; the application role
   must not own or bypass row-level security.
6. Implement the PostgreSQL adapter behind `getRepositories()` and set the
   tenant claim with a transaction-scoped `app.organization_id` value.
7. Add private object storage for evidence and reports with short-lived signed
   access; never expose storage credentials to the browser.
8. Add idempotency, authorization, tenancy, retention/deletion, backup/restore,
   and audit-integrity tests.
9. Complete security, privacy, legal, vendor, and regulatory review before
   accepting non-synthetic data.
10. Only then set `PERSISTENCE_MODE=postgres` in an authenticated environment.

## Environment contract

```text
DEMO_MODE=true
AI_MODE=replay
PERSISTENCE_MODE=demo
DATABASE_URL=
```

`DATABASE_URL` is intentionally blank in `.env.example`. Never prefix it with
`NEXT_PUBLIC_`, commit a populated value, print it in logs, or share it in a
client response.

## Review request contract

`POST /api/reviews` accepts a tenant-scoped assessment/finding command, checks
that the exact finding exists in the supplied deterministic event snapshot,
and returns a receipt. In demo mode the receipt includes:

```json
{
  "accepted": true,
  "persisted": false,
  "storageMode": "DEMO_REPLAY"
}
```

The public UI updates its local synthetic state only after this server
validation succeeds. A future PostgreSQL adapter must preserve the same
response schema while returning `persisted: true` and `storageMode: POSTGRES`.
