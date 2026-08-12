import { AssessmentSchema, FindingSchema } from "../schemas";
import type {
  Assessment,
  AuditEvent,
  DomainAssessment,
  ExposureSnapshot,
  Finding,
  PolicySnapshot,
  ProtectionDomain,
  ProtectionState,
  RuleDefinition,
  RuleTrace,
} from "../types";
import { demoCompany, DEMO_ORGANIZATION_ID } from "@/demo/company";
import { demoEventById, demoEvents, eventPresentation } from "@/demo/events";
import { evidenceArtifacts } from "@/demo/evidence";
import { RULESET_VERSION, rules } from "../rules/config";
import { runCoverageChallenge } from "./challenge";
import { demoHash } from "./hash";

export const baselineExposure: ExposureSnapshot = {
  locationIds: ["loc_a"],
  assetValueSgd: 500_000,
  supplierConcentrationPct: 22,
  cloudDependencyCount: 1,
  territories: ["SG"],
  headcount: 20,
};

export const baselinePolicy: PolicySnapshot = {
  scheduledLocationIds: ["loc_a"],
  declaredAssetValueSgd: 500_000,
  cyberDependenciesEvidenced: 1,
  territoriesExplicitlyConfirmed: ["SG"],
  territorialWordingPresent: true,
  policyCurrent: true,
  endorsementIncludesLocationB: false,
};

export type AssessmentOptions = {
  endorsementIncludesLocationB?: boolean;
  assetValueConflict?: boolean;
  policyCurrent?: boolean;
};

export function reduceExposure(eventIds: string[]): ExposureSnapshot {
  const next: ExposureSnapshot = {
    ...baselineExposure,
    locationIds: [...baselineExposure.locationIds],
    territories: [...baselineExposure.territories],
  };

  const events = eventIds
    .map((id) => demoEventById.get(id))
    .filter((event): event is NonNullable<typeof event> => Boolean(event))
    .sort((left, right) =>
      left.observedAt === right.observedAt
        ? (left.id ?? "").localeCompare(right.id ?? "")
        : left.observedAt.localeCompare(right.observedAt),
    );

  for (const event of events) {
    switch (event.eventType) {
      case "LOCATION_ADDED":
        if (!next.locationIds.includes(String(event.payload.locationId))) {
          next.locationIds = [
            ...next.locationIds,
            String(event.payload.locationId),
          ];
        }
        break;
      case "ASSET_VALUE_CHANGED":
        next.assetValueSgd = Number(event.payload.currentValueSgd);
        break;
      case "SUPPLIER_CONCENTRATION_CHANGED":
        next.supplierConcentrationPct = Number(event.payload.currentPct);
        break;
      case "CLOUD_DEPENDENCY_CHANGED":
        next.cloudDependencyCount = Number(
          event.payload.currentCriticalDependencies,
        );
        break;
      case "OPERATING_GEOGRAPHY_ADDED":
        if (!next.territories.includes(String(event.payload.country))) {
          next.territories = [
            ...next.territories,
            String(event.payload.country),
          ];
        }
        break;
      case "ENDORSEMENT_RECEIVED":
        break;
    }
  }
  return next;
}

function ruleTrace(
  rule: RuleDefinition,
  inputs: RuleTrace["inputs"],
  passed: boolean,
  result: ProtectionState,
  evaluatedAt: string,
): RuleTrace {
  return {
    ruleId: rule.id,
    ruleVersion: rule.version,
    inputs,
    threshold: rule.thresholds,
    passed,
    result,
    evaluatedAt,
  };
}

type FindingInput = Omit<Finding, "challenge"> & {
  challenge?: Finding["challenge"];
};

