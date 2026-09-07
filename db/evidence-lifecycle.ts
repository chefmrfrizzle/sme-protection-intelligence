import { randomUUID } from "node:crypto";
import postgres, { type Sql } from "postgres";
import { receiptHash } from "@/domain/crypto/receipts";
import type { EvidenceValidation } from "@/domain/evidence/lifecycle";
import { erasureDecision } from "@/domain/evidence/lifecycle";
import type { TenantScope } from "@/db/contracts";
import { authorizeDatabaseScope } from "@/db/postgres-repositories";

let evidenceDatabase: Sql | null = null;

function getDatabase() {
  if (evidenceDatabase) return evidenceDatabase;
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString)
    throw new Error("Durable evidence storage is unavailable.");
  evidenceDatabase = postgres(connectionString, {
    max: 4,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });
  return evidenceDatabase;
}

export type EvidenceUploadRecord = {
  artifactId: string;
  versionId: string;
  title: string;
  fileName: string;
  documentType: string;
  versionLabel: string;
  objectKey: string;
  declaredMime: string;
  sourceIdentity: string;
  retentionUntil?: string;
  legalHold: boolean;
  scannerId: string;
  validation: EvidenceValidation;
};

export async function persistEvidenceUpload(
  scope: TenantScope,
  record: EvidenceUploadRecord,
) {
  await authorizeDatabaseScope(scope, "VIEW_WORKSPACE");
  const sql = getDatabase();
  const occurredAt = new Date().toISOString();
  const uploadReceipt = receiptHash({ scope, record, occurredAt });
  await sql.begin(async (transaction) => {
    await transaction`
      insert into evidence_artifacts (
        id, organization_id, document_type, file_name, document_version,
        object_key, source_hash, metadata, classification, synthetic, source_identity
      ) values (
        ${record.artifactId}, ${scope.organizationId}, ${record.documentType},
        ${record.fileName}, ${record.versionLabel}, ${record.objectKey},
        ${record.validation.sha256}, ${transaction.json({ title: record.title })},
        'SYNTHETIC_DEMO', true, ${record.sourceIdentity}
      )
      on conflict (organization_id, id) do nothing
    `;
    await transaction`
      insert into evidence_versions (
        organization_id, artifact_id, id, version_label, object_key,
        declared_mime, detected_mime, size_bytes, sha256, lifecycle_state,
        scanner_id, source_identity, retention_until, legal_hold, created_by
      ) values (
        ${scope.organizationId}, ${record.artifactId}, ${record.versionId},
        ${record.versionLabel}, ${record.objectKey}, ${record.declaredMime},
        ${record.validation.detectedMime}, ${record.validation.sizeBytes},
        ${record.validation.sha256}, ${record.validation.state}, ${record.scannerId},
        ${record.sourceIdentity}, ${record.retentionUntil ?? null},
        ${record.legalHold}, ${scope.actorUserId!}
      )
    `;
    await transaction`
      insert into evidence_lifecycle_events (
        organization_id, id, artifact_id, evidence_version_id, state,
        reason_code, actor_subject, receipt_hash, occurred_at
      ) values (
        ${scope.organizationId}, ${randomUUID()}, ${record.artifactId},
        ${record.versionId}, 'QUARANTINED', null, ${scope.actorUserId!},
        ${uploadReceipt}, ${occurredAt}
      )
    `;
    if (record.validation.state !== "QUARANTINED") {
      await transaction`
        insert into evidence_lifecycle_events (
          organization_id, id, artifact_id, evidence_version_id, state,
          reason_code, actor_subject, receipt_hash, occurred_at
        ) values (
          ${scope.organizationId}, ${randomUUID()}, ${record.artifactId},
          ${record.versionId}, ${record.validation.state},
          ${record.validation.reason ?? null}, ${scope.actorUserId!},
          ${uploadReceipt}, ${occurredAt}
        )
      `;
    }
    await transaction`
      insert into evidence_access_events (
        organization_id, id, artifact_id, evidence_version_id, action,
        actor_subject, purpose, receipt_hash, occurred_at
      ) values (
        ${scope.organizationId}, ${randomUUID()}, ${record.artifactId},
        ${record.versionId}, 'UPLOAD', ${scope.actorUserId!},
        'Synthetic demonstration evidence intake', ${uploadReceipt}, ${occurredAt}
      )
    `;
    await transaction`
      insert into audit_events (
        id, organization_id, event_type, actor_subject, summary,
        payload, snapshot_hash, occurred_at
      ) values (
        ${randomUUID()}, ${scope.organizationId}, 'EVIDENCE_VERSION_RECORDED',
        ${scope.actorUserId!}, 'Synthetic evidence version recorded.',
        ${transaction.json({ artifactId: record.artifactId, versionId: record.versionId, state: record.validation.state })},
        ${uploadReceipt}, ${occurredAt}
      )
    `;
  });
  return { ...record, receiptHash: uploadReceipt };
}

