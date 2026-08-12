import { ProtectionReviewCaseSchema } from "../schemas";
import type {
  Assessment,
  CanonicalChangeEvent,
  EvidenceArtifact,
  ProtectionReviewCase,
} from "../types";
import { demoHash } from "../reconciliation/hash";

export function buildProtectionReviewCase(
  assessment: Assessment,
  events: CanonicalChangeEvent[],
  artifacts: EvidenceArtifact[],
): ProtectionReviewCase {
  const appliedEvents = events.filter(
    (event) => event.id && assessment.appliedEventIds.includes(event.id),
  );
  const evidenceIds = new Set(
    assessment.findings.flatMap((finding) => finding.evidenceIds),
  );
  const evidence = artifacts
    .filter((artifact) => evidenceIds.has(artifact.id))
    .map((artifact) => ({
      id: artifact.id,
      title: artifact.title,
      fileName: artifact.fileName,
      documentType: artifact.documentType,
      version: artifact.version,
      sourceHash: artifact.sourceHash,
      synthetic: artifact.synthetic,
    }));

  const unresolvedEvidence = assessment.findings.some((finding) =>
    ["EVIDENCE_INCOMPLETE", "EVIDENCE_CONFLICT"].includes(finding.state),
  );
  const state = !assessment.findings.length
    ? "NO_ACTIVE_REVIEW"
    : unresolvedEvidence
      ? "EVIDENCE_REQUIRED"
      : "READY_FOR_PROFESSIONAL_REVIEW";
  const allowedActions = assessment.findings.length
    ? (["ROUTE_FOR_REVIEW", "REQUEST_EVIDENCE", "ABSTAIN"] as const)
    : ([] as const);
  const id = `case_${assessment.id}`;
  const outboundPreview = {
    schemaVersion: "protection-review-case/1.0" as const,
    caseId: id,
    organizationId: assessment.organizationId,
    assessmentId: assessment.id,
    assessmentVersion: assessment.version,
    synthetic: true as const,
    observedChanges: appliedEvents.map((event) => ({
      eventId: event.id!,
      eventType: event.eventType,
      observedAt: event.observedAt,
      evidenceReferences: event.evidenceReferences,
    })),
    reviewItems: assessment.findings.map((finding) => ({
      findingId: finding.id,
      domain: finding.domain,
      state: finding.state,
      ruleId: finding.ruleTrace.ruleId,
      ruleVersion: finding.ruleTrace.ruleVersion,
      evidenceReferences: finding.evidenceIds,
      missingEvidence: finding.missingEvidence,
      challengeOutcome: finding.challenge.outcome,
    })),
    allowedActions: [...allowedActions],
  };
  const receiptHash = demoHash({
    assessmentReceipt: assessment.receiptHash,
    outboundPreview,
  });

  return ProtectionReviewCaseSchema.parse({
    id,
    organizationId: assessment.organizationId,
    assessmentId: assessment.id,
    assessmentVersion: assessment.version,
    createdAt: assessment.snapshotAt,
    synthetic: true,
    state,
    events: appliedEvents,
    findings: assessment.findings,
    evidence,
    allowedActions,
    receiptHash,
    integration: {
      adapter: "ZURICH_COMPATIBLE_DEMO",
      mode: "MOCK",
      connectionState: "NOT_CONNECTED",
      destination: "COUNTRY_WORKFLOW_TO_BE_VALIDATED",
      conformity: "MAPPING_READY_NOT_CERTIFIED",
    },
    outboundPreview,
  });
}
