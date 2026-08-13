import { z } from "zod";
import { DEMO_ORGANIZATION_ID } from "@/demo/company";
import { getDownloadableEvidenceVersion } from "@/db/evidence-lifecycle";
import { getVerifiedIdentity } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ParamsSchema = z.object({
  artifactId: z.string().min(1).max(200),
  versionId: z.string().uuid(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ artifactId: string; versionId: string }> },
) {
  const parsed = ParamsSchema.safeParse(await params);
  if (!parsed.success)
    return Response.json(
      { error: "Evidence reference is invalid" },
      { status: 400 },
    );
  const identity = await getVerifiedIdentity();
  if (!identity)
    return Response.json(
      { error: "Authentication is required" },
      { status: 401 },
    );
  let version;
  try {
    version = await getDownloadableEvidenceVersion(
      { organizationId: DEMO_ORGANIZATION_ID, actorUserId: identity.userId },
      parsed.data.artifactId,
      parsed.data.versionId,
    );
  } catch {
    return Response.json(
      { error: "Organization access is denied" },
      { status: 403 },
    );
  }
  if (!version)
    return Response.json({ error: "Evidence is unavailable" }, { status: 404 });
  const admin = createAdminClient();
  if (!admin)
    return Response.json(
      { error: "Private evidence storage is unavailable" },
      { status: 503 },
    );
  const { data, error } = await admin.storage
    .from("evidence-private")
    .createSignedUrl(version.objectKey, 60, { download: version.fileName });
  if (error || !data?.signedUrl)
    return Response.json(
      { error: "Signed evidence download is unavailable" },
      { status: 503 },
    );
  return Response.json(
    {
      url: data.signedUrl,
      expiresInSeconds: 60,
      sha256: version.sha256,
      accessReceipt: version.accessReceipt,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
