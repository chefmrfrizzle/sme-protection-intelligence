export type RehearsalSetup =
  | "RESET_BASELINE"
  | "SHOW_BASELINE"
  | "APPLY_WAREHOUSE"
  | "OPEN_WAREHOUSE_FINDING"
  | "SHOW_WAREHOUSE_EVIDENCE"
  | "SHOW_CHALLENGE"
  | "APPLY_CLOUD_ABSTENTION"
  | "OPEN_PROFESSIONAL_REVIEW"
  | "OPEN_REPORT"
  | "OPEN_AUDIT";

export type DemoScene = {
  id: string;
  title: string;
  startSeconds: number;
  endSeconds: number;
  path: string;
  setup: RehearsalSetup;
  clickInstruction: string;
  narration: string;
  safePhrase: string;
  fallbackAction: string;
  fallbackNarration: string;
};

export const DEMO_DURATION_SECONDS = 180;

export const demoScenes: readonly DemoScene[] = [
  {
    id: "opening-reset",
    title: "Reset and frame the problem",
    startSeconds: 0,
    endSeconds: 12,
    path: "/overview",
    setup: "RESET_BASELINE",
    clickInstruction:
      "Click Reset demo, then keep the Simple explanation selected.",
    narration:
      "SMEs change every day. Their protection may not. [PRODUCT] continuously reconciles how a business operates with the insurance evidence it has supplied.",
    safePhrase: "insurance evidence it has supplied",
    fallbackAction:
      "If the baseline does not appear, click Reset demo once more and return to Overview.",
    fallbackNarration:
      "This is a deterministic synthetic replay, so I can restore the baseline without depending on a live model call.",
  },
  {
    id: "baseline",
    title: "Establish the aligned baseline",
    startSeconds: 12,
    endSeconds: 27,
    path: "/overview",
    setup: "SHOW_BASELINE",
    clickInstruction:
      "On Overview, point to 100% evidence-aligned and Assessment version v1. Do not open the methodology tooltip.",
    narration:
      "Pacific Components is a synthetic Singapore SME. At this baseline, the available evidence supports alignment across the four evaluated protection domains.",
    safePhrase: "available evidence supports alignment",
    fallbackAction:
      "If the summary is below 100%, use Reset demo and wait for Assessment version v1.",
    fallbackNarration:
      "The percentage is an evidence-alignment indicator, not an underwriting score or a prediction of claim acceptance.",
  },
  {
    id: "warehouse-change",
    title: "Apply the warehouse change",
    startSeconds: 27,
    endSeconds: 43,
    path: "/overview",
    setup: "APPLY_WAREHOUSE",
    clickInstruction:
      "Click Reconcile change in the new-warehouse storyline card.",
    narration:
      "The business has opened Warehouse B. Lease and asset records now evidence two operating locations, while the supplied property location schedule identifies only Location A.",
    safePhrase: "the supplied property location schedule identifies only",
    fallbackAction:
      "If the storyline button is unavailable, open Changes and apply New warehouse detected.",
    fallbackNarration:
      "The same canonical change event enters through every demo surface, so the assessment remains reproducible.",
  },
  {
    id: "warehouse-finding",
    title: "Explain the potential protection gap",
    startSeconds: 43,
    endSeconds: 65,
    path: "/findings/finding_new_location",
    setup: "OPEN_WAREHOUSE_FINDING",
    clickInstruction:
      "Click Open assessment, then keep the Simple lens selected and point to Potential protection gap.",
    narration:
      "The deterministic rule creates a potential protection gap: a plausible schedule mismatch requiring professional confirmation. It does not say the location is uninsured, and it does not make a coverage determination.",
    safePhrase: "potential protection gap requiring professional confirmation",
    fallbackAction:
      "If the assessment link is missed, open Protection, then Property and assets, then Open assessment.",
    fallbackNarration:
      "This is a review item based on supplied evidence, not a claim, legal, or coverage decision.",
  },
  {
    id: "evidence",
    title: "Trace the evidence",
    startSeconds: 65,
    endSeconds: 85,
    path: "/findings/finding_new_location#evidence-provenance",
    setup: "SHOW_WAREHOUSE_EVIDENCE",
    clickInstruction:
      "Click Evidence, then scroll to Evidence and provenance. Point to the lease, asset register, property schedule, and endorsement pack.",
    narration:
      "Every material fact remains source-linked. Here are the lease and asset register evidencing Warehouse B, the property schedule, and the supplied endorsement pack used for comparison.",
    safePhrase: "source-linked",
    fallbackAction:
      "If the source list is not visible, click Evidence again and scroll to Current protection evidence.",
    fallbackNarration:
      "Each extracted fact retains its document version, page, section, method, confidence, and source hash.",
  },
  {
    id: "challenge",
    title: "Show the coverage challenge",
    startSeconds: 85,
    endSeconds: 105,
    path: "/findings/finding_new_location#coverage-challenge",
    setup: "SHOW_CHALLENGE",
    clickInstruction:
      "Click Insurance, then scroll to Coverage challenge and point to Finding remains for review.",
    narration:
      "Before surfacing the item, the challenge pass tries to disprove it by searching later schedules, endorsements, blanket provisions, and conflicting evidence. Nothing supplied resolved it, so the finding remains for review.",
    safePhrase: "finding remains for review",
    fallbackAction:
      "If the card is off-screen, scroll just below Evidence and provenance.",
    fallbackNarration:
      "The challenge found no resolving evidence in the supplied set. That is not the same as proving that protection does not exist.",
  },
  {
    id: "abstention",
    title: "Demonstrate abstention",
    startSeconds: 105,
    endSeconds: 125,
    path: "/findings/finding_cloud_dependency",
    setup: "APPLY_CLOUD_ABSTENTION",
    clickInstruction:
      "Apply the cloud-dependency cue, open the Cyber finding, and point to Evidence incomplete.",
    narration:
      "For the new cloud dependencies, the evidence cannot establish alignment. The system abstains: it records Evidence incomplete and asks for the smallest evidence set that could resolve the uncertainty.",
    safePhrase: "the evidence cannot establish alignment",
    fallbackAction:
      "If the Cyber finding is inactive, open Changes, apply New cloud dependencies detected, then return to Protection and open Cyber.",
    fallbackNarration:
      "Importantly, missing evidence becomes Evidence incomplete. The system does not invent a gap.",
  },
  {
    id: "professional-review",
    title: "Send the case for professional review",
    startSeconds: 125,
    endSeconds: 147,
    path: "/findings/finding_new_location#professional-review",
    setup: "OPEN_PROFESSIONAL_REVIEW",
    clickInstruction:
      "Open the cue, minimize the coach, click Request review, then click Open review case.",
    narration:
      "I can send the source-grounded case for broker or insurer review. The status becomes Professional review in progress, while the qualified human owns every professional decision and next action.",
    safePhrase: "qualified human owns every professional decision",
    fallbackAction:
      "If the request cannot be saved, open Review case directly and use the prepared replay-mode case packet.",
    fallbackNarration:
      "This workflow is operating in replay mode; the case packet is prepared, but no external insurer system is connected.",
  },
  {
    id: "pdf-report",
    title: "Generate the report and receipt",
    startSeconds: 147,
    endSeconds: 163,
    path: "/reports",
    setup: "OPEN_REPORT",
    clickInstruction:
      "Open the cue, minimize the coach, and click Download PDF. Point to the assessment receipt and evidence snapshot.",
    narration:
      "The report packages material changes, review items, sources, human-review state, ruleset, evidence snapshot, and a reproducible assessment receipt.",
    safePhrase: "reproducible assessment receipt",
    fallbackAction:
      "If the browser blocks the download, stay on the report preview and point to the receipt, snapshot, and ruleset values.",
    fallbackNarration:
      "The visible report preview contains the same versioned assessment state as the generated PDF.",
  },
  {
    id: "audit-close",
    title: "Close on the audit trail",
    startSeconds: 163,
    endSeconds: 180,
    path: "/audit",
    setup: "OPEN_AUDIT",
    clickInstruction:
      "Open the cue; the coach minimizes. Point to Profile v3, the receipt, and the challenge-pass event without scrolling the entire history.",
    narration:
      "Finally, the append-only audit trail shows what the system knew, which rules it used, and why it produced each version. This is decision support—not a coverage, legal, claim, or insurer-endorsement decision.",
    safePhrase: "decision support",
    fallbackAction:
      "If time is short, show only the receipt header and the first Challenge pass completed event.",
    fallbackNarration:
      "Every conclusion is versioned and replayable; historical decisions are never silently overwritten.",
  },
] as const;

export function formatDemoTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.min(DEMO_DURATION_SECONDS, seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

export function sceneAtElapsed(seconds: number) {
  return (
    demoScenes.find(
      (scene) => seconds >= scene.startSeconds && seconds < scene.endSeconds,
    ) ?? demoScenes[demoScenes.length - 1]
  );
}

export function sceneIndexAtElapsed(seconds: number) {
  return demoScenes.findIndex(
    (scene) => scene.id === sceneAtElapsed(seconds).id,
  );
}
