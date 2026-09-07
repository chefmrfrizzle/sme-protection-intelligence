import type { Finding } from "../types";

/** Presentation only: persisted workflow states and reconciliation are unchanged. */
export function reviewStatusLabel(status: Finding["reviewStatus"]): string {
  switch (status) {
    case "OPEN":
      return "OPEN";
    case "REVIEWING":
    case "ESCALATED":
      return "UNDER REVIEW";
    case "MORE_EVIDENCE_REQUESTED":
      return "EVIDENCE REQUESTED";
    case "DISMISSED":
    case "REVIEW_COMPLETED_NO_COVERAGE_DECISION":
      return "RESOLVED";
  }
}

export function reportReviewStatus(
  findings: Pick<Finding, "reviewStatus">[],
): string {
  if (!findings.length) return "Not required";
  const labels = findings.map((finding) =>
    reviewStatusLabel(finding.reviewStatus),
  );
  for (const status of ["EVIDENCE REQUESTED", "UNDER REVIEW", "OPEN"]) {
    if (labels.includes(status)) return status;
  }
  return "RESOLVED";
}