function finalizeFinding(
  candidate: FindingInput,
  policy: PolicySnapshot,
  options: AssessmentOptions,
): Finding | null {
  const result = runCoverageChallenge(
    {
      id: candidate.id,
      state: candidate.state,
      ruleTrace: candidate.ruleTrace,
      evidenceIds: candidate.evidenceIds,
    },
    {
      policy,
      hasMaterialConflict:
        options.assetValueConflict &&
        candidate.ruleTrace.ruleId === rules.assetIncrease.id,
      interpretationEvidenceFound:
        candidate.ruleTrace.ruleId === rules.newTerritory.id &&
        policy.territorialWordingPresent,
      completedAt: candidate.createdAt,
    },
  );
  if (result.dismissed) return null;
  return FindingSchema.parse({
    ...candidate,
    state: result.finalState,
    challenge: result.challenge,
  });
}

function evaluateFindings(
  exposure: ExposureSnapshot,
  policy: PolicySnapshot,
  eventIds: string[],
  snapshotAt: string,
  options: AssessmentOptions,
): Finding[] {
  const findings: Finding[] = [];
  const has = (id: string) => eventIds.includes(id);

  if (
    has("event_new_warehouse") &&
    !policy.scheduledLocationIds.includes("loc_b")
  ) {
    const candidate: FindingInput = {
      id: "finding_new_location",
      organizationId: DEMO_ORGANIZATION_ID,
      title: "New location may require protection review",
      domain: "PROPERTY_ASSETS",
      state: "POTENTIAL_GAP",
      summary:
        "Warehouse B is evidenced by current business records but was not found in the supplied property location schedule.",
      simpleExplanation:
        "You opened another warehouse, but we could not find that address in the insurance schedule you supplied.",
      insuranceExplanation:
        "Material property exposure change detected. Current supplied evidence indicates a possible scheduled-location mismatch. Review the location schedule, declared values and applicable endorsements.",
      whyItMatters:
        "A location mismatch can create uncertainty about how the new premises and property should be treated under the current programme.",
      evidenceIds: [
        "ev_lease_b",
        "ev_asset_register",
        "ev_property_schedule",
        "ev_endorsements",
      ],
      missingEvidence: [
        "Current broker confirmation of declared locations and values",
      ],
      resolutionSteps: [
        "Most recent property schedule",
        "Any endorsement issued after Warehouse B opened",
        "Broker or insurer confirmation of declared values for Warehouse B",
      ],
      ruleTrace: ruleTrace(
        rules.newLocation,
        { observedLocation: "loc_b", scheduledLocationFound: false },
        true,
        "POTENTIAL_GAP",
        snapshotAt,
      ),
      createdAt: snapshotAt,
      reviewStatus: "OPEN",
    };
    const finding = finalizeFinding(candidate, policy, options);
    if (finding) findings.push(finding);
  }

  const absoluteIncrease =
    exposure.assetValueSgd - policy.declaredAssetValueSgd;
  const relativeIncreasePct = Math.round(
    (absoluteIncrease / policy.declaredAssetValueSgd) * 100,
  );
  if (
    has("event_asset_increase") &&
    absoluteIncrease >=
      Number(rules.assetIncrease.thresholds.absoluteIncreaseSgd) &&
    relativeIncreasePct >=
      Number(rules.assetIncrease.thresholds.relativeIncreasePct)
  ) {
    const candidate: FindingInput = {
      id: "finding_asset_value",
      organizationId: DEMO_ORGANIZATION_ID,
      title: "Asset values have materially increased",
      domain: "PROPERTY_ASSETS",
      state: "REVIEW_RECOMMENDED",
      summary: `Observed assets are S$${exposure.assetValueSgd.toLocaleString("en-SG")}, compared with S$${policy.declaredAssetValueSgd.toLocaleString("en-SG")} in the supplied property schedule.`,
      simpleExplanation:
        "Your recorded equipment and assets increased by S$350,000. The insured values you supplied have not changed with them.",
      insuranceExplanation:
        "Observed property values increased by 70%, exceeding both configured relative and absolute materiality thresholds. Declared values review is recommended.",
      whyItMatters:
        "Material changes in asset values should be reviewed so the programme evidence reflects the current exposure.",
      evidenceIds: ["ev_asset_register", "ev_property_schedule"],
      missingEvidence: ["Latest declared values confirmation"],
      resolutionSteps: [
        "Updated property values schedule",
        "Broker confirmation of declared values",
      ],
      ruleTrace: ruleTrace(
        rules.assetIncrease,
        {
          observedValueSgd: exposure.assetValueSgd,
          evidencedValueSgd: policy.declaredAssetValueSgd,
          absoluteIncreaseSgd: absoluteIncrease,
          relativeIncreasePct,
        },
        true,
        "REVIEW_RECOMMENDED",
        snapshotAt,
      ),
      createdAt: snapshotAt,
      reviewStatus: "OPEN",
    };
    const finding = finalizeFinding(candidate, policy, options);
    if (finding) findings.push(finding);
  }

  const supplierIncrease =
    exposure.supplierConcentrationPct -
    baselineExposure.supplierConcentrationPct;
  if (
    has("event_supplier_concentration") &&
    exposure.supplierConcentrationPct >=
      Number(rules.supplierConcentration.thresholds.concentrationPct) &&
    supplierIncrease >=
      Number(rules.supplierConcentration.thresholds.increasePercentagePoints)
  ) {
    const candidate: FindingInput = {
      id: "finding_supplier_concentration",
      organizationId: DEMO_ORGANIZATION_ID,
      title: "Critical supplier concentration increased",
      domain: "SUPPLY_CHAIN",
      state: "REVIEW_RECOMMENDED",
      summary:
        "One supplier now provides 54% of a critical component, up from 22%.",
      simpleExplanation:
        "Your business now relies much more heavily on one supplier for a critical component.",
      insuranceExplanation:
        "Critical supplier dependency increased by 32 percentage points to 54%. Supply-chain and business-interruption dependency review is recommended.",
      whyItMatters:
        "A disruption at a concentrated supplier can affect production and revenue recovery.",
      evidenceIds: [
        "ev_supplier_register",
        "ev_financial_summary",
        "ev_policy_schedule",
      ],
      missingEvidence: [
        "Current contingent business interruption dependency schedule",
      ],
      resolutionSteps: [
        "Current critical supplier dependency schedule",
        "Broker review of contingent business interruption information",
      ],
      ruleTrace: ruleTrace(
        rules.supplierConcentration,
        {
          previousPct: 22,
          currentPct: exposure.supplierConcentrationPct,
          increasePoints: supplierIncrease,
        },
        true,
        "REVIEW_RECOMMENDED",
        snapshotAt,
      ),
      createdAt: snapshotAt,
      reviewStatus: "OPEN",
    };
    const finding = finalizeFinding(candidate, policy, options);
    if (finding) findings.push(finding);
  }

  if (
    has("event_cloud_dependency") &&
    exposure.cloudDependencyCount > policy.cyberDependenciesEvidenced
  ) {
    const candidate: FindingInput = {
      id: "finding_cloud_dependency",
      organizationId: DEMO_ORGANIZATION_ID,
      title: "Cloud dependency assessment needs more evidence",
      domain: "CYBER",
      state: "EVIDENCE_INCOMPLETE",
      summary:
        "Three critical cloud dependencies are now recorded, but supplied cyber evidence describes only the original AWS environment.",
      simpleExplanation:
        "You added two important cloud services. We do not have enough current insurance and control evidence to tell how they should be reviewed.",
      insuranceExplanation:
        "Critical technology dependency changed from one to three. Current cyber and business-interruption evidence is incomplete for the additional dependencies; no protection-gap conclusion was made.",
      whyItMatters:
        "The system needs current dependency and control evidence before it can perform a grounded comparison.",
      evidenceIds: ["ev_infrastructure", "ev_cyber_summary"],
      missingEvidence: [
        "Updated technology dependency declaration",
        "Backup and recovery evidence for the new services",
      ],
      resolutionSteps: [
        "Updated critical technology dependency declaration",
        "Backup and recovery evidence for the managed database and warehouse workflow",
      ],
      ruleTrace: ruleTrace(
        rules.cloudDependency,
        {
          observedDependencies: exposure.cloudDependencyCount,
          evidencedDependencies: policy.cyberDependenciesEvidenced,
          missingCurrentEvidence: true,
        },
        true,
        "EVIDENCE_INCOMPLETE",
        snapshotAt,
      ),
      createdAt: snapshotAt,
      reviewStatus: "OPEN",
    };
    const finding = finalizeFinding(candidate, policy, options);
    if (finding) findings.push(finding);
  }

  if (
    has("event_new_geography") &&
    !policy.territoriesExplicitlyConfirmed.includes("MY")
  ) {
    const candidate: FindingInput = {
      id: "finding_new_geography",
      organizationId: DEMO_ORGANIZATION_ID,
      title: "Territorial wording requires professional interpretation",
      domain: "BUSINESS_CONTINUITY",
      state: "POLICY_INTERPRETATION_REQUIRED",
      summary:
        "Material activity began in Malaysia. Relevant territorial wording exists, but the supplied excerpts do not support an automated conclusion.",
      simpleExplanation:
        "You started material work in Malaysia. The policy wording needs to be reviewed by your broker or insurer.",
      insuranceExplanation:
        "A new operating territory was detected. Supplied territorial wording is conditional and must be interpreted with the complete schedule and endorsements. No exclusion conclusion was made.",
      whyItMatters:
        "Territorial application can depend on the complete wording, section, schedule, activity and endorsements.",
      evidenceIds: ["ev_wording", "ev_policy_schedule", "ev_endorsements"],
      missingEvidence: [
        "Complete current wording and professional territorial interpretation",
      ],
      resolutionSteps: [
        "Complete current policy wording and territorial schedule",
        "Broker or insurer interpretation for the Malaysian activity",
      ],
      ruleTrace: ruleTrace(
        rules.newTerritory,
        {
          newTerritory: "MY",
          explicitlyConfirmed: false,
          wordingPresent: true,
        },
        true,
        "POLICY_INTERPRETATION_REQUIRED",
        snapshotAt,
      ),
      createdAt: snapshotAt,
      reviewStatus: "OPEN",
    };
    const finding = finalizeFinding(candidate, policy, options);
    if (finding) findings.push(finding);
  }

  return findings;
}

