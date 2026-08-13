# [PRODUCT] Three-Minute Demo

This is the recording script for the deterministic synthetic replay. Use the in-product **Demo rehearsal** mode to keep the timer, exact narration, click instructions, and fallback actions visible while presenting.

## Presenter rules

- Say **potential protection gap**, never “uninsured” or “not covered.”
- Say **available/supplied evidence**, not “the policy definitely says.”
- Say **finding remains for review**, not “confirmed gap.”
- Say **evidence incomplete** when the system cannot answer.
- Say **professional review in progress** after requesting review.
- Describe the PDF as a **decision-support report**, not a coverage decision.
- Keep the demonstration in **Replay mode**. Do not depend on a live model or an external insurer connection.

## Exact run of show

### 0:00–0:12 — Reset and frame the problem

**Click:** Reset demo, then keep Simple selected.

**Say:** “SMEs change every day. Their protection may not. [PRODUCT] continuously reconciles how a business operates with the insurance evidence it has supplied.”

**Fallback:** If the baseline does not appear, click Reset demo once more and return to Overview. Say: “This is a deterministic synthetic replay, so I can restore the baseline without depending on a live model call.”

### 0:12–0:27 — Establish the aligned baseline

**Click:** On Overview, point to 100% evidence-aligned and Assessment version v1. Do not open the methodology tooltip.

**Say:** “Pacific Components is a synthetic Singapore SME. At this baseline, the available evidence supports alignment across the four evaluated protection domains.”

**Fallback:** If the summary is below 100%, use Reset demo and wait for v1. Say: “The percentage is an evidence-alignment indicator, not an underwriting score or a prediction of claim acceptance.”

### 0:27–0:43 — Apply the warehouse change

**Click:** Reconcile change in the new-warehouse storyline card.

**Say:** “The business has opened Warehouse B. Lease and asset records now evidence two operating locations, while the supplied property location schedule identifies only Location A.”

**Fallback:** Open Changes and apply New warehouse detected. Say: “The same canonical change event enters through every demo surface, so the assessment remains reproducible.”

### 0:43–1:05 — Explain the potential protection gap

**Click:** Open assessment, keep Simple selected, and point to Potential protection gap.

**Say:** “The deterministic rule creates a potential protection gap: a plausible schedule mismatch requiring professional confirmation. It does not say the location is uninsured, and it does not make a coverage determination.”

**Fallback:** Open Protection → Property and assets → Open assessment. Say: “This is a review item based on supplied evidence, not a claim, legal, or coverage decision.”

### 1:05–1:25 — Trace the evidence

**Click:** Evidence → Evidence and provenance. Point to the lease, asset register, property schedule, and endorsement pack.

**Say:** “Every material fact remains source-linked. Here are the lease and asset register evidencing Warehouse B, the property schedule, and the supplied endorsement pack used for comparison.”

**Fallback:** Click Evidence again and scroll to Current protection evidence. Say: “Each extracted fact retains its document version, page, section, method, confidence, and source hash.”

### 1:25–1:45 — Show the coverage challenge

**Click:** Insurance → Coverage challenge. Point to Finding remains for review.

**Say:** “Before surfacing the item, the challenge pass tries to disprove it by searching later schedules, endorsements, blanket provisions, and conflicting evidence. Nothing supplied resolved it, so the finding remains for review.”

**Fallback:** Scroll just below Evidence and provenance. Say: “The challenge found no resolving evidence in the supplied set. That is not the same as proving that protection does not exist.”

### 1:45–2:05 — Demonstrate abstention

**Click:** Apply the cloud-dependency cue, open Cyber, and point to Evidence incomplete.

**Say:** “For the new cloud dependencies, the evidence cannot establish alignment. The system abstains: it records Evidence incomplete and asks for the smallest evidence set that could resolve the uncertainty.”

**Fallback:** Changes → New cloud dependencies detected → Apply change → Protection → Cyber. Say: “Importantly, missing evidence becomes Evidence incomplete. The system does not invent a gap.”

### 2:05–2:27 — Send for professional review

**Click:** Open the cue → minimize the coach → Request review → Open review case.

**Say:** “I can send the source-grounded case for broker or insurer review. The status becomes Professional review in progress, while the qualified human owns every professional decision and next action.”

**Fallback:** Open Review case directly. Say: “This workflow is operating in replay mode; the case packet is prepared, but no external insurer system is connected.”

### 2:27–2:43 — Generate the PDF and receipt

**Click:** Open the cue → minimize the coach → Download PDF. Point to the assessment receipt and evidence snapshot.

**Say:** “The report packages material changes, review items, sources, human-review state, ruleset, evidence snapshot, and a reproducible assessment receipt.”

**Fallback:** If download is blocked, stay on the report preview. Say: “The visible report preview contains the same versioned assessment state as the generated PDF.”

### 2:43–3:00 — Close on the audit trail

**Click:** Open the cue; the coach minimizes. Point to Profile v3, the receipt, and Challenge pass completed. Do not scroll the entire history.

**Say:** “Finally, the append-only audit trail shows what the system knew, which rules it used, and why it produced each version. This is decision support—not a coverage, legal, claim, or insurer-endorsement decision.”

**Fallback:** Show only the receipt header and the first challenge event. Say: “Every conclusion is versioned and replayable; historical decisions are never silently overwritten.”

## Before recording

1. Open `/rehearsal` on the production site.
2. Confirm the left rail says **Replay mode** and **Synthetic demonstration**.
3. Click **Start timed rehearsal**.
4. Complete one no-commentary dry run using only the click instructions.
5. Complete one narrated run and aim to reach the PDF by 2:27.
6. If any scene overruns, use its fallback instead of improvising.
