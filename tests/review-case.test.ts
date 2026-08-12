import { describe, expect, it } from "vitest";
import { demoEvents } from "@/demo/events";
import { evidenceArtifacts } from "@/demo/evidence";
import { buildProtectionReviewCase } from "@/domain/integration/review-case";
import { buildAssessment } from "@/domain/reconciliation/engine";
import { ProtectionReviewCaseSchema } from "@/domain/schemas";

describe("protection review case", () => {
  it("builds a deterministic, validated, non-connected review artifact", () => {
    const assessment = buildAssessment(["event_new_warehouse"]);
    const first = buildProtectionReviewCase(
      assessment,
      demoEvents,
      evidenceArtifacts,
    );
    const second = buildProtectionReviewCase(
      assessment,
      demoEvents,
      evidenceArtifacts,
    );

    expect(ProtectionReviewCaseSchema.parse(first)).toEqual(first);
    expect(first).toEqual(second);
    expect(first.state).toBe("READY_FOR_PROFESSIONAL_REVIEW");
    expect(first.integration).toMatchObject({
      mode: "MOCK",
      connectionState: "NOT_CONNECTED",
      conformity: "MAPPING_READY_NOT_CERTIFIED",
    });
    expect(first.allowedActions).not.toContain("BIND_POLICY");
    expect(first.findings[0]?.challenge.outcome).toBe("SURVIVES");
    expect(first.evidence.length).toBeGreaterThan(0);
  });

  it("preserves abstention when evidence is incomplete", () => {
    const assessment = buildAssessment(["event_cloud_dependency"]);
    const reviewCase = buildProtectionReviewCase(
      assessment,
      demoEvents,
      evidenceArtifacts,
    );

    expect(reviewCase.state).toBe("EVIDENCE_REQUIRED");
    expect(reviewCase.findings[0]?.state).toBe("EVIDENCE_INCOMPLETE");
    expect(reviewCase.outboundPreview.reviewItems[0]?.state).toBe(
      "EVIDENCE_INCOMPLETE",
    );
  });
});