const stateRank: Record<ProtectionState, number> = {
  EVIDENCE_CONFLICT: 7,
  POTENTIAL_GAP: 6,
  POLICY_INTERPRETATION_REQUIRED: 5,
  EVIDENCE_INCOMPLETE: 4,
  REVIEW_RECOMMENDED: 3,
  NOT_ASSESSED: 2,
  ALIGNED: 1,
};

const stateWeight: Record<ProtectionState, number> = {
  ALIGNED: 1,
  REVIEW_RECOMMENDED: 0.65,
  POLICY_INTERPRETATION_REQUIRED: 0.5,
  EVIDENCE_INCOMPLETE: 0.4,
  POTENTIAL_GAP: 0.2,
  EVIDENCE_CONFLICT: 0.15,
  NOT_ASSESSED: 0,
};

const domainMeta: Record<
  ProtectionDomain,
  { required: number; baselinePresent: number; alignedSentence: string }
> = {
  CYBER: {
    required: 4,
    baselinePresent: 4,
    alignedSentence:
      "Current cyber evidence supports the assessed baseline dependencies and controls.",
  },
  PROPERTY_ASSETS: {
    required: 4,
    baselinePresent: 4,
    alignedSentence:
      "Locations and values align across the supplied baseline evidence.",
  },
  SUPPLY_CHAIN: {
    required: 3,
    baselinePresent: 3,
    alignedSentence:
      "No material supplier concentration change is present in the assessed baseline.",
  },
  BUSINESS_CONTINUITY: {
    required: 4,
    baselinePresent: 4,
    alignedSentence:
      "Current critical site, revenue and dependency evidence is aligned for the assessed baseline.",
  },
};

