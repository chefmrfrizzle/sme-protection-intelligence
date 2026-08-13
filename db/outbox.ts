import { randomUUID } from "node:crypto";
import postgres, { type Sql } from "postgres";
import { z } from "zod";
import { receiptHash } from "@/domain/crypto/receipts";
import { deliverWebhook } from "@/domain/integration/outbox";
import type { TenantScope } from "@/db/contracts";
import { authorizeDatabaseScope } from "@/db/postgres-repositories";

let outboxDatabase: Sql | null = null;

function getDatabase() {
  if (outboxDatabase) return outboxDatabase;
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) throw new Error("Outbox storage is unavailable.");
  outboxDatabase = postgres(connectionString, {
    max: 4,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });
  return outboxDatabase;
}

const SecretConfigSchema = z.record(z.string(), z.string().min(32));
const ClaimedOutboxRowSchema = z.object({
  organization_id: z.string().min(1),
  id: z.string().uuid(),
  idempotency_key: z.string().min(1),
  payload: z.unknown(),
  attempts: z.coerce.number().int().nonnegative(),
  max_attempts: z.coerce.number().int().positive(),
  url: z.string().url(),
  allowed_hosts: z.array(z.string().min(1)),
  secret_reference: z.string().min(1),
});

function loadOutboundSecret(reference: string) {
  try {
    const parsed = SecretConfigSchema.safeParse(
      JSON.parse(process.env.OUTBOUND_WEBHOOK_SECRETS_JSON ?? "{}"),
    );
    return parsed.success ? (parsed.data[reference] ?? null) : null;
  } catch {
    return null;
  }
}

export async function processOneOutboxEvent(now = new Date()) {
  const sql = getDatabase();
  const rows = await sql.begin(async (transaction) => {
    const candidates = await transaction`
      select event.organization_id, event.id::text, event.idempotency_key,
        event.payload, event.attempts, event.max_attempts,
        endpoint.url, endpoint.allowed_hosts, endpoint.secret_reference
      from outbox_events event
      join integration_endpoints endpoint
        on endpoint.organization_id = event.organization_id
        and endpoint.id = event.endpoint_id
        and endpoint.status = 'ACTIVE'
      where event.status in ('PENDING', 'RETRY_SCHEDULED')
        and event.available_at <= ${now.toISOString()}
        and (event.locked_at is null or event.locked_at < ${new Date(now.getTime() - 60_000).toISOString()})
      order by event.available_at, event.created_at
      for update of event skip locked
      limit 1
    `;
    if (!candidates.length) return [];
    await transaction`
      update outbox_events
      set locked_at = ${now.toISOString()}
      where organization_id = ${candidates[0].organization_id}
        and id = ${candidates[0].id}
    `;
    return candidates;
  });
  if (!rows.length) return { processed: false as const };
  const row = ClaimedOutboxRowSchema.parse(rows[0]);
  const secret = loadOutboundSecret(row.secret_reference);
  const attempt = Number(row.attempts) + 1;
  const result = secret
    ? await deliverWebhook({
        endpoint: {
          url: row.url,
          allowedHosts: row.allowed_hosts,
          secret,
        },
        delivery: {
          deliveryId: row.id,
          idempotencyKey: row.idempotency_key,
          payload: row.payload,
          attempt: Number(row.attempts),
          maxAttempts: Number(row.max_attempts),
        },
        now,
      })
    : { state: "DEAD_LETTER" as const, reason: "SECRET_UNAVAILABLE" };
  const attemptReceipt = receiptHash({
    organizationId: row.organization_id,
    outboxEventId: row.id,
    attempt,
    result,
    attemptedAt: now.toISOString(),
  });
  const destinationHost = new URL(row.url).hostname;

  await sql.begin(async (transaction) => {
    await transaction`
      insert into delivery_attempts (
        organization_id, id, outbox_event_id, attempt_number, destination_host,
        outcome, response_status, error_code, receipt_hash, attempted_at
      ) values (
        ${row.organization_id}, ${randomUUID()}, ${row.id}, ${attempt},
        ${destinationHost}, ${result.state},
        ${"status" in result ? result.status : null},
        ${"reason" in result ? (result.reason ?? null) : null}, ${attemptReceipt},
        ${now.toISOString()}
      )
    `;
    if (result.state === "DELIVERED") {
      await transaction`
        update outbox_events set status = 'DELIVERED', attempts = ${attempt},
          delivered_at = ${now.toISOString()}, locked_at = null
        where organization_id = ${row.organization_id} and id = ${row.id}
      `;
    } else if (result.state === "RETRY_SCHEDULED") {
      await transaction`
        update outbox_events set status = 'RETRY_SCHEDULED', attempts = ${attempt},
          available_at = ${result.availableAt}, locked_at = null
        where organization_id = ${row.organization_id} and id = ${row.id}
      `;
    } else {
      await transaction`
        update outbox_events set status = 'DEAD_LETTER', attempts = ${attempt},
          locked_at = null
        where organization_id = ${row.organization_id} and id = ${row.id}
      `;
      await transaction`
        insert into dead_letters (
          organization_id, id, outbox_event_id, final_error_code, failed_at
        ) values (
          ${row.organization_id}, ${randomUUID()}, ${row.id},
          ${result.reason}, ${now.toISOString()}
        ) on conflict (organization_id, outbox_event_id) do nothing
      `;
    }
    await transaction`
      insert into audit_events (
        id, organization_id, event_type, actor_subject, summary,
        payload, snapshot_hash, occurred_at
      ) values (
        ${randomUUID()}, ${row.organization_id}, 'OUTBOUND_DELIVERY_ATTEMPTED',
        'outbox-worker', ${`Outbound delivery finished as ${result.state}.`},
        ${transaction.json({ outboxEventId: row.id, attempt, state: result.state })},
        ${attemptReceipt}, ${now.toISOString()}
      )
    `;
  });
  return { processed: true as const, outboxEventId: row.id, result };
}

export async function replayDeadLetter(
  scope: TenantScope,
  outboxEventId: string,
) {
  await authorizeDatabaseScope(scope, "REPLAY_OUTBOUND");
  const sql = getDatabase();
  const replayedAt = new Date().toISOString();
  return sql.begin(async (transaction) => {
    const dead = await transaction`
      select id::text
      from dead_letters
      where organization_id = ${scope.organizationId}
        and outbox_event_id = ${outboxEventId}
      order by failed_at desc
      limit 1
    `;
    if (!dead.length) return null;
    const replayReceipt = receiptHash({
      organizationId: scope.organizationId,
      outboxEventId,
      deadLetterId: dead[0].id,
      replayedBy: scope.actorUserId,
      replayedAt,
    });
    await transaction`
      insert into dead_letter_replays (
        organization_id, id, dead_letter_id, outbox_event_id,
        replayed_by, replayed_at, replay_receipt_hash
      ) values (
        ${scope.organizationId}, ${randomUUID()}, ${dead[0].id}, ${outboxEventId},
        ${scope.actorUserId!}, ${replayedAt}, ${replayReceipt}
      )
    `;
    await transaction`
      update outbox_events
      set status = 'PENDING', attempts = 0, available_at = ${replayedAt},
        locked_at = null
      where organization_id = ${scope.organizationId}
        and id = ${outboxEventId}
    `;
    return { replayed: true, replayReceipt };
  });
}
