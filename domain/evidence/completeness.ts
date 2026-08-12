import type { Finding, ProtectionState } from "../types";

export type EvidenceChecklistItem = {
  label: string;
  status: "present" | "missing" | "stale" | "conflicting";
};

export function assessmentAbstentionState(
  checklist: EvidenceChecklistItem[],
): ProtectionState | null {
  if (checklist.some((item) => item.status === "conflicting"))
    return "EVIDENCE_CONFLICT";
  if (
    checklist.some(
      (item) => item.status === "missing" || item.status === "stale",
    )
  ) {
    return "EVIDENCE_INCOMPLETE";
  }
  return null;
}

export function minimumEvidenceRequest(finding: Finding): string[] {
  return Array.from(new Set(finding.resolutionSteps)).slice(0, 3);
}
