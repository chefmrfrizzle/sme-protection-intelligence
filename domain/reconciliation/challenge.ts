import type {
  ChallengeResult,
  Finding,
  PolicySnapshot,
  ProtectionState,
} from "../types";

type Candidate = Pick<Finding, "id" | "state" | "ruleTrace" | "evidenceIds">;

export type ChallengeContext = {
  policy: PolicySnapshot;
  hasMaterialConflict?: boolean;
  interpretationEvidenceFound?: boolean;
  completedAt: string;
};

export function runCoverageChallenge(
  candidate: Candidate,
  context: ChallengeContext,
): {
  challenge: ChallengeResult;
  finalState: ProtectionState;
  dismissed: boolean;
} {
  const searchedEvidenceIds = Array.from(
    new Set([
      ...candidate.evidenceIds,
      "ev_endorsements",
      "ev_policy_schedule",
      "ev_property_schedule",
      "ev_wording",
    ]),
  );

  if (context.hasMaterialConflict) {
    return {
      challenge: {
        id: `challenge_${candidate.id}`,
        findingId: candidate.id,
        outcome: "CONTRADICTORY_EVIDENCE_FOUND",
        searchedEvidenceIds,
        summary:
          "The challenge pass found contradictory material evidence. No value was selected automatically; human resolution is required.",
        completedAt: context.completedAt,
      },
      finalState: "EVIDENCE_CONFLICT",
      dismissed: false,
    };
  }

  if (
    candidate.ruleTrace.ruleId === "PROPERTY_NEW_LOCATION_001" &&
    context.policy.endorsementIncludesLocationB
  ) {
    return {
      challenge: {
        id: `challenge_${candidate.id}`,
        findingId: candidate.id,
        outcome: "RESOLVED_DISMISSED",
        searchedEvidenceIds,
        summary:
          "A later supplied endorsement names Location B. The candidate scheduled-location mismatch was dismissed.",
        completedAt: context.completedAt,
      },
      finalState: "ALIGNED",
      dismissed: true,
    };
  }

  if (
    context.interpretationEvidenceFound ||
    candidate.state === "POLICY_INTERPRETATION_REQUIRED"
  ) {
    return {
      challenge: {
        id: `challenge_${candidate.id}`,
        findingId: candidate.id,
        outcome: "INTERPRETATION_REQUIRED",
        searchedEvidenceIds,
        summary:
          "Relevant wording was found, but the supplied text is not suitable for an automated coverage conclusion. Professional interpretation is required.",
        completedAt: context.completedAt,
      },
      finalState: "POLICY_INTERPRETATION_REQUIRED",
      dismissed: false,
    };
  }

  return {
    challenge: {
      id: `challenge_${candidate.id}`,
      findingId: candidate.id,
      outcome: "SURVIVES",
      searchedEvidenceIds,
      summary:
        candidate.state === "POTENTIAL_GAP"
          ? "No contradictory protection evidence, later schedule, or endorsement resolving this candidate was found in the supplied evidence set. This is not a coverage determination."
          : "No evidence was found that removes the need for review or resolves the stated uncertainty.",
      completedAt: context.completedAt,
    },
    finalState: candidate.state,
    dismissed: false,
  };
}