function domainAssessments(findings: Finding[]): DomainAssessment[] {
  return (Object.keys(domainMeta) as ProtectionDomain[]).map((domain) => {
    const related = findings.filter((finding) => finding.domain === domain);
    const state = related.reduce<ProtectionState>(
      (current, finding) =>
        stateRank[finding.state] > stateRank[current] ? finding.state : current,
      "ALIGNED",
    );
    const meta = domainMeta[domain];
    const missingCount = related.reduce(
      (count, finding) =>
        count + (finding.state === "EVIDENCE_INCOMPLETE" ? 2 : 0),
      0,
    );
    const present = Math.max(1, meta.baselinePresent - missingCount);
    const completeness = present / meta.required;
    const score = Math.round(
      (0.6 * stateWeight[state] + 0.4 * completeness) * 100,
    );
    return {
      domain,
      state,
      sentence: related[0]?.summary ?? meta.alignedSentence,
      evidencePresent: present,
      evidenceRequired: meta.required,
      score,
      findingIds: related.map((finding) => finding.id),
    };
  });
}

function auditEvents(
  eventIds: string[],
  findings: Finding[],
  snapshotAt: string,
): AuditEvent[] {
  const events: AuditEvent[] = [
    {
      id: "audit_baseline",
      organizationId: DEMO_ORGANIZATION_ID,
      eventType: "ASSESSMENT_CREATED",
      actor: "Deterministic reconciliation service",
      occurredAt: demoCompany.baselineAt,
      summary:
        "Protection Profile v1 created from the validated synthetic evidence snapshot.",
      snapshotHash: demoHash({
        evidence: evidenceArtifacts.map((item) => item.sourceHash),
        version: 1,
      }),
    },
  ];

  for (const eventId of eventIds) {
    const event = demoEventById.get(eventId);
    if (!event) continue;
    events.push({
      id: `audit_${eventId}`,
      organizationId: DEMO_ORGANIZATION_ID,
      eventType: "CHANGE_EVENT_APPLIED",
      actor: "Synthetic demo connector",
      occurredAt: event.observedAt,
      summary: eventPresentation[eventId].title,
      snapshotHash: demoHash(event),
    });
  }
  for (const finding of findings) {
    events.push(
      {
        id: `audit_${finding.id}`,
        organizationId: DEMO_ORGANIZATION_ID,
        eventType: "FINDING_CREATED",
        actor: "Deterministic reconciliation service",
        occurredAt: snapshotAt,
        summary: `${finding.title} (${finding.state})`,
        snapshotHash: demoHash(finding.ruleTrace),
      },
      {
        id: `audit_${finding.challenge.id}`,
        organizationId: DEMO_ORGANIZATION_ID,
        eventType: "CHALLENGE_PASS_COMPLETED",
        actor: "Coverage challenge service",
        occurredAt: snapshotAt,
        summary: finding.challenge.summary,
        snapshotHash: demoHash(finding.challenge),
      },
    );
  }
  return events;
}

