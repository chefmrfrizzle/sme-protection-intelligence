import { describe, expect, it } from "vitest";
import { buildAssessment } from "@/domain/reconciliation/engine";
import { applyTrustedReviewState } from "@/domain/report/trusted-state";

describe("trusted report review state", () => {
  const assessment = buildAssessment(["event_new_warehouse"]);
  const forged = new Map([["finding_new_location", "DISMISSED" as const]]);
  const stored = [
    {
      id: "review_trusted",
      organizationId: assessment.organizationId,
      assessmentId: assessment.id,
      findingId: "finding_new_location",
      status: "REVIEWING" as const,
      reviewer: "Approved reviewer",
      role: "BROKER_RISK_ADVISOR" as const,
      occurredAt: "2026-07-01T02:05:00.000Z",
      idempotencyKey: "trusted-review-state",
    },
  ];

  it("ignores browser-supplied review state for authenticated reports", () => {
    const result = applyTrustedReviewState(assessment, forged, stored, true);
    expect(result.findings[0]?.reviewStatus).toBe("REVIEWING");
  });

  it("retains explicit replay state in the signed-out synthetic demo", () => {
    const result = applyTrustedReviewState(assessment, forged, [], false);
    expect(result.findings[0]?.reviewStatus).toBe("DISMISSED");
  });
});
