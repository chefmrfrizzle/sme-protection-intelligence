# BUILD NOW Delivery Plan

Prepared from the 13 August 2026 control pack. This plan preserves the public,
deterministic synthetic demo while adding production-oriented control boundaries.
It is engineering guidance, not legal, regulatory, privacy, or insurance advice.

## Trusted-state decisions

- Review states describe workflow only. They never confirm coverage or claim
  validity.
- Signed-in reports derive review state from stored review events. Browser query
  parameters are accepted only by the explicit signed-out demo replay path.
- Authentication proves identity; an active, approved organization membership
  authorizes actions.
- Production receipts use canonical JSON plus SHA-256. Demo hashes remain visibly
  marked as replay-only where retained for backwards compatibility.
- External event intake uses a documented HMAC-SHA256 profile over method, target,
  content digest, tenant credential, timestamp, expiry, nonce, and idempotency key.
- Evidence starts quarantined and cannot enter extraction until validation and a
  scanner adapter approve it.
- Extractors create candidates. Only deterministic validation or a human can
  promote a candidate to a materialized temporal fact.
- Committed workflow state and its outbound event are written in one transaction.

## Increment plan

### Increment 1 — membership, roles, trusted review and reports

Files: `domain/authorization.ts`, `domain/schemas.ts`, `db/contracts.ts`, database
repositories, report/review routes, migration `0003`, and authorization/report
tests.

Acceptance: uninvited and revoked users fail closed; caller-supplied roles are
ignored; signed-in reports load stored review events; cross-tenant identifiers do
not disclose object existence; report generation emits an audit receipt.

Rollback: revert the increment commit. The signed-out demo repository and the
existing deterministic assessment builder remain unchanged.

### Increment 2 — signed intake and cryptographic audit

Files: integration envelope schemas, signing/canonicalization services, intake
repository, `/api/events`, migration `0004`, and adversarial signature/replay tests.

Acceptance: modified, expired, replayed, over-limit, wrong-tenant, unsupported,
and duplicate requests have explicit, auditable results. Accepted work creates an
event, receipt, and job atomically.

Rollback: disable signed mode by removing tenant credentials. The unsigned public
preview remains available only for clearly synthetic sandbox events.

### Increment 3 — evidence lifecycle and temporal provenance

Files: evidence/fact schemas and services, storage/scanner interfaces, migration
`0005`, governed demo routes, and lifecycle/temporal tests.

Acceptance: quarantine, type and size validation, hashing, scanner disposition,
versions, access records, retention, legal hold, deletion tombstones, source spans,
conflicts, supersession, corrections, and time-based snapshots are executable and
tested without real documents.

Rollback: remove application routes while retaining append-only metadata. Never
delete historical records as a rollback technique.

### Increment 4 — queue, outbox, delivery and isolation proof

Files: job/outbox schemas and services, webhook safety/signing modules, migration
`0006`, worker-facing routes, fault tests, and the control-centre UI.

Acceptance: retries are idempotent, poison work dead-letters, private-network and
unapproved destinations are rejected, delivery receipts are signed, and every
database table has tenant-safe keys, RLS, grants, and append-only enforcement where
required.

Rollback: pause workers and deliveries while keeping queued/outbox records intact.

## Production dependencies that code cannot decide

- customer-approved identity provider, role owners, and invitation process;
- authoritative systems, field mappings, sandbox credentials, and volumes;
- evidence classifications, residency, retention, legal-hold, and deletion policy;
- malware-scanning vendor and approved model/data-processing configuration;
- webhook destinations, signing-secret custody, rotation, and incident contacts;
- availability, RPO/RTO, support, security testing, and regulatory/legal approvals.

Until those are supplied and exercised in the target environment, related
capabilities must remain `MAPPING-READY` or `VALIDATED in the synthetic demo`, not
`LIVE`.
