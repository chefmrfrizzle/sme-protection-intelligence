import { randomUUID } from "node:crypto";
import postgres, { type Sql } from "postgres";
import { DEMO_ORGANIZATION_ID, demoCompany } from "@/demo/company";
import { evidenceArtifacts } from "@/demo/evidence";
import { buildAssessment } from "@/domain/reconciliation/engine";
import { demoHash } from "@/domain/reconciliation/hash";
import { ReviewReceiptSchema } from "@/domain/schemas";
import type { ReviewReceipt } from "@/domain/types";
import type {
  PersistenceResult,
  ProtectionRepositories,
  TenantScope,
} from "./contracts";

let database: Sql | null = null;

function getDatabase() {
  if (database) return database;
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) throw new Error("Durable storage is unavailable.");
  database = postgres(connectionString, {
    max: 4,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });
  return database;
}

function durableResult<T>(value: T): PersistenceResult<T> {
  return { value, persisted: true, storageMode: "POSTGRES" };
}

async function ensureMembership(sql: Sql, scope: TenantScope) {
  if (!scope.actorUserId) throw new Error("Authentication is required.");
  if (scope.organizationId !== DEMO_ORGANIZATION_ID) {
    throw new Error("Organization scope is invalid.");
  }

  await sql`
    insert into organizations (id, legal_name)
    values (${DEMO_ORGANIZATION_ID}, ${demoCompany.name})
    on conflict (id) do nothing
  `;
  await sql`
    insert into organization_members (organization_id, user_id, member_role)
    values (${scope.organizationId}, ${scope.actorUserId}, 'SME_USER')
    on conflict (organization_id, user_id) do nothing
  `;
  const membership = await sql`
    select member_role
    from organization_members
    where organization_id = ${scope.organizationId}
      and user_id = ${scope.actorUserId}
    limit 1
  `;
  if (!membership.length) throw new Error("Organization access is denied.");
}

function toIso(value: unknown) {
  return value instanceof Date ? value.toISOString() : String(value);
}

