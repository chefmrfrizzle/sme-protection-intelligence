import type {
  Assessment,
  AuditEvent,
  EvidenceArtifact,
  ReviewCommand,
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
  configurationVersion: string;
  reviewEventIds: string[];
  receiptHash: string;
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
  audit: AuditRepository;
  reports: ReportRepository;
};
