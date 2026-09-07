import { randomUUID } from "node:crypto";
import { z } from "zod";
import { DEMO_ORGANIZATION_ID } from "@/demo/company";
import {
  deterministicSyntheticScanner,
  quarantineAndScan,
} from "@/domain/evidence/lifecycle";
import { EvidenceArtifactSchema } from "@/domain/schemas";
import { persistEvidenceUpload } from "@/db/evidence-lifecycle";
import { authorizeDatabaseScope } from "@/db/postgres-repositories";
import { getVerifiedIdentity } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const MetadataSchema = z.object({
  title: z.string().min(1).max(160),
  documentType: EvidenceArtifactSchema.shape.documentType,
  versionLabel: z.string().min(1).max(80),
  sourceIdentity: z.string().min(1).max(160),
  retentionUntil: z.string().datetime().optional(),
  legalHold: z.literal("false"),
  synthetic: z.literal("true"),
});

function safeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 160);
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > 11 * 1024 * 1024) {
    return Response.json(
      { error: "Evidence request is too large" },
      { status: 413 },
    );
  }
  const identity = await getVerifiedIdentity();
  if (!identity)
    return Response.json(
      { error: "Authentication is required" },
      { status: 401 },
    );
  try {
    await authorizeDatabaseScope(
      { organizationId: DEMO_ORGANIZATION_ID, actorUserId: identity.userId },
      "VIEW_WORKSPACE",
    );
  } catch {
    return Response.json(
      { error: "Organization access is denied" },
      { status: 403 },
    );
  }
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json(
      { error: "A synthetic evidence file is required" },
      { status: 400 },
    );
  }
  const metadata = MetadataSchema.safeParse({
    title: form.get("title"),
    documentType: form.get("documentType"),
    versionLabel: form.get("versionLabel"),
    sourceIdentity: form.get("sourceIdentity"),
    retentionUntil: form.get("retentionUntil") || undefined,
    legalHold: form.get("legalHold"),
    synthetic: form.get("synthetic"),
  });
  if (!metadata.success) {
    return Response.json(
      { error: "Evidence metadata is invalid", issues: metadata.error.issues },
      { status: 400 },
    );
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const validation = await quarantineAndScan({
    bytes,
    declaredMime: file.type,
    scanner: deterministicSyntheticScanner,
  });
  const artifactId = `evidence_${randomUUID()}`;
  const versionId = randomUUID();
  const fileName = safeFileName(file.name);
  const objectKey = `${DEMO_ORGANIZATION_ID}/${artifactId}/${versionId}/${fileName}`;
  const admin = createAdminClient();
  if (!admin)
    return Response.json(
      { error: "Private evidence storage is unavailable" },
      { status: 503 },
    );

  if (
    validation.state === "APPROVED_FOR_PROCESSING" ||
    validation.state === "QUARANTINED"
  ) {
    const { error } = await admin.storage
      .from("evidence-private")
      .upload(objectKey, bytes, { contentType: file.type, upsert: false });
    if (error)
      return Response.json(
        { error: "Private evidence upload failed" },
        { status: 503 },
      );
  }

  try {
    const record = await persistEvidenceUpload(
      { organizationId: DEMO_ORGANIZATION_ID, actorUserId: identity.userId },
      {
        artifactId,
        versionId,
        title: metadata.data.title,
        fileName,
        documentType: metadata.data.documentType,
        versionLabel: metadata.data.versionLabel,
        objectKey,
        declaredMime: file.type,
        sourceIdentity: metadata.data.sourceIdentity,
        retentionUntil: metadata.data.retentionUntil,
        legalHold: false,
        scannerId: deterministicSyntheticScanner.id,
        validation,
      },
    );
    return Response.json(
      {
        accepted: validation.state === "APPROVED_FOR_PROCESSING",
        synthetic: true,
        record,
      },
      { status: 201 },
    );
  } catch {
    if (
      validation.state === "APPROVED_FOR_PROCESSING" ||
      validation.state === "QUARANTINED"
    ) {
      await admin.storage.from("evidence-private").remove([objectKey]);
    }
    return Response.json(
      { error: "Evidence metadata persistence failed closed" },
      { status: 503 },
    );
  }
}
