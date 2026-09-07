import type { Assessment, ReviewReceipt, ReviewStatus } from "@/domain/types";

type StoredReview = ReviewReceipt["review"];

export function applyTrustedReviewState(
  assessment: Assessment,
  suppliedReviews: ReadonlyMap<string, ReviewStatus>,
  storedReviews: readonly StoredReview[],
  authenticated: boolean,
) {
  const source = authenticated
    ? new Map(storedReviews.map((review) => [review.findingId, review.status]))
    : suppliedReviews;

  return {
    ...assessment,
    findings: assessment.findings.map((finding) => ({
      ...finding,
      reviewStatus: source.get(finding.id) ?? finding.reviewStatus,
    })),
  };
}
