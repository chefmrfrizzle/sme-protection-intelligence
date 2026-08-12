import { demoCompany } from "@/demo/company";
import { demoEvents } from "@/demo/events";
import {
  PROFESSIONAL_REVIEW_AS_OF,
  policyProgrammeFixture,
  professionalContextFixture,
} from "@/demo/professional-review";
import { futureConnectorCapabilities } from "@/domain/integration/connectors";
import { demoHash } from "@/domain/reconciliation/hash";
import type { Assessment, Finding } from "@/domain/types";
import { ProfessionalReviewWorkspaceSchema } from "./schemas";
import type {
  EvidenceRequest,
  ExposureDifference,
  ProfessionalActivity,
  ProfessionalReviewWorkspace,
  ReviewQueueItem,
} from "./types";

const DAY_MS = 86_400_000;

const exposureDifferencesByEvent: Record<string, ExposureDifference> = {
  event_new_warehouse: {
    id: "diff_location_count",
    subjectType: "LOCATION",
    subjectLabel: "Operating locations",
    field: "locationCount",
    before: "1 location",
    after: "2 locations",
    changedAt: "2026-07-01T02:00:00.000Z",
    materialityRuleId: "PROPERTY_NEW_LOCATION_001",
    materialityRuleVersion: "1.2.0",
    material: true,
    evidenceIds: ["ev_lease_b", "ev_asset_register", "ev_property_schedule"],
  },
  event_asset_increase: {
    id: "diff_asset_value",
    subjectType: "ASSET",
    subjectLabel: "Assets and equipment",
    field: "assetValueSgd",
    before: "S$500,000",
    after: "S$850,000",
    changedAt: "2026-07-03T03:00:00.000Z",
    materialityRuleId: "PROPERTY_ASSET_VALUE_002",
    materialityRuleVersion: "1.1.0",
    material: true,
    evidenceIds: ["ev_asset_register", "ev_property_schedule"],
  },
  event_supplier_concentration: {
    id: "diff_supplier_concentration",
    subjectType: "SUPPLIER",
    subjectLabel: "Critical component supplier",
    field: "supplierConcentrationPct",
    before: "22% dependency",
    after: "54% dependency",
    changedAt: "2026-07-10T04:00:00.000Z",
    materialityRuleId: "SUPPLY_CONCENTRATION_001",
    materialityRuleVersion: "1.0.0",
    material: true,
    evidenceIds: ["ev_supplier_register", "ev_financial_summary"],
  },
  event_cloud_dependency: {
    id: "diff_cloud_dependencies",
    subjectType: "SYSTEM",
    subjectLabel: "Critical cloud services",
    field: "cloudDependencyCount",
    before: "1 dependency",
    after: "3 dependencies",
    changedAt: "2026-07-14T05:00:00.000Z",
    materialityRuleId: "CYBER_CLOUD_DEPENDENCY_001",
    materialityRuleVersion: "1.0.0",
    material: true,
    evidenceIds: ["ev_infrastructure", "ev_cyber_summary"],
  },
  event_new_geography: {
    id: "diff_operating_geography",
    subjectType: "GEOGRAPHY",
    subjectLabel: "Operating geography",
    field: "territories",
    before: "Singapore",
    after: "Singapore and Malaysia",
    changedAt: "2026-07-20T06:00:00.000Z",
    materialityRuleId: "TERRITORY_CHANGE_001",
    materialityRuleVersion: "1.0.0",
    material: true,
    evidenceIds: ["ev_wording", "ev_policy_schedule"],
  },
};

function differenceInDays(later: string, earlier: string) {
  return Math.ceil(
    (new Date(later).getTime() - new Date(earlier).getTime()) / DAY_MS,
  );
}

function renewalBand(days: number) {
  if (days <= 0) return "DUE_NOW" as const;
  if (days <= 30) return "0_30" as const;
  if (days <= 60) return "31_60" as const;
  if (days <= 120) return "61_120" as const;
  return "OVER_120" as const;
}

