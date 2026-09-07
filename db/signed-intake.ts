import { randomUUID } from "node:crypto";
import postgres, { type Sql } from "postgres";
import type {
  IntakeSignatureHeaders,
  IntegrationCredential,
  SignedEventEnvelope,
} from "@/domain/integration/signed-intake";

let intakeDatabase: Sql | null = null;

function getDatabase() {
  if (intakeDatabase) return intakeDatabase;
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) return null;
  intakeDatabase = postgres(connectionString, {
    max: 4,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });
  return intakeDatabase;
}

export type IntakePersistenceResult =
  | {
      outcome: "ACCEPTED" | "DUPLICATE";
      eventRecordId: string;
      receiptHash: string;
      jobId: string;
    }
  | { outcome: "NONCE_REUSED" }
  | { outcome: "RATE_LIMITED" };

export async function recordSignedIntakeDisposition(input: {
  organizationId: string;
  keyId: string;
  eventType: string;
  summary: string;
  receiptHash: string;
  correlationId?: string;
}) {
  const sql = getDatabase();
  if (!sql) return false;
  try {
    await sql`
      insert into audit_events (
        id, organization_id, event_type, actor_subject, summary,
        payload, snapshot_hash, occurred_at
      ) values (
        ${randomUUID()}, ${input.organizationId}, ${input.eventType}, ${input.keyId},
        ${input.summary}, ${sql.json({ correlationId: input.correlationId })},
        ${input.receiptHash}, now()
      )
    `;
    return true;
  } catch {
    return false;
  }
}

export async function persistSignedIntake(input: {
  envelope: SignedEventEnvelope;
  headers: IntakeSignatureHeaders;
  credential: IntegrationCredential;
  receiptHash: string;
}): Promise<IntakePersistenceResult | null> {
  const sql = getDatabase();
  if (!sql) return null;
  const { envelope, headers, credential, receiptHash } = input;

  try {
    return await sql.begin(async (transaction) => {
      const duplicate = await transaction`
      select event_record_id::text, receipt_hash, job_id::text
      from event_receipts
      where organization_id = ${envelope.organizationId}
        and idempotency_key = ${envelope.idempotencyKey}
        and outcome = 'ACCEPTED'
      limit 1
    `;
      if (duplicate.length) {
        return {
          outcome: "DUPLICATE" as const,
          eventRecordId: duplicate[0].event_record_id,
          receiptHash: duplicate[0].receipt_hash,
          jobId: duplicate[0].job_id,
        };
      }

      const recent = await transaction`
      select count(*)::integer as count
      from canonical_events
      where organization_id = ${envelope.organizationId}
        and received_at >= now() - interval '1 minute'
    `;
      if (Number(recent[0]?.count ?? 0) >= credential.maxRequestsPerMinute) {
        await transaction`
        insert into audit_events (
          id, organization_id, event_type, actor_subject, summary,
          payload, snapshot_hash, occurred_at
        ) values (
          ${randomUUID()}, ${envelope.organizationId}, 'CANONICAL_EVENT_RATE_LIMITED',
          ${headers.keyId}, 'Signed canonical intake was rate limited.',
          ${transaction.json({ keyId: headers.keyId, correlationId: envelope.correlationId })},
          ${receiptHash}, now()
        )
      `;
        return { outcome: "RATE_LIMITED" as const };
      }

      const nonce = await transaction`
      insert into integration_nonces (
        organization_id, key_id, nonce, expires_at
      ) values (
        ${envelope.organizationId}, ${headers.keyId}, ${headers.nonce},
        ${headers.expiresAt}
      )
      on conflict (organization_id, key_id, nonce) do nothing
      returning nonce
    `;
      if (!nonce.length) return { outcome: "NONCE_REUSED" as const };

      const eventRecordId = randomUUID();
      const jobId = randomUUID();
      await transaction`
      insert into canonical_events (
        organization_id, id, external_event_id, source_system_id,
        schema_version, event_type, occurred_at, observed_at, correlation_id,
        causation_id, idempotency_key, key_id, content_digest, envelope
      ) values (
        ${envelope.organizationId}, ${eventRecordId}, ${envelope.eventId},
        ${envelope.sourceSystem.id}, ${envelope.schemaVersion},
        ${envelope.eventType}, ${envelope.occurredAt}, ${envelope.observedAt},
        ${envelope.correlationId}, ${envelope.causationId},
        ${envelope.idempotencyKey}, ${headers.keyId}, ${headers.contentDigest},
        ${transaction.json(envelope)}
      )
    `;
      await transaction`
      insert into job_ledger (
        organization_id, id, event_record_id, job_type, status,
        attempts, max_attempts, available_at
      ) values (
        ${envelope.organizationId}, ${jobId}, ${eventRecordId},
        'RECONCILE_CANONICAL_EVENT', 'PENDING', 0, 5, now()
      )
    `;
      await transaction`
      insert into event_receipts (
        organization_id, id, event_record_id, job_id, idempotency_key,
        outcome, receipt_hash, received_at
      ) values (
        ${envelope.organizationId}, ${randomUUID()}, ${eventRecordId}, ${jobId},
        ${envelope.idempotencyKey}, 'ACCEPTED', ${receiptHash}, now()
      )
    `;
      await transaction`
      insert into audit_events (
        id, organization_id, event_type, actor_subject, summary,
        payload, snapshot_hash, occurred_at
      ) values (
        ${randomUUID()}, ${envelope.organizationId}, 'CANONICAL_EVENT_ACCEPTED',
        ${headers.keyId}, 'Signed canonical event accepted and queued.',
        ${transaction.json({ eventRecordId, jobId, correlationId: envelope.correlationId })},
        ${receiptHash}, now()
      )
    `;
      return {
        outcome: "ACCEPTED" as const,
        eventRecordId,
        receiptHash,
        jobId,
      };
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      const duplicate = await sql`
        select event_record_id::text, receipt_hash, job_id::text
        from event_receipts
        where organization_id = ${envelope.organizationId}
          and idempotency_key = ${envelope.idempotencyKey}
          and outcome = 'ACCEPTED'
        limit 1
      `;
      if (duplicate.length) {
        return {
          outcome: "DUPLICATE",
          eventRecordId: duplicate[0].event_record_id,
          receiptHash: duplicate[0].receipt_hash,
          jobId: duplicate[0].job_id,
        };
      }
    }
    throw error;
  }
}
