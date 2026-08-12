import { NextRequest } from "next/server";
import { DEMO_ORGANIZATION_ID } from "@/demo/company";
import { getRepositories } from "@/db";
import { ReviewActivityCommandSchema } from "@/domain/schemas";
import { getVerifiedIdentity } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const assessmentId = request.nextUrl.searchParams.get("assessmentId") ?? "";
  const eventIds = (request.nextUrl.searchParams.get("events") ?? "")
    .split(",")
    .filter(Boolean);
  if (!/^assessment_v\d+$/.test(assessmentId) || eventIds.length > 25) {
    return Response.json({ error: "Invalid activity query" }, { status: 400 });
  }
  const identity = await getVerifiedIdentity();
  if (!identity) {
    return Response.json(
      { persisted: false, storageMode: "DEMO_REPLAY", activities: [] },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  }
  const scope = {
    organizationId: DEMO_ORGANIZATION_ID,
    actorUserId: identity.userId,
  };
  const repositories = getRepositories(scope);
  const assessment = await repositories.assessments.getById(
    scope,
    assessmentId,
    eventIds,
  );
  if (!assessment) {
    return Response.json(
      { error: "Assessment snapshot mismatch" },
      { status: 409 },
    );
  }
  const activities = await repositories.reviewActivity.list(
    scope,
    assessmentId,
  );
  return Response.json(
    { persisted: true, storageMode: "POSTGRES", activities },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > 12_000) {
    return Response.json(
      { error: "Activity request is too large" },
      { status: 413 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON request" }, { status: 400 });
  }

  const parsed = ReviewActivityCommandSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid activity request", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const identity = await getVerifiedIdentity();
  const scope = {
    organizationId: DEMO_ORGANIZATION_ID,
    actorUserId: identity?.userId,
  };
  const repositories = getRepositories(scope);
  const assessment = await repositories.assessments.getById(
    scope,
    parsed.data.assessmentId,
    parsed.data.eventIds,
  );
  if (!assessment) {
    return Response.json(
      { error: "Assessment does not match the supplied event snapshot" },
      { status: 409 },
    );
  }
  if (
    parsed.data.organizationId !== assessment.organizationId ||
    parsed.data.caseId !== `case_${assessment.id}`
  ) {
    return Response.json(
      { error: "Review case scope is invalid" },
      { status: 403 },
    );
  }
  if (
    parsed.data.findingId &&
    !assessment.findings.some((finding) => finding.id === parsed.data.findingId)
  ) {
    return Response.json(
      { error: "Finding is not active in this assessment" },
      { status: 409 },
    );
  }

  if (identity) await repositories.assessments.append(scope, assessment);
  const trustedCommand = identity
    ? {
        ...parsed.data,
        author: {
          displayName: identity.email ?? "Signed-in reviewer",
          role: "SME_USER" as const,
        },
      }
    : parsed.data;
  const receipt = await repositories.reviewActivity.append(
    scope,
    trustedCommand,
    new Date().toISOString(),
  );
  return Response.json(receipt, {
    status: 201,
    headers: { "Cache-Control": "no-store" },
  });
}
