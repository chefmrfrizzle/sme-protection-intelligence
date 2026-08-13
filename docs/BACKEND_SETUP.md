# Backend setup

## Plain-English status

The public demo works like a resettable practice account. It needs no login and
does not save server records. A visitor who selects **Sign in to save** receives
a passwordless email link. After sign-in, reviews, assessment snapshots, audit
events, and report receipts survive refreshes and deployments.

The connected Supabase project supplies three things in one free prototype
service:

1. Supabase Auth verifies the person using the saved workspace.
2. PostgreSQL stores structured records.
3. The private `evidence-private` bucket supports governed synthetic evidence
   lifecycle tests. It is not approved for real customer documents.

No real SME data is stored. The production Site URL is the live Vercel auth
callback. The database region is Singapore.

## Current operating modes

| Visitor    | Result                                                                          |
| ---------- | ------------------------------------------------------------------------------- |
| Signed out | Deterministic browser replay; receipts say `DEMO_REPLAY` and `persisted: false` |
| Signed in  | Tenant-checked PostgreSQL writes; receipts say `POSTGRES` and `persisted: true` |

The public demo is deliberately not locked behind a login so judges can use it
immediately.

## Setup and repair commands

The Vercel project and Supabase resource must already be linked. Environment
values live in `.env.local` and Vercel; they are ignored by Git.

```bash
vercel env pull .env.local --yes
npm run db:migrate
npm run storage:provision
npm run quality
```

`db:migrate` is idempotent: it records each applied SQL file and skips it on the
next run. `storage:provision` creates the private bucket only when missing.

## Security model

- Server routes verify Supabase JWT claims; they do not trust a browser-supplied
  user or company membership.
- The synthetic organization is the only tenant available in this showcase.
- Every structured record includes `organization_id`.
- Every application table created by the migrations has RLS enabled and direct
  Data API grants are revoked.
- Anonymous and authenticated Data API table grants are revoked; validated
  Next.js server routes own writes.
- Review, audit, and assessment-version rows are append-only.
- The service/secret key and database URLs are server-only.
- Private evidence access has no public bucket URL. Signed downloads expire after
  60 seconds and produce access receipts.
- Synthetic uploads are quarantined, validated, hashed, scanned through the demo
  scanner adapter, versioned, and audited. Retention and legal hold block erasure;
  approved erasure removes content and retains a non-sensitive tombstone.

## Environment names

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
POSTGRES_URL
POSTGRES_URL_NON_POOLING
SUPABASE_URL
SUPABASE_SECRET_KEY
```

Only the URL and publishable key are intentionally browser-visible. A
publishable key identifies the Supabase project; it does not bypass RLS. Never
prefix database passwords, service-role keys, or secret keys with
`NEXT_PUBLIC_`.

## Before accepting real SME data

This prototype is not ready for real insurance documents. Approved membership,
signed synthetic upload/download, retention, deletion, and access-ledger code now
exists, but a production scanner, approved policies, target-region validation,
backup/restore rehearsal, monitoring, penetration testing, and independent legal,
privacy, security, and regulatory review are still required.
