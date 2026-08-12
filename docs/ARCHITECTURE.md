# Architecture

## Goal

[PRODUCT] continuously reconciles a versioned representation of business reality against supplied insurance evidence. The demonstration is a deterministic, replayable decision-support application. It does not make coverage determinations.

## Runtime shape

```text
Browser / SME user
  -> Next.js App Router UI
  -> Demo state controller (versioned local synthetic scenario)
  -> Domain services
       -> canonical event validation
       -> temporal exposure reducer
       -> evidence completeness
       -> deterministic reconciliation
       -> materiality rules
       -> candidate findings
       -> coverage challenge
       -> assessment snapshot + append-only audit receipt
  -> report route -> PDF artifact
```

The deployed demonstration does not require a database, a model call, or an external connector. Validated extraction results are replayed from the synthetic corpus. This avoids an unreliable live dependency while exercising the same typed downstream interfaces a live extraction adapter uses.

## Production target architecture

The domain layer is storage-agnostic. A production implementation replaces the demo repository with tenant-scoped Postgres repositories and private object storage while preserving the same input/output schemas.

```text
Connector / upload -> signed intake API -> object storage
  -> queued extraction harness -> validated facts + provenance
  -> append-only event store -> reconciliation worker
  -> assessment/read model -> web application / broker review / reports
```

Recommended production controls:

- PostgreSQL row-level security using `organization_id` on every record;
- private encrypted object storage with short-lived signed URLs;
- idempotency keys and signature verification on event ingestion;
- a queue for extraction/reconciliation jobs;
- role-based authorization for SME, broker/advisor, insurer reviewer, and admin;
- separate write permissions for raw evidence, extracted facts, human corrections, and assessment reviews;
- immutable audit tables with snapshot hashes and retention/deletion policy enforcement;
- region, vendor, and data-processing review before use with real data.

## Repository tree

```text
app/                     routes, layouts, report and event APIs
components/              presentation and interaction components
domain/
  evidence/              completeness and provenance helpers
  reconciliation/        deterministic assessment pipeline
  rules/                 versioned thresholds and rule evaluator
  schemas.ts             canonical Zod schemas
  types.ts               inferred domain types
agents/                   typed AI harness interfaces and replay adapter
demo/                     synthetic company, evidence, events, golden cases
evals/                    golden scenario expectations
tests/                    unit, schema, report, and browser tests
docs/                     architecture, algorithms, and implementation plan
```

## Protection Graph

The prototype materializes the graph as typed nodes and edges inside an assessment snapshot. Production storage may use relational adjacency tables; a graph database is not required for the demonstrated queries.

Node IDs are stable and tenant-scoped. Every edge has `validFrom`, optional `validTo`, and provenance references. Key traversals are:

- change event -> changed exposure -> affected domain;
- finding -> rule result -> observed facts and insurance facts;
- fact -> source excerpt -> evidence artifact;
- candidate finding -> challenge search -> final protection state;
- assessment version -> exact evidence, ruleset, prompt/model metadata, and human reviews.

## Orchestration and trust boundaries

1. Validate a new evidence artifact or canonical event.
2. Extract structured facts through a bounded agent adapter or replay fixture.
3. Validate output schema and verify every fact cites a source span.
4. detect contradictory facts without selecting a winner.
5. determine whether the domain checklist is complete enough to evaluate.
6. execute deterministic rules and persist rule ID, version, inputs, threshold, result, and time.
7. create a candidate finding only when materiality passes.
8. run the challenge pass against endorsements, newer policy versions, declarations, and conflicts.
9. map the challenge outcome to an explicit protection state.
10. generate explanations only from the structured result.
11. record human disposition as a new review/audit event.
12. snapshot the version and generate a report/receipt.

## Contradictions and resolved assumptions

- "Continuously" does not mean autonomous unbounded polling. Production uses event-driven reconciliation; the demo uses deliberate events.
- "Immutable" and "deletion capability" are reconciled by append-only decision history plus tenant data-erasure workflows. Erasure creates a tombstone audit event and removes protected content according to policy; it does not silently rewrite prior decisions.
- A public demo cannot safely prove real multi-tenant isolation without an identity provider and database. The code keeps tenant IDs and repository boundaries explicit, but production authentication/RLS is a separate hardening milestone.
- A live AI call is not required for the recorded demo. Replay mode contains previously validated structured results and exercises the same schemas and deterministic engine.
- `Protection Alignment` is explanatory completeness/alignment, not underwriting, loss, pricing, or claim probability.
