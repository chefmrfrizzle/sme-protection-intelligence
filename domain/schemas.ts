import { z } from "zod";

export const ProtectionStateSchema = z.enum([
  "ALIGNED",
  "REVIEW_RECOMMENDED",
  "POTENTIAL_GAP",
  "EVIDENCE_INCOMPLETE",
  "EVIDENCE_CONFLICT",
  "POLICY_INTERPRETATION_REQUIRED",
  "NOT_ASSESSED",
]);

export const ProtectionDomainSchema = z.enum([
  "CYBER",
  "PROPERTY_ASSETS",
  "SUPPLY_CHAIN",
  "BUSINESS_CONTINUITY",
]);

export const ReviewStatusSchema = z.enum([
  "OPEN",
  "REVIEWING",
  "CONFIRMED",
  "DISMISSED",
  "MORE_EVIDENCE_REQUESTED",
  "ESCALATED",
]);

export const SourceReferenceSchema = z.object({
  documentId: z.string().min(1),
  fileName: z.string().min(1),
  documentVersion: z.string().min(1),
  page: z.number().int().positive(),
  section: z.string().min(1),
  snippet: z.string().min(1),
  extractionTimestamp: z.string().datetime(),
  extractionMethod: z.enum(["replay_validated", "parser", "human", "api"]),
  modelVersion: z.string().optional(),
  parserVersion: z.string().min(1),
  confidence: z.number().min(0).max(1),
  sourceHash: z.string().min(8),
});

export const TemporalFactSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  subjectId: z.string().min(1),
  property: z.string().min(1),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
  unit: z.string().optional(),
  validFrom: z.string().datetime(),
  validTo: z.string().datetime().optional(),
  observedAt: z.string().datetime(),
  importedAt: z.string().datetime(),
  supersededBy: z.string().optional(),
  sources: z.array(SourceReferenceSchema).min(1),
});

export const EvidenceArtifactSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  title: z.string().min(1),
  fileName: z.string().min(1),
  documentType: z.enum([
    "POLICY_SCHEDULE",
    "PROPERTY_SCHEDULE",
    "CYBER_SUMMARY",
    "POLICY_WORDING",
    "ENDORSEMENT",
    "LEASE",
    "ASSET_REGISTER",
    "SUPPLIER_REGISTER",
    "FINANCIAL_SUMMARY",
    "INFRASTRUCTURE_INVENTORY",
  ]),
  version: z.string().min(1),
  issuedAt: z.string().datetime(),
  validFrom: z.string().datetime(),
  validTo: z.string().datetime().optional(),
  sourceHash: z.string().min(8),
  synthetic: z.literal(true),
  pages: z.array(
    z.object({
      page: z.number().int().positive(),
      heading: z.string().min(1),
      body: z.string().min(1),
    }),
  ),
});

export const CanonicalChangeEventSchema = z.object({
  id: z.string().min(1).optional(),
  organizationId: z.string().min(1),
  eventType: z.enum([
    "LOCATION_ADDED",
    "ASSET_VALUE_CHANGED",
    "SUPPLIER_CONCENTRATION_CHANGED",
    "CLOUD_DEPENDENCY_CHANGED",
    "OPERATING_GEOGRAPHY_ADDED",
    "ENDORSEMENT_RECEIVED",
  ]),
  observedAt: z.string().datetime(),
  source: z.object({
    type: z.enum(["document", "sandbox", "api", "human_attestation"]),
    name: z.string().min(1),
  }),
  payload: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  evidenceReferences: z.array(z.string()).default([]),
  simulated: z.boolean().default(false),
});

export const RuleTraceSchema = z.object({
  ruleId: z.string().min(1),
  ruleVersion: z.string().min(1),
  inputs: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  threshold: z.record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean()]),
  ),
  passed: z.boolean(),
  result: ProtectionStateSchema,
  evaluatedAt: z.string().datetime(),
});

export const ChallengeResultSchema = z.object({
  id: z.string().min(1),
  findingId: z.string().min(1),
  outcome: z.enum([
    "SURVIVES",
    "CONTRADICTORY_EVIDENCE_FOUND",
    "RESOLVED_DISMISSED",
    "INTERPRETATION_REQUIRED",
  ]),
  searchedEvidenceIds: z.array(z.string()),
  summary: z.string().min(1),
  completedAt: z.string().datetime(),
});

