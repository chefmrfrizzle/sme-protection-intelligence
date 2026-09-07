import { z } from "zod";
import { DEMO_ORGANIZATION_ID } from "@/demo/company";
import {
  completeEvidenceErasure,
  requestEvidenceErasure,
} from "@/db/evidence-lifecycle";
import { getVerifiedIdentity } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ParamsSchema = z.object({
  artifactId: z.string().min(1).max(200),
  versionId: z.string().uuid(),
});
const BodySchema = z.object({
  reason: z.string().min(8).max(500),
  confirmSyntheticOnly: z.literal(true),
});

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ artifactId: string; versionId: string }> },
) {
  const parsedParams = ParamsSchema.safeParse(await params);
  const parsedBody = BodySchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsedParams.success || !parsedBody.success) {
    return Response.json(
      { error: "Erasure request is invalid" },
      { status: 400 },
    );
  }
  const identity = await getVerifiedIdentity();
  if (!identity)
    return Response.json(
      { error: "Authentication is required" },
      { status: 401 },
    );
  const scope = {
    organizationId: DEMO_ORGANIZATION_ID,
    actorUserId: identity.userId,
  };
  let erasure;
  try {
    erasure = await requestEvidenceErasure(
      scope,
      parsedParams.data.artifactId,
      parsedParams.data.versionId,
    );
  } catch {
    return Response.json(
      { error: "Organization action is not authorized" },
      { status: 403 },
    );
  }
  if (!erasure)
    return Response.json({ error: "Evidence is unavailable" }, { status: 404 });
  if (!erasure.allowed) {
    return Response.json(
      { error: "Evidence cannot be erased", reason: erasure.reason },
      { status: 409 },
    );
  }
  const admin = createAdminClient();
  if (!admin)
    return Response.json(
      { error: "Private evidence storage is unavailable" },
      { status: 503 },
    );
  const { error } = await admin.storage
    .from("evidence-private")
    .remove([erasure.objectKey]);
  if (error) {
    return Response.json(
      { error: "Erasure is recorded as requested but storage removal failed" },
      { status: 503 },
    );
  }
  const result = await completeEvidenceErasure(scope, {
    artifactId: parsedParams.data.artifactId,
    versionId: parsedParams.data.versionId,
    objectKey: erasure.objectKey,
    contentHash: erasure.contentHash,
    reason: parsedBody.data.reason,
  });
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}
