import type { AssessmentOptions } from "@/domain/reconciliation/engine";
import type { ProtectionState } from "@/domain/types";

export type GoldenScenario = {
  id: string;
  name: string;
  eventIds: string[];
  options?: AssessmentOptions;
  expectedFindingStates: ProtectionState[];
  expectedFindingIds?: string[];
  note: string;
};

export const goldenScenarios: GoldenScenario[] = [
  {
    id: "golden_01_new_location_no_schedule",
    name: "New location, no schedule evidence",
    eventIds: ["event_new_warehouse"],
    expectedFindingStates: ["POTENTIAL_GAP"],
    expectedFindingIds: ["finding_new_location"],
    note: "Adequate comparison evidence supports a candidate scheduled-location mismatch.",
  },
  {
    id: "golden_02_location_later_endorsement",
    name: "New location covered by later endorsement",
    eventIds: ["event_new_warehouse"],
    options: { endorsementIncludesLocationB: true },
    expectedFindingStates: [],
    expectedFindingIds: [],
    note: "Challenge pass finds the later endorsement and dismisses the candidate.",
  },
  {
    id: "golden_03_conflicting_asset_values",
    name: "Conflicting asset values",
    eventIds: ["event_asset_increase"],
    options: { assetValueConflict: true },
    expectedFindingStates: ["EVIDENCE_CONFLICT"],
    expectedFindingIds: ["finding_asset_value"],
    note: "No source value is silently preferred.",
  },
  {
    id: "golden_04_missing_current_policy",
    name: "Missing current policy",
    eventIds: ["event_new_warehouse"],
    options: { policyCurrent: false },
    expectedFindingStates: ["EVIDENCE_INCOMPLETE"],
    expectedFindingIds: ["finding_missing_policy"],
    note: "The engine abstains before comparing a stale or absent programme.",
  },
  {
    id: "golden_05_supplier_concentration",
    name: "Supplier concentration change",
    eventIds: ["event_supplier_concentration"],
    expectedFindingStates: ["REVIEW_RECOMMENDED"],
    expectedFindingIds: ["finding_supplier_concentration"],
    note: "Both concentration and increase thresholds are met.",
  },
  {
    id: "golden_06_cyber_dependency",
    name: "Cyber dependency change",
    eventIds: ["event_cloud_dependency"],
    expectedFindingStates: ["EVIDENCE_INCOMPLETE"],
    expectedFindingIds: ["finding_cloud_dependency"],
    note: "No gap is invented when the new dependency evidence is incomplete.",
  },
  {
    id: "golden_07_geography_interpretation",
    name: "Geography requiring interpretation",
    eventIds: ["event_new_geography"],
    expectedFindingStates: ["POLICY_INTERPRETATION_REQUIRED"],
    expectedFindingIds: ["finding_new_geography"],
    note: "Conditional wording is not converted into an exclusion conclusion.",
  },
  {
    id: "golden_08_stale_evidence",
    name: "Stale programme evidence",
    eventIds: ["event_asset_increase"],
    options: { policyCurrent: false },
    expectedFindingStates: ["EVIDENCE_INCOMPLETE"],
    expectedFindingIds: ["finding_missing_policy"],
    note: "Stale evidence causes abstention.",
  },
  {
    id: "golden_09_no_material_change",
    name: "No material change",
    eventIds: [],
    expectedFindingStates: [],
    expectedFindingIds: [],
    note: "Baseline remains aligned with no alert.",
  },
  {
    id: "golden_10_false_positive_challenge",
    name: "False-positive challenge scenario",
    eventIds: ["event_new_warehouse"],
    options: { endorsementIncludesLocationB: true },
    expectedFindingStates: [],
    expectedFindingIds: [],
    note: "The adversarial pass prevents an alarming false positive from reaching the user.",
  },
];