export async function getDownloadableEvidenceVersion(
  scope: TenantScope,
  artifactId: string,
  versionId: string,
) {
  await authorizeDatabaseScope(scope, "VIEW_WORKSPACE");
  const sql = getDatabase();
  const rows = await sql`
    select version.object_key, artifact.file_name, version.sha256
    from evidence_versions version
    join evidence_artifacts artifact
      on artifact.organization_id = version.organization_id
      and artifact.id = version.artifact_id
    where version.organization_id = ${scope.organizationId}
      and version.artifact_id = ${artifactId}
      and version.id = ${versionId}
      and version.lifecycle_state = 'APPROVED_FOR_PROCESSING'
      and not exists (
        select 1 from erasure_tombstones tombstone
        where tombstone.organization_id = version.organization_id
          and tombstone.artifact_id = version.artifact_id
          and tombstone.evidence_version_id = version.id
      )
    limit 1
  `;
  if (!rows.length) return null;
  const occurredAt = new Date().toISOString();
  const accessReceipt = receiptHash({
    organizationId: scope.organizationId,
    artifactId,
    versionId,
    actorUserId: scope.actorUserId,
    occurredAt,
  });
  await sql`
    insert into evidence_access_events (
      organization_id, id, artifact_id, evidence_version_id, action,
      actor_subject, purpose, receipt_hash, occurred_at
    ) values (
      ${scope.organizationId}, ${randomUUID()}, ${artifactId}, ${versionId},
      'SIGNED_DOWNLOAD', ${scope.actorUserId!}, 'Authorized evidence review',
      ${accessReceipt}, ${occurredAt}
    )
  `;
  return {
    objectKey: rows[0].object_key as string,
    fileName: rows[0].file_name as string,
    sha256: rows[0].sha256 as string,
    accessReceipt,
  };
}

export async function requestEvidenceErasure(
  scope: TenantScope,
  artifactId: string,
  versionId: string,
) {
  await authorizeDatabaseScope(scope, "ERASE_EVIDENCE");
  const sql = getDatabase();
  const rows = await sql`
    select object_key, sha256, legal_hold, retention_until
    from evidence_versions version
    where organization_id = ${scope.organizationId}
      and artifact_id = ${artifactId}
      and id = ${versionId}
      and not exists (
        select 1 from erasure_tombstones tombstone
        where tombstone.organization_id = version.organization_id
          and tombstone.artifact_id = version.artifact_id
          and tombstone.evidence_version_id = version.id
      )
    limit 1
  `;
  if (!rows.length) return null;
  const decision = erasureDecision({
    legalHold: Boolean(rows[0].legal_hold),
    retentionUntil: rows[0].retention_until
      ? new Date(rows[0].retention_until).toISOString()
      : undefined,
    now: new Date(),
  });
  if (!decision.allowed) return decision;
  const occurredAt = new Date().toISOString();
  const requestReceipt = receiptHash({
    organizationId: scope.organizationId,
    artifactId,
    versionId,
    actorUserId: scope.actorUserId,
    occurredAt,
    action: "ERASURE_REQUESTED",
  });
  await sql.begin(async (transaction) => {
    await transaction`
      insert into evidence_lifecycle_events (
        organization_id, id, artifact_id, evidence_version_id, state,
        actor_subject, receipt_hash, occurred_at
      ) values (
        ${scope.organizationId}, ${randomUUID()}, ${artifactId}, ${versionId},
        'ERASURE_REQUESTED', ${scope.actorUserId!}, ${requestReceipt}, ${occurredAt}
      )
    `;
    await transaction`
      insert into evidence_access_events (
        organization_id, id, artifact_id, evidence_version_id, action,
        actor_subject, purpose, receipt_hash, occurred_at
      ) values (
        ${scope.organizationId}, ${randomUUID()}, ${artifactId}, ${versionId},
        'ERASURE_REQUEST', ${scope.actorUserId!}, 'Approved synthetic content erasure',
        ${requestReceipt}, ${occurredAt}
      )
    `;
  });
  return {
    allowed: true as const,
    objectKey: rows[0].object_key as string,
    contentHash: rows[0].sha256 as string,
    requestReceipt,
  };
}

export async function completeEvidenceErasure(
  scope: TenantScope,
  input: {
    artifactId: string;
    versionId: string;
    objectKey: string;
    contentHash: string;
    reason: string;
  },
) {
  await authorizeDatabaseScope(scope, "ERASE_EVIDENCE");
  const sql = getDatabase();
  const erasedAt = new Date().toISOString();
  const tombstoneReceipt = receiptHash({
    organizationId: scope.organizationId,
    artifactId: input.artifactId,
    versionId: input.versionId,
    objectKeyHash: receiptHash(input.objectKey),
    contentHash: input.contentHash,
    erasedAt,
  });
  await sql.begin(async (transaction) => {
    await transaction`
      insert into erasure_tombstones (
        organization_id, id, artifact_id, evidence_version_id, object_key_hash,
        content_hash, erased_by, reason, receipt_hash, erased_at
      ) values (
        ${scope.organizationId}, ${randomUUID()}, ${input.artifactId},
        ${input.versionId}, ${receiptHash(input.objectKey)}, ${input.contentHash},
        ${scope.actorUserId!}, ${input.reason}, ${tombstoneReceipt}, ${erasedAt}
      )
    `;
    await transaction`
      insert into evidence_lifecycle_events (
        organization_id, id, artifact_id, evidence_version_id, state,
        reason_code, actor_subject, receipt_hash, occurred_at
      ) values (
        ${scope.organizationId}, ${randomUUID()}, ${input.artifactId},
        ${input.versionId}, 'CONTENT_ERASED', ${input.reason},
        ${scope.actorUserId!}, ${tombstoneReceipt}, ${erasedAt}
      )
    `;
    await transaction`
      insert into audit_events (
        id, organization_id, event_type, actor_subject, summary,
        payload, snapshot_hash, occurred_at
      ) values (
        ${randomUUID()}, ${scope.organizationId}, 'EVIDENCE_CONTENT_ERASED',
        ${scope.actorUserId!}, 'Protected evidence content erased; tombstone retained.',
        ${transaction.json({ artifactId: input.artifactId, versionId: input.versionId })},
        ${tombstoneReceipt}, ${erasedAt}
      )
    `;
  });
  return { erased: true, tombstoneReceipt };
}
