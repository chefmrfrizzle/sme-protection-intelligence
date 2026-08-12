# Deterministic Algorithms

## 1. Temporal exposure reduction

Events are sorted by `observedAt`, then by stable event ID. An event is applied only when its organization matches the assessment tenant and its effective time is not after the snapshot time. Each update produces a new immutable exposure state. Facts retain `validFrom`, `observedAt`, `importedAt`, source references, and a pointer to any superseded fact.

## 2. Evidence completeness

Each domain has a versioned checklist. A checklist item is `present`, `missing`, `stale`, or `conflicting`. A rule can run only when its required items are present and non-conflicting. Otherwise it returns an abstention state rather than converting absence into a gap.

```text
if required evidence conflicts -> EVIDENCE_CONFLICT
else if required evidence is missing or stale -> EVIDENCE_INCOMPLETE
else evaluate deterministic comparison
```

## 3. Materiality rules

Rules are data in `domain/rules/config.ts`. Each contains a stable ID, semantic version, domain, required evidence, threshold parameters, and final disposition. The evaluator records a trace with exact inputs and threshold.

Examples:

- new active location absent from the current supplied location schedule;
- asset value increase >= 20% or >= S$100,000;
- critical supplier concentration >= 40% and increase >= 15 percentage points;
- critical cloud dependency count increase >= 1;
- material activity in a territory not unambiguously resolved by structured evidence.

## 4. Reconciliation

Structured exposure facts and protection facts are joined by canonical identity (organization, location, asset group, supplier, system, territory) and snapshot validity. Comparisons are exact or normalized deterministic matches. No model calculates the outcome.

## 5. Coverage Challenge Pass

Every candidate `POTENTIAL_GAP` is challenged before display:

1. search current and later policy versions;
2. search endorsements and blanket provisions linked to the affected section;
3. search declarations and schedules for a normalized entity match;
4. inspect material fact conflicts;
5. evaluate temporal precedence.

Outcomes:

```text
supporting protection found -> DISMISSED
material contradiction found -> EVIDENCE_CONFLICT
wording found but semantic interpretation required -> POLICY_INTERPRETATION_REQUIRED
none found and checklist adequate -> finding survives
```

The challenge pass cannot confirm coverage. It can only dismiss a candidate, expose a conflict, require interpretation, or state that no contradictory supplied evidence was found.

## 6. Alignment indicator

The indicator is a deterministic summary of evaluated domain checks. It is not a probability or insurer score.

For each domain:

```text
domain score = 0.60 * alignment component + 0.40 * evidence completeness component
```

Alignment component weights: aligned `1.00`, review recommended `0.65`, interpretation required `0.50`, evidence incomplete `0.40`, potential gap `0.20`, evidence conflict `0.15`, not assessed `0.00`. Completeness is present required checklist items divided by all required items. The overall value is the rounded mean of in-scope domain scores. The UI always pairs it with state counts and methodology text.

## 7. Conflicts

Facts with the same normalized subject/property and overlapping validity intervals conflict when their values differ beyond the configured tolerance and neither supersedes the other. The engine preserves all values and sources. Human resolution appends a correction/review event.

## 8. Versioning and receipts

An assessment version serializes organization, snapshot time, sorted evidence IDs and hashes, applied event IDs, ruleset version, agent metadata, findings, challenges, and review status. A stable JSON canonicalization is hashed with SHA-256. Browser-compatible demo hashing uses Web Crypto; server report receipts use Node crypto.

## 9. Minimum evidence request

For each unresolved state, choose the smallest ordered set of missing checklist items that can change the rule outcome. Already supplied, stale, or lower-priority duplicates are excluded. The demo stores these requests explicitly so explanations cannot invent new document requirements.
