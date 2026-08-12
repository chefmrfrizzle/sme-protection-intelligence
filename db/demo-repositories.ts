import { evidenceArtifacts } from "@/demo/evidence";
import { DEMO_ORGANIZATION_ID } from "@/demo/company";
import { buildAssessment } from "@/domain/reconciliation/engine";
import { demoHash } from "@/domain/reconciliation/hash";
import { ReviewReceiptSchema } from "@/domain/schemas";
import type { ReviewReceipt } from "@/domain/types";
import type {
  PersistenceResult,
  ProtectionRepositories,
  TenantScope,
} from "./contracts";

function assertDemoTenant(scope: TenantScope) {
  if (scope.organizationId !== DEMO_ORGANIZATION_ID) {
    throw new Error("Tenant scope does not match the synthetic demo tenant.");
  }
}

function replayResult<T>(value: T): PersistenceResult<T> {
  return { value, persisted: false, storageMode: "DEMO_REPLAY" };
}

export const demoRepositories: ProtectionRepositories = {
  assessments: {
    async getById(scope, assessmentId, eventIds) {
      assertDemoTenant(scope);
      const assessment = buildAssessment(eventIds);
      return assessment.id === assessmentId ? assessment : null;
    },
    async append(scope, assessment) {
      assertDemoTenant(scope);
      return replayResult(assessment);
    },
  },
  evidence: {
    async listByIds(scope, evidenceIds) {
      assertDemoTenant(scope);
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
      assertDemoTenant(scope);
      const review = {
        id: `review_${demoHash({ command, occurredAt }).slice(-16)}`,
        organizationId: scope.organizationId,
        assessmentId: command.assessmentId,
        findingId: command.findingId,
        status: command.status,
        reviewer: command.reviewer.displayName,
        role: command.reviewer.role,
        rationale: command.rationale,
        occurredAt,
        idempotencyKey: command.idempotencyKey,
      };
      const auditEvent = {
        id: `audit_${review.id}`,
        organizationId: scope.organizationId,
        eventType: "HUMAN_REVIEW_PERFORMED",
        actor: `${review.reviewer} (${review.role})`,
        occurredAt,
        summary: `${review.findingId} moved to ${review.status}.`,
        snapshotHash: demoHash(review),
      };
      return ReviewReceiptSchema.parse({
        accepted: true,
        persisted: false,
        storageMode: "DEMO_REPLAY",
        review,
        auditEvent,
        receiptHash: demoHash({ review, auditEvent }),
      });
    },
  },
  audit: {
    async append(scope, event) {
      assertDemoTenant(scope);
      return replayResult(event);
    },
  },
  reports: {
    async append(scope, report) {
      assertDemoTenant(scope);
      return replayResult(report);
    },
  },
};
