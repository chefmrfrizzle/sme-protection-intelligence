import { describe, expect, it } from "vitest";
import type { MaterializedFact } from "@/domain/facts/ledger";
import { snapshotsFromTemporalFacts } from "@/domain/facts/snapshot-adapter";
import { buildAssessmentFromSnapshots } from "@/domain/reconciliation/engine";

const source = {
  evidenceArtifactId: "artifact-1",
  evidenceVersionId: "version-1",
  evidenceSha256: `sha256-${"b".repeat(64)}`,
  section: "Validated synthetic fixture",
  startOffset: 0,
  endOffset: 10,
  excerpt: "Synthetic fact",
};

function fact(
  subjectId: string,
  property: string,
  value: MaterializedFact["value"],
): MaterializedFact {
  return {
    id: `${subjectId}-${property}`,
    organizationId: "org_pacific_components",
    subjectId,
    property,
    value,
    validFrom: "2026-07-01T00:00:00.000Z",
    observedAt: "2026-07-01T02:00:00.000Z",
    importedAt: "2026-07-01T02:01:00.000Z",
    origin: "PARSER",
    originRunId: "validated-fixture-run",
    sources: [source],
    materializedAt: "2026-07-01T02:02:00.000Z",
    materializedBy: "deterministic-validator",
    authority: "DETERMINISTIC_VALIDATOR",
    receiptHash: `sha256-${"c".repeat(64)}`,
  };
}

const completeFacts = [
  fact("exposure", "locationIds", ["loc_a", "loc_b"]),
  fact("exposure", "assetValueSgd", 500_000),
  fact("exposure", "supplierConcentrationPct", 22),
  fact("exposure", "cloudDependencyCount", 1),
  fact("exposure", "territories", ["SG"]),
  fact("exposure", "headcount", 20),
  fact("policy", "scheduledLocationIds", ["loc_a"]),
  fact("policy", "declaredAssetValueSgd", 500_000),
  fact("policy", "cyberDependenciesEvidenced", 1),
  fact("policy", "territoriesExplicitlyConfirmed", ["SG"]),
  fact("policy", "territorialWordingPresent", true),
  fact("policy", "policyCurrent", true),
  fact("policy", "endorsementIncludesLocationB", false),
];

describe("fact snapshot reconciliation adapter", () => {
  it("feeds a complete grounded snapshot into deterministic reconciliation", () => {
    const snapshot = snapshotsFromTemporalFacts({
      facts: completeFacts,
      conflicts: [],
      exposureSubjectId: "exposure",
      policySubjectId: "policy",
    });
    expect(snapshot.ok).toBe(true);
    if (!snapshot.ok) return;
    const assessment = buildAssessmentFromSnapshots({
      organizationId: "org_pacific_components",
      eventIds: ["event_new_warehouse"],
      snapshotAt: "2026-07-01T02:00:00.000Z",
      exposure: snapshot.exposure,
      policy: snapshot.policy,
    });
    expect(assessment.findings[0]).toMatchObject({
      id: "finding_new_location",
      state: "POTENTIAL_GAP",
    });
  });

  it("abstains before reconciliation when a material fact is missing", () => {
    const snapshot = snapshotsFromTemporalFacts({
      facts: completeFacts.filter((item) => item.property !== "policyCurrent"),
      conflicts: [],
      exposureSubjectId: "exposure",
      policySubjectId: "policy",
    });
    expect(snapshot).toMatchObject({
      ok: false,
      state: "EVIDENCE_INCOMPLETE",
      missing: ["policy.policyCurrent"],
    });
  });

  it("preserves a material conflict instead of selecting a value", () => {
    const snapshot = snapshotsFromTemporalFacts({
      facts: completeFacts,
      conflicts: [{ subjectId: "exposure", property: "assetValueSgd" }],
      exposureSubjectId: "exposure",
      policySubjectId: "policy",
    });
    expect(snapshot).toMatchObject({ ok: false, state: "EVIDENCE_CONFLICT" });
  });
});