function evidenceReadiness(finding: Finding) {
  if (finding.state === "EVIDENCE_CONFLICT") return "CONFLICTING" as const;
  if (
    finding.state === "EVIDENCE_INCOMPLETE" ||
    finding.state === "NOT_ASSESSED"
  ) {
    return "INCOMPLETE" as const;
  }
  return "COMPLETE" as const;
}

function priorityForFinding(finding: Finding, renewalDays: number) {
  const reasons: string[] = [];
  let priority: ReviewQueueItem["priority"] = "STANDARD";

  if (renewalDays <= 30) {
    priority = "URGENT";
    reasons.push(
      `The recorded policy period ends in ${Math.max(renewalDays, 0)} days.`,
    );
  } else if (
    finding.state === "POTENTIAL_GAP" ||
    finding.state === "EVIDENCE_CONFLICT" ||
    finding.state === "POLICY_INTERPRETATION_REQUIRED"
  ) {
    priority = "HIGH";
    reasons.push(
      finding.state === "POTENTIAL_GAP"
        ? "An active material exposure has a surviving potential-gap finding."
        : finding.state === "EVIDENCE_CONFLICT"
          ? "Material supplied evidence conflicts and needs human resolution."
          : "Relevant wording exists and requires professional interpretation.",
    );
  } else if (finding.state === "NOT_ASSESSED") {
    priority = "MONITOR";
    reasons.push("The issue is outside the current assessment scope.");
  } else {
    reasons.push(
      finding.state === "EVIDENCE_INCOMPLETE"
        ? "The assessment is incomplete until the minimum evidence is supplied."
        : "A material exposure change is ready for professional review.",
    );
  }

  if (renewalDays > 30) {
    reasons.push(
      `The supplied policy schedule records ${renewalDays} days until period end.`,
    );
  }

  return { priority, reasons };
}

function buildEvidenceRequests(
  assessment: Assessment,
  asOf: string,
): EvidenceRequest[] {
  return assessment.findings
    .filter((finding) => finding.resolutionSteps.length > 0)
    .map((finding) => ({
      id: `request_${finding.id}`,
      findingId: finding.id,
      title: `Evidence requested for ${finding.title}`,
      requestedItems: [...finding.resolutionSteps],
      status:
        finding.reviewStatus === "MORE_EVIDENCE_REQUESTED"
          ? ("OPEN" as const)
          : ("DRAFT" as const),
      owner: "Unassigned professional reviewer",
      requestedFrom: "SME or broker",
      dueAt:
        finding.reviewStatus === "MORE_EVIDENCE_REQUESTED"
          ? new Date(new Date(asOf).getTime() + 7 * DAY_MS).toISOString()
          : undefined,
      createdAt: finding.createdAt,
      resolutionPurpose:
        "Obtain the smallest evidence set reasonably capable of resolving the current uncertainty.",
    }));
}

function buildActivities(
  assessment: Assessment,
  caseId: string,
): ProfessionalActivity[] {
  const drafts: Omit<
    ProfessionalActivity,
    "id" | "eventHash" | "previousEventHash"
  >[] = [
    {
      caseId,
      type: "CASE_CREATED" as const,
      actor: "Deterministic reconciliation engine",
      actorRole: "SYSTEM" as const,
      visibility: "SHARED" as const,
      message: `Professional review case created from assessment v${assessment.version}.`,
      occurredAt: assessment.snapshotAt,
      evidenceIds: [],
    },
    ...assessment.findings.map((finding) => ({
      caseId,
      findingId: finding.id,
      type: "CHALLENGE_COMPLETED" as const,
      actor: "Coverage Challenge Pass",
      actorRole: "SYSTEM" as const,
      visibility: "SHARED" as const,
      message: `${finding.title}: ${finding.challenge.outcome.replaceAll("_", " ").toLowerCase()}.`,
      occurredAt: finding.challenge.completedAt,
      evidenceIds: finding.challenge.searchedEvidenceIds,
    })),
  ].sort((left, right) => left.occurredAt.localeCompare(right.occurredAt));

  let previousEventHash: string | undefined;
  return drafts.map((draft, index) => {
    const eventHash = demoHash({ ...draft, previousEventHash });
    const activity = {
      ...draft,
      id: `activity_${index + 1}_${eventHash.slice(-8)}`,
      previousEventHash,
      eventHash,
    };
    previousEventHash = eventHash;
    return activity;
  });
}