export function buildAssessment(
  requestedEventIds: string[] = [],
  options: AssessmentOptions = {},
): Assessment {
  const allowedIds = new Set(demoEvents.map((event) => event.id!));
  const eventIds = Array.from(new Set(requestedEventIds))
    .filter((id) => allowedIds.has(id))
    .sort((left, right) => {
      const leftEvent = demoEventById.get(left)!;
      const rightEvent = demoEventById.get(right)!;
      return leftEvent.observedAt.localeCompare(rightEvent.observedAt);
    });
  const lastEvent = eventIds.length
    ? demoEventById.get(eventIds[eventIds.length - 1])
    : undefined;
  const snapshotAt = lastEvent?.observedAt ?? demoCompany.baselineAt;
  const exposure = reduceExposure(eventIds);
  const policy: PolicySnapshot = {
    ...baselinePolicy,
    policyCurrent: options.policyCurrent ?? baselinePolicy.policyCurrent,
    endorsementIncludesLocationB:
      options.endorsementIncludesLocationB ??
      baselinePolicy.endorsementIncludesLocationB,
  };
  const findings = policy.policyCurrent
    ? evaluateFindings(exposure, policy, eventIds, snapshotAt, options)
    : [
        FindingSchema.parse({
          id: "finding_missing_policy",
          organizationId: DEMO_ORGANIZATION_ID,
          title: "Current policy evidence is missing",
          domain: "PROPERTY_ASSETS",
          state: "EVIDENCE_INCOMPLETE",
          summary:
            "The latest current policy schedule was not supplied, so alignment cannot be evaluated.",
          simpleExplanation:
            "We need the current policy schedule before we can compare your business with it.",
          insuranceExplanation:
            "Assessment abstained because the current policy schedule is absent from the evidence snapshot.",
          whyItMatters:
            "A stale or missing programme cannot support a current comparison.",
          evidenceIds: [],
          missingEvidence: ["Complete current policy schedule"],
          resolutionSteps: [
            "Complete current policy schedule",
            "Latest endorsements",
          ],
          ruleTrace: ruleTrace(
            rules.newLocation,
            { currentPolicyPresent: false },
            false,
            "EVIDENCE_INCOMPLETE",
            snapshotAt,
          ),
          challenge: {
            id: "challenge_finding_missing_policy",
            findingId: "finding_missing_policy",
            outcome: "SURVIVES",
            searchedEvidenceIds: [],
            summary:
              "No current schedule was available to resolve the missing-evidence condition.",
            completedAt: snapshotAt,
          },
          createdAt: snapshotAt,
          reviewStatus: "OPEN",
        }),
      ];
  const domains = domainAssessments(findings);
  const alignment = Math.round(
    domains.reduce((sum, domain) => sum + domain.score, 0) / domains.length,
  );
  const version = eventIds.length + 1;
  const evidenceSnapshotId = `snapshot_${demoHash({ eventIds, snapshotAt }).slice(-12)}`;
  const audit = auditEvents(eventIds, findings, snapshotAt);
  const receiptPayload = {
    organizationId: DEMO_ORGANIZATION_ID,
    version,
    snapshotAt,
    rulesetVersion: RULESET_VERSION,
    evidenceSnapshotId,
    eventIds,
    findingIds: findings.map((finding) => finding.id),
  };
  return AssessmentSchema.parse({
    id: `assessment_v${version}`,
    organizationId: DEMO_ORGANIZATION_ID,
    version,
    label: `Protection Profile - Version ${version}`,
    snapshotAt,
    rulesetVersion: RULESET_VERSION,
    evidenceSnapshotId,
    alignment,
    appliedEventIds: eventIds,
    findings,
    domains,
    auditEvents: audit,
    receiptHash: demoHash(receiptPayload),
  });
}

export function protectionDiff(eventIds: string[]) {
  const after = reduceExposure(eventIds);
  return {
    locations: {
      before: baselineExposure.locationIds.length,
      after: after.locationIds.length,
    },
    assetValueSgd: {
      before: baselineExposure.assetValueSgd,
      after: after.assetValueSgd,
    },
    supplierConcentrationPct: {
      before: baselineExposure.supplierConcentrationPct,
      after: after.supplierConcentrationPct,
    },
    cloudDependencies: {
      before: baselineExposure.cloudDependencyCount,
      after: after.cloudDependencyCount,
    },
    territories: {
      before: baselineExposure.territories,
      after: after.territories,
    },
  };
}