export const FindingSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  title: z.string().min(1),
  domain: ProtectionDomainSchema,
  state: ProtectionStateSchema,
  summary: z.string().min(1),
  simpleExplanation: z.string().min(1),
  insuranceExplanation: z.string().min(1),
  whyItMatters: z.string().min(1),
  evidenceIds: z.array(z.string()),
  missingEvidence: z.array(z.string()),
  resolutionSteps: z.array(z.string()),
  ruleTrace: RuleTraceSchema,
  challenge: ChallengeResultSchema,
  createdAt: z.string().datetime(),
  reviewStatus: ReviewStatusSchema,
});

export const DomainAssessmentSchema = z.object({
  domain: ProtectionDomainSchema,
  state: ProtectionStateSchema,
  sentence: z.string().min(1),
  evidencePresent: z.number().int().nonnegative(),
  evidenceRequired: z.number().int().positive(),
  score: z.number().int().min(0).max(100),
  findingIds: z.array(z.string()),
});

export const AuditEventSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  eventType: z.string().min(1),
  actor: z.string().min(1),
  occurredAt: z.string().datetime(),
  summary: z.string().min(1),
  snapshotHash: z.string().min(8),
});

export const AssessmentSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  version: z.number().int().positive(),
  label: z.string().min(1),
  snapshotAt: z.string().datetime(),
  rulesetVersion: z.string().min(1),
  evidenceSnapshotId: z.string().min(1),
  alignment: z.number().int().min(0).max(100),
  appliedEventIds: z.array(z.string()),
  findings: z.array(FindingSchema),
  domains: z.array(DomainAssessmentSchema),
  auditEvents: z.array(AuditEventSchema),
  receiptHash: z.string().min(8),
});

export const AgentRunSchema = z.object({
  runId: z.string().min(1),
  agent: z.string().min(1),
  mode: z.enum(["LIVE", "REPLAY"]),
  promptVersion: z.string().min(1),
  modelVersion: z.string().min(1),
  parserVersion: z.string().min(1),
  inputEvidenceIds: z.array(z.string()),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime(),
  attempts: z.number().int().min(1).max(3),
  sourceGrounded: z.boolean(),
  status: z.enum(["VALIDATED", "ABSTAINED", "FAILED"]),
});

export const ReviewCaseEvidenceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  fileName: z.string().min(1),
  documentType: EvidenceArtifactSchema.shape.documentType,
  version: z.string().min(1),
  sourceHash: z.string().min(8),
  synthetic: z.literal(true),
});

export const ReviewCaseOutboundPreviewSchema = z.object({
  schemaVersion: z.literal("protection-review-case/1.0"),
  caseId: z.string().min(1),
  organizationId: z.string().min(1),
  assessmentId: z.string().min(1),
  assessmentVersion: z.number().int().positive(),
  synthetic: z.literal(true),
  observedChanges: z.array(
    z.object({
      eventId: z.string().min(1),
      eventType: CanonicalChangeEventSchema.shape.eventType,
      observedAt: z.string().datetime(),
      evidenceReferences: z.array(z.string()),
    }),
  ),
  reviewItems: z.array(
    z.object({
      findingId: z.string().min(1),
      domain: ProtectionDomainSchema,
      state: ProtectionStateSchema,
      ruleId: z.string().min(1),
      ruleVersion: z.string().min(1),
      evidenceReferences: z.array(z.string()),
      missingEvidence: z.array(z.string()),
      challengeOutcome: ChallengeResultSchema.shape.outcome,
    }),
  ),
  allowedActions: z.array(
    z.enum(["ROUTE_FOR_REVIEW", "REQUEST_EVIDENCE", "ABSTAIN"]),
  ),
});

export const ProtectionReviewCaseSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  assessmentId: z.string().min(1),
  assessmentVersion: z.number().int().positive(),
  createdAt: z.string().datetime(),
  synthetic: z.literal(true),
  state: z.enum([
    "READY_FOR_PROFESSIONAL_REVIEW",
    "EVIDENCE_REQUIRED",
    "NO_ACTIVE_REVIEW",
  ]),
  events: z.array(CanonicalChangeEventSchema),
  findings: z.array(FindingSchema),
  evidence: z.array(ReviewCaseEvidenceSchema),
  allowedActions: ReviewCaseOutboundPreviewSchema.shape.allowedActions,
  receiptHash: z.string().min(8),
  integration: z.object({
    adapter: z.literal("ZURICH_COMPATIBLE_DEMO"),
    mode: z.literal("MOCK"),
    connectionState: z.literal("NOT_CONNECTED"),
    destination: z.literal("COUNTRY_WORKFLOW_TO_BE_VALIDATED"),
    conformity: z.literal("MAPPING_READY_NOT_CERTIFIED"),
  }),
  outboundPreview: ReviewCaseOutboundPreviewSchema,
});
