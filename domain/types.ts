import type { z } from "zod";
import type {
  AgentRunSchema,
  AssessmentSchema,
  AuditEventSchema,
  CanonicalChangeEventSchema,
  ChallengeResultSchema,
  DomainAssessmentSchema,
  EvidenceArtifactSchema,
  FindingSchema,
  ProtectionDomainSchema,
  ProtectionReviewCaseSchema,
  ProtectionStateSchema,
  ReviewCommandSchema,
  ReviewActivityCommandSchema,
  ReviewActivityReceiptSchema,
  ReviewReceiptSchema,
  ReviewStatusSchema,
  RuleTraceSchema,
  SourceReferenceSchema,
  TemporalFactSchema,
} from "./schemas";

export type ProtectionState = z.infer<typeof ProtectionStateSchema>;
export type ProtectionDomain = z.infer<typeof ProtectionDomainSchema>;
export type ReviewStatus = z.infer<typeof ReviewStatusSchema>;
export type SourceReference = z.infer<typeof SourceReferenceSchema>;
export type TemporalFact = z.infer<typeof TemporalFactSchema>;
export type EvidenceArtifact = z.infer<typeof EvidenceArtifactSchema>;
export type CanonicalChangeEvent = z.infer<typeof CanonicalChangeEventSchema>;
export type RuleTrace = z.infer<typeof RuleTraceSchema>;
export type ChallengeResult = z.infer<typeof ChallengeResultSchema>;
export type Finding = z.infer<typeof FindingSchema>;
export type DomainAssessment = z.infer<typeof DomainAssessmentSchema>;
export type AuditEvent = z.infer<typeof AuditEventSchema>;
export type Assessment = z.infer<typeof AssessmentSchema>;
export type AgentRun = z.infer<typeof AgentRunSchema>;
export type ProtectionReviewCase = z.infer<typeof ProtectionReviewCaseSchema>;
export type ReviewCommand = z.infer<typeof ReviewCommandSchema>;
export type ReviewReceipt = z.infer<typeof ReviewReceiptSchema>;
export type ReviewActivityCommand = z.infer<typeof ReviewActivityCommandSchema>;
export type ReviewActivityReceipt = z.infer<typeof ReviewActivityReceiptSchema>;

export type ExposureSnapshot = {
  locationIds: string[];
  assetValueSgd: number;
  supplierConcentrationPct: number;
  cloudDependencyCount: number;
  territories: string[];
  headcount: number;
};

export type PolicySnapshot = {
  scheduledLocationIds: string[];
  declaredAssetValueSgd: number;
  cyberDependenciesEvidenced: number;
  territoriesExplicitlyConfirmed: string[];
  territorialWordingPresent: boolean;
  policyCurrent: boolean;
  endorsementIncludesLocationB: boolean;
};

export type RuleDefinition = {
  id: string;
  version: string;
  domain: ProtectionDomain;
  description: string;
  thresholds: Record<string, string | number | boolean>;
};
