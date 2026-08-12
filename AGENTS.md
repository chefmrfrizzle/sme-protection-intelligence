# [PRODUCT] Engineering Rules

This repository implements a synthetic-data demonstration of an SME protection-intelligence platform. These rules apply to every change.

## Product safety

- Never claim, confirm, deny, bind, price, or guarantee insurance coverage.
- Never provide legal advice or claim-validity decisions.
- Use explicit protection states from `domain/schemas.ts`; do not replace them with an opaque score.
- Preserve uncertainty. Missing evidence must become `EVIDENCE_INCOMPLETE`, `POLICY_INTERPRETATION_REQUIRED`, or `NOT_ASSESSED`, as appropriate.
- AI may extract and explain facts but cannot calculate deterministic rule outcomes or confirm its own findings.
- Explanations may use only facts already present in a validated finding.
- Every material fact and conclusion must retain provenance.

## Architecture

- Keep domain and rule logic out of React components.
- Keep rules in versioned configuration, never prompts or UI code.
- Keep prompts and AI adapters behind typed interfaces in `agents/`.
- Validate external and agent input with Zod at the boundary.
- Use tenant-scoped identifiers in all domain records.
- Audit events are append-only. Corrections create new facts/events and never mutate history.
- Demo mode must remain deterministic and independent of third-party availability.

## Security and public-repository hygiene

- Use synthetic data only. Clearly label it synthetic in UI and documents.
- Never commit `.env*` except `.env.example`, `.vercel`, credentials, tokens, private URLs, source documents containing real customer data, or generated secrets.
- Do not log document contents, tokens, or secret values.
- External connectors are read-only by default and must enter through the canonical event schema.
- Do not introduce a dependency without documenting its purpose in the README.

## Delivery discipline

- For each major phase: plan, implement, test, review, repair, then commit.
- Prefer focused changes over broad refactors.
- Run `npm run quality` before publishing or deploying.
- Do not call a feature complete until reset -> event -> finding -> evidence -> challenge -> abstention -> review -> report works end to end.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
