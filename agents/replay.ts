import { evidenceArtifacts } from "@/demo/evidence";
import { replayAgentRun } from "./harness";

export const replayRuns = [
  replayAgentRun(
    "Document Intake",
    evidenceArtifacts.map((artifact) => artifact.id),
  ),
  replayAgentRun("Policy Structuring", [
    "ev_policy_schedule",
    "ev_property_schedule",
    "ev_cyber_summary",
    "ev_wording",
    "ev_endorsements",
  ]),
  replayAgentRun("Business Exposure Extraction", [
    "ev_lease_b",
    "ev_asset_register",
    "ev_supplier_register",
    "ev_financial_summary",
    "ev_infrastructure",
  ]),
];
