import { describe, expect, it } from "vitest";
import { TemporalFactLedger, type FactCandidate } from "@/domain/facts/ledger";

const source = {
  evidenceArtifactId: "evidence-assets",
  evidenceVersionId: "evidence-assets-v1",
  evidenceSha256: `sha256-${"a".repeat(64)}`,
  page: 1,
  section: "Asset summary",
  startOffset: 10,
  endOffset: 30,
  excerpt: "Observed asset value",
};

function candidate(overrides: Partial<FactCandidate> = {}): FactCandidate {
  return {
    id: "candidate-1",
    organizationId: "org-a",
    subjectId: "company-a",
    property: "assetValueSgd",
    value: 850_000,
    unit: "SGD",
    validFrom: "2026-07-01T00:00:00.000Z",
    observedAt: "2026-07-03T00:00:00.000Z",
    importedAt: "2026-07-03T00:01:00.000Z",
    origin: "AGENT",
    originRunId: "run-1",
    sources: [source],
    ...overrides,
  };
}

describe("append-only temporal fact ledger", () => {
  it("keeps an agent result as a candidate until an allowed authority promotes it", () => {
    const ledger = new TemporalFactLedger();
    ledger.appendCandidate(candidate());
    expect(ledger.facts()).toHaveLength(0);
    const fact = ledger.materialize({
      candidateId: "candidate-1",
      materializedAt: "2026-07-03T00:02:00.000Z",
      materializedBy: "validator/rules-v1",
      authority: "DETERMINISTIC_VALIDATOR",
    });
    expect(fact.receiptHash).toMatch(/^sha256-/);
    expect(fact.sources[0]?.startOffset).toBe(10);
  });

  it("excludes future-effective facts and deduplicates imports", () => {
    const ledger = new TemporalFactLedger();
    ledger.appendCandidate(candidate());
    ledger.appendCandidate(candidate({ id: "duplicate-candidate" }));
    ledger.materialize({
      candidateId: "candidate-1",
      materializedAt: "2026-07-03T00:02:00.000Z",
      materializedBy: "human-1",
      authority: "HUMAN",
    });
    expect(
      ledger.snapshot({
        organizationId: "org-a",
        asOf: "2026-06-30T23:59:59.000Z",
      }).facts,
    ).toHaveLength(0);
    expect(ledger.facts()).toHaveLength(1);
  });

  it("preserves conflicting values and append-only corrections", () => {
    const ledger = new TemporalFactLedger();
    ledger.appendCandidate(candidate());
    const original = ledger.materialize({
      candidateId: "candidate-1",
      materializedAt: "2026-07-03T00:02:00.000Z",
      materializedBy: "human-1",
      authority: "HUMAN",
    });
    ledger.appendCandidate(
      candidate({
        id: "candidate-conflict",
        value: 900_000,
        originRunId: "run-2",
        sources: [{ ...source, evidenceVersionId: "evidence-assets-v2" }],
      }),
    );
    ledger.materialize({
      candidateId: "candidate-conflict",
      materializedAt: "2026-07-04T00:02:00.000Z",
      materializedBy: "human-2",
      authority: "HUMAN",
    });
    expect(
      ledger.snapshot({
        organizationId: "org-a",
        asOf: "2026-07-05T00:00:00.000Z",
      }).conflicts[0],
    ).toMatchObject({ state: "EVIDENCE_CONFLICT" });

    ledger.appendCandidate(
      candidate({
        id: "candidate-correction",
        value: 875_000,
        originRunId: "human-correction-1",
        origin: "HUMAN",
      }),
    );
    ledger.materialize({
      candidateId: "candidate-correction",
      materializedAt: "2026-07-06T00:02:00.000Z",
      materializedBy: "human-3",
      authority: "HUMAN",
      supersedesFactId: original.id,
    });
    expect(ledger.facts()).toHaveLength(3);
    expect(ledger.facts()[0]?.id).toBe(original.id);
  });

  it("never crosses tenant scope when resolving supersession", () => {
    const ledger = new TemporalFactLedger();
    ledger.appendCandidate(candidate());
    const original = ledger.materialize({
      candidateId: "candidate-1",
      materializedAt: "2026-07-03T00:02:00.000Z",
      materializedBy: "human-1",
      authority: "HUMAN",
    });
    ledger.appendCandidate(
      candidate({
        id: "candidate-other-tenant",
        organizationId: "org-b",
        originRunId: "run-org-b",
      }),
    );
    expect(() =>
      ledger.materialize({
        candidateId: "candidate-other-tenant",
        materializedAt: "2026-07-03T00:03:00.000Z",
        materializedBy: "human-2",
        authority: "HUMAN",
        supersedesFactId: original.id,
      }),
    ).toThrow(/tenant/i);
  });
});
