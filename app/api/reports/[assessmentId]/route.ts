import { NextRequest } from "next/server";
import { z } from "zod";
import { ReviewStatusSchema } from "@/domain/schemas";
import { buildAssessment } from "@/domain/reconciliation/engine";
import { demoHash } from "@/domain/reconciliation/hash";
import { createAssessmentPdf, reportContentHash } from "@/domain/report/pdf";
import { applyTrustedReviewState } from "@/domain/report/trusted-state";
import { CONFIGURATION_VERSION } from "@/domain/rules/config";
import { getRepositories } from "@/db";
import { getVerifiedIdentity } from "@/lib/supabase/server";
import type { ReviewReceipt } from "@/domain/types";

const querySchema = z.object({
  events: z.string().max(500).optional().default(""),
  reviews: z.string().max(1_000).optional().default(""),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assessmentId: string }> },
) {
  const { assessmentId } = await params;
  if (!/^assessment_v\d+$/.test(assessmentId)) {
    return Response.json(
      { error: "Invalid assessment identifier" },
      { status: 400 },
    );
  }
  const parsed = querySchema.safeParse({
    events: request.nextUrl.searchParams.get("events") ?? "",
    reviews: request.nextUrl.searchParams.get("reviews") ?? "",
  });
  if (!parsed.success)
    return Response.json({ error: "Invalid report request" }, { status: 400 });
  const eventIds = parsed.data.events
    ? parsed.data.events.split(",").filter(Boolean)
    : [];
  const baseAssessment = buildAssessment(eventIds);
  const reviewMap = new Map(
    parsed.data.reviews
      .split(",")
      .filter(Boolean)
      .flatMap((entry) => {
        const [findingId, rawStatus] = entry.split(":");
        const status = ReviewStatusSchema.safeParse(rawStatus);
        return findingId && status.success
          ? ([[findingId, status.data]] as const)
          : [];
      }),
  );
  const identity = await getVerifiedIdentity();
  const scope = {
    organizationId: baseAssessment.organizationId,
    actorUserId: identity?.userId,
  };
  const repositories = getRepositories(scope);
  let storedReviews: ReviewReceipt["review"][] = [];
  if (identity) {
    try {
      const trustedAssessment = await repositories.assessments.getById(
        scope,
        assessmentId,
        eventIds,
      );
      if (!trustedAssessment) {
        return Response.json(
          { error: "Assessment snapshot mismatch" },
          { status: 409 },
        );
      }
      storedReviews = await repositories.reviews.list(scope, assessmentId);
    } catch {
      return Response.json(
        { error: "Organization access is denied" },
        { status: 403 },
      );
    }
  }
  const assessment = applyTrustedReviewState(
    baseAssessment,
    reviewMap,
    storedReviews,
    Boolean(identity),
  );
  if (assessment.id !== assessmentId) {
    return Response.json(
      { error: "Assessment version does not match supplied event snapshot" },
      { status: 409 },
    );
  }
  const bytes = await createAssessmentPdf(assessment);
  const contentHash = reportContentHash(bytes);
  if (identity) await repositories.assessments.append(scope, assessment);
  const generatedAt = new Date().toISOString();
  const reviewEventIds = storedReviews.map((review) => review.id).sort();
  const receiptHash = demoHash({
    assessmentId: assessment.id,
    assessmentVersion: assessment.version,
    evidenceSnapshotId: assessment.evidenceSnapshotId,
    rulesetVersion: assessment.rulesetVersion,
    configurationVersion: CONFIGURATION_VERSION,
    reviewEventIds,
    contentHash,
  });
  const reportResult = await repositories.reports.append(scope, {
    id: `report_${assessment.id}_${contentHash.slice(-12)}`,
    organizationId: assessment.organizationId,
    assessmentId: assessment.id,
    generatedAt,
    contentHash,
    evidenceSnapshotId: assessment.evidenceSnapshotId,
    rulesetVersion: assessment.rulesetVersion,
    configurationVersion: CONFIGURATION_VERSION,
    reviewEventIds,
    receiptHash,
  });
  await repositories.audit.append(scope, {
    id: `audit_report_${assessment.id}_${contentHash.slice(-12)}`,
    organizationId: assessment.organizationId,
    eventType: "REPORT_GENERATED",
    actor: identity?.email ?? "Synthetic demo user",
    occurredAt: generatedAt,
    summary: `Generated report for ${assessment.id}.`,
    snapshotHash: receiptHash,
  });
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="PRODUCT_Protection_Alignment_${assessment.id}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Assessment-Content-Hash": contentHash,
      "X-Report-Receipt-Hash": receiptHash,
      "X-Persistence-Mode": reportResult.storageMode,
    },
  });
}
