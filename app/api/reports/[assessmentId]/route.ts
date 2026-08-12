import { NextRequest } from "next/server";
import { z } from "zod";
import { ReviewStatusSchema } from "@/domain/schemas";
import { buildAssessment } from "@/domain/reconciliation/engine";
import { createAssessmentPdf, reportContentHash } from "@/domain/report/pdf";

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
  const assessment = {
    ...baseAssessment,
    findings: baseAssessment.findings.map((finding) => ({
      ...finding,
      reviewStatus: reviewMap.get(finding.id) ?? finding.reviewStatus,
    })),
  };
  if (assessment.id !== assessmentId) {
    return Response.json(
      { error: "Assessment version does not match supplied event snapshot" },
      { status: 409 },
    );
  }
  const bytes = await createAssessmentPdf(assessment);
  const contentHash = reportContentHash(bytes);
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="PRODUCT_Protection_Alignment_${assessment.id}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Assessment-Content-Hash": contentHash,
    },
  });
}
