import type {
  Assessment,
  AuditEvent,
  EvidenceArtifact,
  ReviewCommand,
  ReviewActivityCommand,
  ReviewActivityReceipt,
  ReviewReceipt,
} from "@/domain/types";

export type TenantScope = {
  organizationId: string;
  actorUserId?: string;
};

export type PersistenceResult<T> = {
  value: T;
  persisted: boolean;
  storageMode: "DEMO_REPLAY" | "POSTGRES";
};

export interface AssessmentRepository {
  getById(
    scope: TenantScope,
    assessmentId: string,
    eventIds: string[],
  ): Promise<Assessment | null>;
  append(
    scope: TenantScope,
    assessment: Assessment,
  ): Promise<PersistenceResult<Assessment>>;
}

export interface EvidenceRepository {
  listByIds(
    scope: TenantScope,
    evidenceIds: string[],
  ): Promise<EvidenceArtifact[]>;
}

export interface ReviewRepository {
  append(
    scope: TenantScope,
    command: ReviewCommand,
    occurredAt: string,
  ): Promise<ReviewReceipt>;
  list(
    scope: TenantScope,
    assessmentId: string,
  ): Promise<ReviewReceipt["review"][]>;
}

export interface ReviewActivityRepository {
  append(
    scope: TenantScope,
    command: ReviewActivityCommand,
    occurredAt: string,
  ): Promise<ReviewActivityReceipt>;
  list(
    scope: TenantScope,
    assessmentId: string,
  ): Promise<ReviewActivityReceipt["activity"][]>;
}

export interface AuditRepository {
  append(
    scope: TenantScope,
    event: AuditEvent,
  ): Promise<PersistenceResult<AuditEvent>>;
}

export type ReportRecord = {
  id: string;
  organizationId: string;
  assessmentId: string;
  generatedAt: string;
  contentHash: string;
  evidenceSnapshotId: string;
  rulesetVersion: string;
};

export interface ReportRepository {
  append(
    scope: TenantScope,
    record: ReportRecord,
  ): Promise<PersistenceResult<ReportRecord>>;
}

export type ProtectionRepositories = {
  assessments: AssessmentRepository;
  evidence: EvidenceRepository;
  reviews: ReviewRepository;
  reviewActivity: ReviewActivityRepository;
  audit: AuditRepository;
  reports: ReportRepository;
};
