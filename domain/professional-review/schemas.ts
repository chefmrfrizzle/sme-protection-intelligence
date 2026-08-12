import { z } from "zod";
import {
  ProtectionDomainSchema,
  ProtectionStateSchema,
  ReviewStatusSchema,
} from "../schemas";

export const ReviewPriorityBandSchema = z.enum([
  "URGENT",
  "HIGH",
  "STANDARD",
  "MONITOR",
]);

export const EvidenceReadinessSchema = z.enum([
  "COMPLETE",
  "INCOMPLETE",
  "CONFLICTING",
  "STALE",
]);

export const ContextItemStatusSchema = z.enum([
  "EVIDENCED",
  "CHANGED",
  "MISSING",
  "CONFLICTING",
  "INTERPRETATION_REQUIRED",
]);

export const InsuranceContextItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  value: z.string().min(1),
  status: ContextItemStatusSchema,
  effectiveAt: z.string().datetime().optional(),
  note: z.string().min(1),
  evidenceIds: z.array(z.string()),
});

export const RenewalContextSchema = z.object({
  policyId: z.string().min(1),
  policyVersionId: z.string().min(1),
  recordedPeriodStart: z.string().datetime(),
  recordedPeriodEnd: z.string().datetime(),
  asOf: z.string().datetime(),
  daysRemaining: z.number().int(),
  band: z.enum(["DUE_NOW", "0_30", "31_60", "61_120", "OVER_120"]),
  evidenceFreshness: z.enum(["CURRENT", "STALE", "UNKNOWN"]),
  openFindingIds: z.array(z.string()),
  openEvidenceRequestIds: z.array(z.string()),
  description: z.string().min(1),
});

export const PolicyProgrammeContextSchema = z.object({
  programmeId: z.string().min(1),
  policyId: z.string().min(1),
  policyVersionId: z.string().min(1),
  namedInsured: z.string().min(1),
  insurerReference: z.string().min(1),
  intermediary: z.string().min(1),
  currency: z.literal("SGD"),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  sections: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      evidenceStatus: EvidenceReadinessSchema,
      limitSummary: z.string().min(1),
      evidenceIds: z.array(z.string()),
    }),
  ),
  endorsements: z.array(
    z.object({
      id: z.string().min(1),
      number: z.string().min(1),
      effectiveAt: z.string().datetime(),
      appearsToModify: z.array(z.string()),
      interpretationStatus: z.enum([
        "STRUCTURED",
        "NO_RELEVANT_CHANGE_FOUND",
        "PROFESSIONAL_REVIEW_REQUIRED",
      ]),
      evidenceId: z.string().min(1),
    }),
  ),
});

export const ExposureDifferenceSchema = z.object({
  id: z.string().min(1),
  subjectType: z.enum(["LOCATION", "ASSET", "SUPPLIER", "SYSTEM", "GEOGRAPHY"]),
  subjectLabel: z.string().min(1),
  field: z.string().min(1),
  before: z.string().min(1),
  after: z.string().min(1),
  changedAt: z.string().datetime(),
  materialityRuleId: z.string().min(1),
  materialityRuleVersion: z.string().min(1),
  material: z.boolean(),
  evidenceIds: z.array(z.string()),
});

export const EvidenceRequestSchema = z.object({
  id: z.string().min(1),
  findingId: z.string().min(1),
  title: z.string().min(1),
  requestedItems: z.array(z.string().min(1)).min(1),
  status: z.enum(["DRAFT", "OPEN", "FULFILLED", "CANCELLED"]),
  owner: z.string().min(1),
  requestedFrom: z.string().min(1),
  dueAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  resolutionPurpose: z.string().min(1),
});

export const ProfessionalActivitySchema = z.object({
  id: z.string().min(1),
  caseId: z.string().min(1),
  findingId: z.string().optional(),
  type: z.enum([
    "CASE_CREATED",
    "CHALLENGE_COMPLETED",
    "COMMENT_ADDED",
    "EVIDENCE_REQUEST_CREATED",
    "EVIDENCE_RECEIVED",
    "REVIEW_DECISION_RECORDED",
    "ESCALATED",
    "EXPORT_GENERATED",
  ]),
  actor: z.string().min(1),
  actorRole: z.enum([
    "SYSTEM",
    "SME_USER",
    "BROKER_RISK_ADVISOR",
    "INSURER_REVIEWER",
    "ADMIN",
  ]),
  visibility: z.enum(["SHARED", "PROFESSIONAL_ONLY"]),
  message: z.string().min(1),
  occurredAt: z.string().datetime(),
  evidenceIds: z.array(z.string()),
  previousEventHash: z.string().optional(),
  eventHash: z.string().min(8),
});

export const ReviewQueueItemSchema = z.object({
  id: z.string().min(1),
  caseId: z.string().min(1),
  findingId: z.string().min(1),
  organizationName: z.string().min(1),
  title: z.string().min(1),
  domain: ProtectionDomainSchema,
  protectionState: ProtectionStateSchema,
  reviewStatus: ReviewStatusSchema,
  priority: ReviewPriorityBandSchema,
  priorityReasons: z.array(z.string().min(1)).min(1),
  evidenceReadiness: EvidenceReadinessSchema,
  renewalDaysRemaining: z.number().int(),
  assignedTo: z.string().min(1),
  lastActivityAt: z.string().datetime(),
});

export const ConnectorCapabilitySchema = z.object({
  id: z.string().min(1),
  provider: z.string().min(1),
  name: z.string().min(1),
  direction: z.enum(["INBOUND", "OUTBOUND", "BIDIRECTIONAL"]),
  status: z.enum(["DEMO_REPLAY", "FUTURE", "ACCESS_REQUIRED", "NOT_CONNECTED"]),
  dataClasses: z.array(z.string().min(1)),
  purpose: z.string().min(1),
  safetyBoundary: z.string().min(1),
});

export const ProfessionalReviewWorkspaceSchema = z.object({
  schemaVersion: z.literal("professional-review-workspace/1.0"),
  synthetic: z.literal(true),
  asOf: z.string().datetime(),
  caseId: z.string().min(1),
  organizationId: z.string().min(1),
  organizationName: z.string().min(1),
  queue: z.array(ReviewQueueItemSchema),
  renewal: RenewalContextSchema,
  policy: PolicyProgrammeContextSchema,
  exposureDifferences: z.array(ExposureDifferenceSchema),
  contexts: z.object({
    property: z.array(InsuranceContextItemSchema),
    businessInterruption: z.array(InsuranceContextItemSchema),
    cyber: z.array(InsuranceContextItemSchema),
    supplyChain: z.array(InsuranceContextItemSchema),
    workflow: z.array(InsuranceContextItemSchema),
  }),
  evidenceRequests: z.array(EvidenceRequestSchema),
  activities: z.array(ProfessionalActivitySchema),
  connectors: z.array(ConnectorCapabilitySchema),
  permittedReviewActions: z.array(
    z.enum([
      "START_REVIEW",
      "CONFIRM_FINDING",
      "DISMISS_WITH_EVIDENCE",
      "REQUEST_EVIDENCE",
      "ESCALATE",
      "LEAVE_UNRESOLVED",
    ]),
  ),
});
