import { describe, expect, it } from "vitest";
import {
  assessmentAbstentionState,
  minimumEvidenceRequest,
} from "@/domain/evidence/completeness";
import { buildAssessment } from "@/domain/reconciliation/engine";

describe("evidence completeness and minimum requests", () => {
  it("prioritizes conflict over missing evidence", () => {
    expect(
      assessmentAbstentionState([
        { label: "schedule", status: "missing" },
        { label: "values", status: "conflicting" },
      ]),
    ).toBe("EVIDENCE_CONFLICT");
  });

  it("abstains when evidence is stale", () => {
    expect(
      assessmentAbstentionState([{ label: "policy", status: "stale" }]),
    ).toBe("EVIDENCE_INCOMPLETE");
  });

  it("returns the smallest deduplicated resolution set", () => {
    const finding = buildAssessment(["event_cloud_dependency"]).findings[0];
    expect(minimumEvidenceRequest(finding)).toHaveLength(2);
    expect(minimumEvidenceRequest(finding)[0]).toContain(
      "technology dependency",
    );
  });
});