export const postgresRepositories: ProtectionRepositories = {
  assessments: {
    async getById(scope, assessmentId, eventIds) {
      await ensureMembership(getDatabase(), scope);
      const assessment = buildAssessment(eventIds);
      return assessment.id === assessmentId ? assessment : null;
    },
    async append(scope, assessment) {
      const sql = getDatabase();
      await ensureMembership(sql, scope);
      await sql.begin(async (transaction) => {
        await transaction`
          insert into assessments (id, organization_id, current_version)
          values (${assessment.id}, ${scope.organizationId}, ${assessment.version})
          on conflict (id) do update
            set current_version = greatest(assessments.current_version, excluded.current_version)
        `;
        await transaction`
          insert into assessment_versions (
            organization_id, assessment_id, version, snapshot_at,
            evidence_snapshot_id, ruleset_version, snapshot, snapshot_hash
          ) values (
            ${scope.organizationId}, ${assessment.id}, ${assessment.version},
            ${assessment.snapshotAt}, ${assessment.evidenceSnapshotId},
            ${assessment.rulesetVersion}, ${transaction.json(assessment)},
            ${assessment.receiptHash}
          )
          on conflict (organization_id, assessment_id, version) do nothing
        `;
      });
      return durableResult(assessment);
    },
  },
  evidence: {
    async listByIds(scope, evidenceIds) {
      await ensureMembership(getDatabase(), scope);
      const requested = new Set(evidenceIds);
      return evidenceArtifacts.filter(
        (artifact) =>
          artifact.organizationId === scope.organizationId &&
          requested.has(artifact.id),
      );
    },
  },
  reviews: {
    async append(scope, command, occurredAt): Promise<ReviewReceipt> {
      const sql = getDatabase();
      await ensureMembership(sql, scope);
      return sql.begin(async (transaction) => {
        const existing = await transaction`
          select id::text, organization_id, assessment_id, finding_id, status,
            reviewer_subject, reviewer_role, rationale, idempotency_key, occurred_at
          from reviews
          where organization_id = ${scope.organizationId}
            and idempotency_key = ${command.idempotencyKey}
          limit 1
        `;
        const row =
          existing[0] ??
          (
            await transaction`
            insert into reviews (
              organization_id, assessment_id, finding_id, status,
              reviewer_subject, reviewer_role, rationale, idempotency_key,
              occurred_at, receipt_hash
            ) values (
              ${scope.organizationId}, ${command.assessmentId}, ${command.findingId},
              ${command.status}, ${scope.actorUserId!}, ${command.reviewer.role},
              ${command.rationale ?? null}, ${command.idempotencyKey}, ${occurredAt},
              ${demoHash({ command, occurredAt, actor: scope.actorUserId })}
            )
            returning id::text, organization_id, assessment_id, finding_id, status,
              reviewer_subject, reviewer_role, rationale, idempotency_key, occurred_at
          `
          )[0];
        const review = {
          id: row.id,
          organizationId: row.organization_id,
          assessmentId: row.assessment_id,
          findingId: row.finding_id,
          status: row.status,
          reviewer: command.reviewer.displayName,
          role: row.reviewer_role,
          rationale: row.rationale ?? undefined,
          occurredAt: toIso(row.occurred_at),
          idempotencyKey: row.idempotency_key,
        };
        const auditEvent = {
          id: `audit_${review.id}`,
          organizationId: scope.organizationId,
          eventType: "HUMAN_REVIEW_PERFORMED",
          actor: `${review.reviewer} (${review.role})`,
          occurredAt: review.occurredAt,
          summary: `${review.findingId} moved to ${review.status}.`,
          snapshotHash: demoHash(review),
        };
        if (!existing.length) {
          await transaction`
            insert into audit_events (
              id, organization_id, event_type, actor_subject, summary,
              payload, snapshot_hash, occurred_at
            ) values (
              ${randomUUID()}, ${scope.organizationId}, ${auditEvent.eventType},
              ${scope.actorUserId!}, ${auditEvent.summary},
              ${transaction.json({ reviewId: review.id, findingId: review.findingId })},
              ${auditEvent.snapshotHash}, ${auditEvent.occurredAt}
            )
          `;
        }
        return ReviewReceiptSchema.parse({
          accepted: true,
          persisted: true,
          storageMode: "POSTGRES",
          review,
          auditEvent,
          receiptHash: demoHash({ review, auditEvent }),
        });
      });
    },
    async list(scope, assessmentId) {
      const sql = getDatabase();
      await ensureMembership(sql, scope);
      const rows = await sql`
        select distinct on (finding_id)
          id::text, organization_id, assessment_id, finding_id, status,
          reviewer_role, rationale, idempotency_key, occurred_at
        from reviews
        where organization_id = ${scope.organizationId}
          and assessment_id = ${assessmentId}
        order by finding_id, occurred_at desc
      `;
      return rows.map((row) => ({
        id: row.id,
        organizationId: row.organization_id,
        assessmentId: row.assessment_id,
        findingId: row.finding_id,
        status: row.status,
        reviewer: "Signed-in reviewer",
        role: row.reviewer_role,
        rationale: row.rationale ?? undefined,
        occurredAt: toIso(row.occurred_at),
        idempotencyKey: row.idempotency_key,
      }));
    },
  },
  audit: {
    async append(scope, event) {
      const sql = getDatabase();
      await ensureMembership(sql, scope);
      await sql`
        insert into audit_events (
          id, organization_id, event_type, actor_subject, summary,
          payload, snapshot_hash, occurred_at
        ) values (
          ${randomUUID()}, ${scope.organizationId}, ${event.eventType},
          ${scope.actorUserId!}, ${event.summary}, ${sql.json({ sourceId: event.id })},
          ${event.snapshotHash}, ${event.occurredAt}
        )
      `;
      return durableResult(event);
    },
  },
  reports: {
    async append(scope, report) {
      const sql = getDatabase();
      await ensureMembership(sql, scope);
      await sql`
        insert into reports (
          id, organization_id, assessment_id, evidence_snapshot_id,
          ruleset_version, content_hash, generated_at
        ) values (
          ${report.id}, ${scope.organizationId}, ${report.assessmentId},
          ${report.evidenceSnapshotId}, ${report.rulesetVersion},
          ${report.contentHash}, ${report.generatedAt}
        )
        on conflict (id) do nothing
      `;
      return durableResult(report);
    },
  },
};
