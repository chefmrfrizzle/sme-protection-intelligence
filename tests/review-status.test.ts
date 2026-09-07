import { describe, expect, it } from "vitest";
import {
  reportReviewStatus,
  reviewStatusLabel,
} from "@/domain/report/review-status";

describe("review workflow presentation", () => {
  it("does not invent an open workflow for an assessment with no findings", () => {
    expect(reportReviewStatus([])).toBe("Not required");
  });
  it("keeps outstanding reviews visible when another review is resolved", () => {
    expect(
      reportReviewStatus([
        { reviewStatus: "DISMISSED" },
        { reviewStatus: "OPEN" },
      ]),
    ).toBe("OPEN");
    expect(
      reportReviewStatus([
        { reviewStatus: "REVIEWING" },
        { reviewStatus: "MORE_EVIDENCE_REQUESTED" },
      ]),
    ).toBe("EVIDENCE REQUESTED");
    expect(
      reportReviewStatus([
        { reviewStatus: "REVIEW_COMPLETED_NO_COVERAGE_DECISION" },
      ]),
    ).toBe("RESOLVED");
    expect(reviewStatusLabel("ESCALATED")).toBe("UNDER REVIEW");
  });
});
