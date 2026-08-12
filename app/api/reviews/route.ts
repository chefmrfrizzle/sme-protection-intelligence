import { NextRequest } from "next/server";
import { getRepositories } from "@/db";
import { ReviewCommandSchema } from "@/domain/schemas";

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > 12_000) {
    return Response.json(
      { error: "Review request is too large" },
      { status: 413 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON request" }, { status: 400 });
  }

  const parsed = ReviewCommandSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid review request", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const repositories = getRepositories();
  const scope = { organizationId: parsed.data.organizationId };
  let assessment;
  try {
    assessment = await repositories.assessments.getById(
      scope,
      parsed.data.assessmentId,
      parsed.data.eventIds,
    );
  } catch {
    return Response.json({ error: "Tenant scope is invalid" }, { status: 403 });
  }
  if (!assessment) {
    return Response.json(
      { error: "Assessment does not match the supplied event snapshot" },
      { status: 409 },
    );
  }
  if (
    !assessment.findings.some((finding) => finding.id === parsed.data.findingId)
  ) {
    return Response.json(
      { error: "Finding is not active in this assessment" },
      { status: 409 },
    );
  }

  const receipt = await repositories.reviews.append(
    scope,
    parsed.data,
    new Date().toISOString(),
  );
  return Response.json(receipt, {
    status: 201,
    headers: { "Cache-Control": "no-store" },
  });
}
