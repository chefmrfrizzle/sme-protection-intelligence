import { describe, expect, it } from "vitest";
import { runCoverageChallenge } from "@/domain/reconciliation/challenge";
import { baselinePolicy } from "@/domain/reconciliation/engine";

const candidate = {
  id: "finding_new_location",
  state: "POTENTIAL_GAP" as const,
  evidenceIds: ["ev_lease_b", "ev_property_schedule"],
  ruleTrace: {
    ruleId: "PROPERTY_NEW_LOCATION_001",
    ruleVersion: "1.2.0",
    inputs: { scheduledLocationFound: false },
    threshold: { requireExactScheduledLocationMatch: true },
    passed: true,
    result: "POTENTIAL_GAP" as const,
    evaluatedAt: "2026-07-01T02:00:00.000Z",
  },
};

describe("Coverage Challenge Pass", () => {
  it("dismisses a candidate when later protection evidence resolves it", () => {
    const result = runCoverageChallenge(candidate, {
      policy: { ...baselinePolicy, endorsementIncludesLocationB: true },
      completedAt: "2026-07-01T02:00:00.000Z",
    });
    expect(result.dismissed).toBe(true);
    expect(result.finalState).toBe("ALIGNED");
    expect(result.challenge.outcome).toBe("RESOLVED_DISMISSED");
  });

  it("preserves contradictory evidence instead of selecting a winner", () => {
    const result = runCoverageChallenge(candidate, {
      policy: baselinePolicy,
      hasMaterialConflict: true,
      completedAt: "2026-07-01T02:00:00.000Z",
    });
    expect(result.finalState).toBe("EVIDENCE_CONFLICT");
    expect(result.challenge.outcome).toBe("CONTRADICTORY_EVIDENCE_FOUND");
  });
});
