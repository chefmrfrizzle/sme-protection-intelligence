import { NextRequest } from "next/server";
import { getRepositories } from "@/db";
import { ReviewCommandSchema } from "@/domain/schemas";
import { getVerifiedIdentity } from "@/lib/supabase/server";
import { DEMO_ORGANIZATION_ID } from "@/demo/company";

export async function GET(request: NextRequest) {
  const assessmentId = request.nextUrl.searchParams.get("assessmentId") ?? "";
  const eventIds = (request.nextUrl.searchParams.get("events") ?? "")
    .split(",")
    .filter(Boolean);
  if (!/^assessment_v\d+$/.test(assessmentId) || eventIds.length > 25) {
    return Response.json({ error: "Invalid review query" }, { status: 400 });
  }
  const identity = await getVerifiedIdentity();
  if (!identity) {
    return Response.json(
      { persisted: false, storageMode: "DEMO_REPLAY", reviews: [] },
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
  const reviews = await repositories.reviews.list(scope, assessmentId);
  return Response.json(
    { persisted: true, storageMode: "POSTGRES", reviews },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

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

  const identity = await getVerifiedIdentity();
  const scope = {
    organizationId: DEMO_ORGANIZATION_ID,
    actorUserId: identity?.userId,
  };
  const repositories = getRepositories(scope);
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
  if (parsed.data.organizationId !== assessment.organizationId) {
    return Response.json(
      { error: "Organization scope is invalid" },
      { status: 403 },
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

  if (identity) await repositories.assessments.append(scope, assessment);
  const trustedCommand = identity
    ? {
        ...parsed.data,
        reviewer: {
          displayName: identity.email ?? "Signed-in reviewer",
          role: "SME_USER" as const,
        },
      }
    : parsed.data;
  const receipt = await repositories.reviews.append(
    scope,
    trustedCommand,
    new Date().toISOString(),
  );
  return Response.json(receipt, {
    status: 201,
    headers: { "Cache-Control": "no-store" },
  });
}