export function buildProfessionalReviewWorkspace(
  assessment: Assessment,
  asOf = PROFESSIONAL_REVIEW_AS_OF,
): ProfessionalReviewWorkspace {
  const caseId = `case_${assessment.id}`;
  const renewalDays = differenceInDays(policyProgrammeFixture.periodEnd, asOf);
  const evidenceRequests = buildEvidenceRequests(assessment, asOf);

  const queue = assessment.findings
    .map((finding) => {
      const priority = priorityForFinding(finding, renewalDays);
      return {
        id: `queue_${finding.id}`,
        caseId,
        findingId: finding.id,
        organizationName: demoCompany.name,
        title: finding.title,
        domain: finding.domain,
        protectionState: finding.state,
        reviewStatus: finding.reviewStatus,
        priority: priority.priority,
        priorityReasons: priority.reasons,
        evidenceReadiness: evidenceReadiness(finding),
        renewalDaysRemaining: renewalDays,
        assignedTo: "Unassigned",
        lastActivityAt: finding.challenge.completedAt,
      } satisfies ReviewQueueItem;
    })
    .sort((left, right) => {
      const rank = { URGENT: 0, HIGH: 1, STANDARD: 2, MONITOR: 3 };
      return rank[left.priority] - rank[right.priority];
    });

  const exposureDifferences = assessment.appliedEventIds
    .map((eventId) => exposureDifferencesByEvent[eventId])
    .filter((item): item is ExposureDifference => Boolean(item));

  const workflowContext = professionalContextFixture.workflow.map((item) =>
    item.id === "workflow_review"
      ? {
          ...item,
          value: assessment.findings.some(
            (finding) => finding.reviewStatus !== "OPEN",
          )
            ? "Professional activity recorded"
            : "Open",
        }
      : item,
  );

  return ProfessionalReviewWorkspaceSchema.parse({
    schemaVersion: "professional-review-workspace/1.0",
    synthetic: true,
    asOf,
    caseId,
    organizationId: assessment.organizationId,
    organizationName: demoCompany.name,
    queue,
    renewal: {
      policyId: policyProgrammeFixture.policyId,
      policyVersionId: policyProgrammeFixture.policyVersionId,
      recordedPeriodStart: policyProgrammeFixture.periodStart,
      recordedPeriodEnd: policyProgrammeFixture.periodEnd,
      asOf,
      daysRemaining: renewalDays,
      band: renewalBand(renewalDays),
      evidenceFreshness: "CURRENT",
      openFindingIds: assessment.findings
        .filter(
          (finding) =>
            finding.reviewStatus !== "CONFIRMED" &&
            finding.reviewStatus !== "DISMISSED",
        )
        .map((finding) => finding.id),
      openEvidenceRequestIds: evidenceRequests
        .filter((request) => request.status === "OPEN")
        .map((request) => request.id),
      description:
        "Countdown to the period end recorded in the supplied synthetic schedule; it is not a statement that protection will expire.",
    },
    policy: policyProgrammeFixture,
    exposureDifferences,
    contexts: {
      ...professionalContextFixture,
      workflow: workflowContext,
    },
    evidenceRequests,
    activities: buildActivities(assessment, caseId),
    connectors: futureConnectorCapabilities,
    permittedReviewActions: [
      "START_REVIEW",
      "CONFIRM_FINDING",
      "DISMISS_WITH_EVIDENCE",
      "REQUEST_EVIDENCE",
      "ESCALATE",
      "LEAVE_UNRESOLVED",
    ],
  });
}

export function appliedChangeLabels(assessment: Assessment) {
  const applied = new Set(assessment.appliedEventIds);
  return demoEvents
    .filter((event) => event.id && applied.has(event.id))
    .map((event) => event.eventType.replaceAll("_", " "));
}
