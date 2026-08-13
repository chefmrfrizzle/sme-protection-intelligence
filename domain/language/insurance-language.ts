import type {
  ChallengeResult,
  ProtectionDomain,
  ProtectionReviewCase,
  ProtectionState,
  ReviewStatus,
} from "../types";

export type LanguagePerspective = "plain" | "insurance" | "presenter";

export type LanguageSource = {
  label: string;
  url: string;
};

export type GlossaryEntry = {
  id: string;
  term: string;
  abbreviation?: string;
  category:
    | "Product concept"
    | "Assessment state"
    | "Policy document"
    | "Insurance structure"
    | "Exposure and continuity"
    | "Cyber control"
    | "Professional role";
  plain: string;
  insurance: string;
  presenter: string;
  boundary: string;
  sourceIds?: string[];
};

export const languageSources: Record<string, LanguageSource> = {
  zurichProperty: {
    label: "Zurich Singapore — Property",
    url: "https://www.zurich.com.sg/corporate-solutions/our-products/property",
  },
  zurichFinancialLines: {
    label: "Zurich Singapore — Financial Lines",
    url: "https://www.zurich.com.sg/corporate-solutions/our-products/financial-lines",
  },
  zurichCbi: {
    label: "Zurich — Contingent business interruption",
    url: "https://www.nordic.zurich.com/en/news-and-risk-insights/articles/contingent-business-interruption",
  },
  zurichCyber: {
    label: "Zurich — Cyber risk",
    url: "https://www.zurich.com/en/commercial-insurance/products/cyber",
  },
  zurichPortal: {
    label: "Zurich Singapore — My Zurich",
    url: "https://www.zurich.com.sg/customer-support/tools-and-guides/my-zurich",
  },
  moneySenseGeneral: {
    label: "MoneySense Singapore — General insurance",
    url: "https://www.moneysense.gov.sg/introduction-to-general-insurance/",
  },
  moneySenseDocuments: {
    label: "MoneySense Singapore — Insurance documents",
    url: "https://www.moneysense.gov.sg/interpreting-your-insurance-documents/",
  },
  nistRto: {
    label: "NIST — Recovery Time Objective",
    url: "https://csrc.nist.gov/glossary/term/Recovery_Time_Objective",
  },
  nistMfa: {
    label: "NIST — Multi-Factor Authentication",
    url: "https://csrc.nist.gov/glossary/term/Multi_Factor_Authentication",
  },
  nistPrivileged: {
    label: "NIST — Privileged Account",
    url: "https://csrc.nist.gov/glossary/term/privileged_account",
  },
};

export const protectionStateLanguage: Record<
  ProtectionState,
  Omit<GlossaryEntry, "id" | "category">
> = {
  ALIGNED: {
    term: "Evidence aligned",
    plain:
      "The information supplied supports alignment for the specific checks completed.",
    insurance:
      "Available evidence supports alignment across the evaluated exposure and programme-evidence checks.",
    presenter:
      "For the checks we ran, the evidence lines up. This is not a promise that every possible situation is covered.",
    boundary:
      "Do not shorten this to ‘covered’ or treat it as confirmation of coverage.",
  },
  REVIEW_RECOMMENDED: {
    term: "Review recommended",
    plain:
      "A meaningful business change was found and a professional should review the related protection information.",
    insurance:
      "A material exposure change met a configured threshold and should be reviewed against the current insurance programme.",
    presenter:
      "Something important changed, so the system recommends a broker or insurer review.",
    boundary: "This state does not say a gap exists.",
  },
  POTENTIAL_GAP: {
    term: "Potential protection gap",
    plain:
      "Current business records and supplied protection evidence do not appear to line up, so professional confirmation is needed.",
    insurance:
      "Available evidence indicates a plausible exposure-to-protection mismatch that requires broker or insurer confirmation.",
    presenter:
      "The records appear not to match, but the system still asks a professional to confirm the position.",
    boundary:
      "Never describe this as an uncovered loss, coverage denial, or binding coverage conclusion.",
  },
  EVIDENCE_INCOMPLETE: {
    term: "Evidence incomplete",
    plain:
      "Important information is missing, so the system cannot complete this check.",
    insurance:
      "The evidence checklist is incomplete for a material assessment input; no protection conclusion is produced.",
    presenter:
      "The system stops here because it does not have enough information. It tells the user what would resolve that uncertainty.",
    boundary:
      "Missing evidence is not evidence that protection does not exist.",
  },
  EVIDENCE_CONFLICT: {
    term: "Evidence conflict",
    plain:
      "Two or more supplied records disagree on an important fact and a person must resolve the difference.",
    insurance:
      "Material evidence sources contain contradictory facts; chronology and provenance are retained for human resolution.",
    presenter:
      "Instead of silently choosing a number, the system shows the conflict and sends it to a person.",
    boundary:
      "Do not select a preferred fact automatically or hide the contradiction.",
  },
  POLICY_INTERPRETATION_REQUIRED: {
    term: "Policy interpretation required",
    plain:
      "Relevant policy wording was found, but an insurance professional needs to interpret how it applies.",
    insurance:
      "Relevant wording, schedule, or endorsement context exists but is not suitable for an automated coverage conclusion.",
    presenter:
      "The system found the clause; it deliberately does not interpret the legal effect of that clause.",
    boundary: "Do not paraphrase this state as included or excluded.",
  },
  NOT_ASSESSED: {
    term: "Not assessed",
    plain:
      "This issue was outside the available information or the scope of the current check.",
    insurance:
      "No assessment was performed because the required scope, evidence, or rule coverage was unavailable.",
    presenter:
      "The system is being explicit that it did not run this assessment.",
    boundary: "Do not treat an unassessed area as low risk or aligned.",
  },
};

export const reviewStatusLanguage: Record<ReviewStatus, string> = {
  OPEN: "Open",
  REVIEWING: "Professional review in progress",
  DISMISSED: "Dismissed by reviewer",
  MORE_EVIDENCE_REQUESTED: "More evidence requested",
  ESCALATED: "Escalated for specialist review",
  REVIEW_COMPLETED_NO_COVERAGE_DECISION:
    "Review completed — no coverage decision recorded",
};

export const challengeOutcomeLanguage: Record<
  ChallengeResult["outcome"],
  { label: string; plain: string }
> = {
  SURVIVES: {
    label: "Finding remains for review",
    plain:
      "The challenge check did not find supplied evidence that resolved or contradicted the item.",
  },
  CONTRADICTORY_EVIDENCE_FOUND: {
    label: "Contradictory evidence found",
    plain: "The challenge check found material information that conflicts.",
  },
  RESOLVED_DISMISSED: {
    label: "Resolved by additional evidence",
    plain: "Additional supplied evidence resolved the candidate item.",
  },
  INTERPRETATION_REQUIRED: {
    label: "Policy interpretation required",
    plain:
      "Relevant wording was found, but its application requires a qualified professional.",
  },
};

export const reviewCaseStateLanguage: Record<
  ProtectionReviewCase["state"],
  string
> = {
  READY_FOR_PROFESSIONAL_REVIEW: "Ready for professional review",
  EVIDENCE_REQUIRED: "Supporting evidence required",
  NO_ACTIVE_REVIEW: "No active review",
};

export const protectionDomainLanguage: Record<ProtectionDomain, string> = {
  CYBER: "Cyber",
  PROPERTY_ASSETS: "Property and assets",
  SUPPLY_CHAIN: "Supply chain",
  BUSINESS_CONTINUITY: "Business continuity",
};

const stateEntries: GlossaryEntry[] = Object.entries(
  protectionStateLanguage,
).map(([state, language]) => ({
  id: `state-${state.toLowerCase().replaceAll("_", "-")}`,
  category: "Assessment state" as const,
  ...language,
}));

const termEntries: GlossaryEntry[] = [
  {
    id: "protection-drift",
    term: "Protection drift",
    category: "Product concept",
    plain:
      "The distance that can develop between how a business operates now and what its supplied insurance records show.",
    insurance:
      "A material change in exposure that is not yet reconciled with current evidenced protection.",
    presenter:
      "SMEs change every day. Their protection records may not. Protection drift is the gap that develops between the two.",
    boundary:
      "This is a product concept, not a standard insurance coverage term.",
  },
  {
    id: "protection-alignment",
    term: "Protection alignment",
    category: "Product concept",
    plain:
      "How closely the supplied business information supports alignment with the protection records checked.",
    insurance:
      "A deterministic completeness-and-alignment indicator across evaluated exposure and programme-evidence domains.",
    presenter:
      "It is a checklist-based alignment measure, not a risk, underwriting, pricing, or claim score.",
    boundary:
      "Never present the percentage as probability of loss, coverage, or claim acceptance.",
  },
  {
    id: "reconciliation",
    term: "Exposure-to-protection reconciliation",
    category: "Product concept",
    plain:
      "Comparing current business facts with the supplied insurance information.",
    insurance:
      "A deterministic comparison of versioned exposure facts against structured programme evidence.",
    presenter:
      "The system compares what the business is doing now with what the supplied insurance records currently show.",
    boundary:
      "The comparison produces decision support, not a coverage determination.",
  },
  {
    id: "finding",
    term: "Finding",
    category: "Product concept",
    plain: "An item the system has identified for attention or review.",
    insurance:
      "A versioned, rule-traceable assessment output with an explicit state, provenance, challenge result, and review status.",
    presenter:
      "A finding is a review item backed by a rule and source evidence—not an automatic insurance decision.",
    boundary: "A finding cannot confirm or deny coverage by itself.",
  },
  {
    id: "challenge-pass",
    term: "Coverage Challenge Pass",
    category: "Product concept",
    plain:
      "A second check that searches for information that could disprove or resolve a proposed finding.",
    insurance:
      "An adversarial verification step that searches schedules, endorsements, later versions, declarations, and conflicting evidence before a candidate is surfaced.",
    presenter:
      "Before showing an alarming result, the system tries to prove itself wrong.",
    boundary:
      "‘Coverage’ names the context of the challenge; the pass itself does not determine coverage.",
  },
  {
    id: "system-abstention",
    term: "System abstention",
    category: "Product concept",
    plain:
      "The system deliberately leaves an issue unresolved when it cannot support a reliable conclusion.",
    insurance:
      "A controlled non-conclusion caused by insufficient evidence, conflicting evidence, interpretation requirements, or scope limits.",
    presenter: "This is the system saying ‘I do not know’ instead of guessing.",
    boundary:
      "Abstention is not dismissal, confirmation, or a negative coverage conclusion.",
  },
  {
    id: "evidence-provenance",
    term: "Evidence provenance",
    category: "Product concept",
    plain: "The record of exactly where a fact came from.",
    insurance:
      "Source document, version, page, section, excerpt, method, timestamp, confidence, and hash retained for each material fact.",
    presenter:
      "A user can travel from a conclusion back to the exact source and version that supported it.",
    boundary:
      "Provenance shows origin and traceability; it does not make a source correct by itself.",
  },
  {
    id: "evidence-completeness",
    term: "Evidence completeness",
    category: "Product concept",
    plain: "Whether the minimum information needed for a check is available.",
    insurance:
      "Domain-specific satisfaction of required evidence checklist items at the assessment snapshot.",
    presenter:
      "Before comparing anything, the system asks whether it has enough evidence to answer responsibly.",
    boundary: "Complete evidence can still conflict or require interpretation.",
  },
  {
    id: "material-exposure-change",
    term: "Material exposure change",
    category: "Exposure and continuity",
    plain: "A business change large or important enough to deserve review.",
    insurance:
      "An operational change that meets a configured, versioned materiality threshold for an exposure domain.",
    presenter:
      "The rules filter out noise and react only when a configured threshold is met.",
    boundary:
      "Materiality here is a product-rule threshold, not legal materiality or an insurer’s final view.",
  },
  {
    id: "insurance-programme",
    term: "Insurance programme",
    category: "Insurance structure",
    plain:
      "The group of policies, schedules, endorsements, limits, and related insurance documents supplied for review.",
    insurance:
      "The evidenced arrangement of policies and associated documents applying to the organisation for a period.",
    presenter:
      "Programme means the supplied insurance package as a whole, not just one PDF.",
    boundary:
      "Only describe the programme actually evidenced in the assessment snapshot.",
    sourceIds: ["zurichPortal", "moneySenseGeneral"],
  },
  {
    id: "policy-schedule",
    term: "Policy schedule",
    category: "Policy document",
    plain:
      "A document that lists key policy particulars such as the insured, period, limits, locations, or values.",
    insurance:
      "The policy-specific schedule of insured particulars that operates with the policy wording and endorsements.",
    presenter:
      "The wording explains the contract structure; the schedule records the particulars for this policy.",
    boundary:
      "A schedule should not be read without the applicable wording and endorsements.",
    sourceIds: ["moneySenseDocuments"],
  },
  {
    id: "policy-wording",
    term: "Policy wording",
    category: "Policy document",
    plain:
      "The detailed contract terms that explain what the policy says and the rules that apply.",
    insurance:
      "The contractual insuring clauses, definitions, exclusions, conditions, and other provisions, read with the schedule and endorsements.",
    presenter:
      "The system can locate relevant wording, but a professional interprets how it applies.",
    boundary: "Never invent or paraphrase missing policy wording as fact.",
    sourceIds: ["moneySenseDocuments"],
  },
  {
    id: "endorsement",
    term: "Endorsement",
    category: "Policy document",
    plain: "A document that changes or adds to the policy terms or details.",
    insurance:
      "A policy document that modifies, adds, removes, or clarifies wording or scheduled particulars and forms part of the contract.",
    presenter:
      "An endorsement can change the answer, which is why the challenge pass searches for later endorsements.",
    boundary:
      "Confirm the endorsement version, effective date, and policy relationship before relying on it.",
    sourceIds: ["moneySenseDocuments"],
  },
  {
    id: "policy-period",
    term: "Policy period",
    category: "Policy document",
    plain: "The start and end dates shown for the policy.",
    insurance:
      "The stated period during which the policy contract applies, subject to its terms and effective dates.",
    presenter:
      "Dates matter: the system compares what was true at a specific time, not just what is in the latest file.",
    boundary: "Do not infer application to an event from dates alone.",
    sourceIds: ["moneySenseDocuments"],
  },
  {
    id: "sum-insured",
    term: "Sum insured / insured value",
    category: "Insurance structure",
    plain:
      "A value shown in the supplied policy records for an insured item, location, or section.",
    insurance:
      "The stated amount associated with insured property or a policy section, subject to the applicable wording, basis of valuation, limits, and conditions.",
    presenter:
      "The platform compares current asset records with the values shown in the supplied schedule.",
    boundary:
      "Do not equate a recorded value with the amount that would be paid for a loss.",
    sourceIds: ["moneySenseDocuments", "zurichProperty"],
  },
  {
    id: "limit",
    term: "Limit",
    category: "Insurance structure",
    plain:
      "A maximum amount stated for a policy or part of a policy, subject to its terms.",
    insurance:
      "The maximum stated insurer liability for the relevant policy, coverage section, event, occurrence, or aggregate, as defined by the contract.",
    presenter:
      "A limit is a contract figure; the system records it but does not calculate claim payment.",
    boundary: "Never present the limit as a guaranteed payment.",
  },
  {
    id: "sublimit",
    term: "Sublimit",
    category: "Insurance structure",
    plain:
      "A smaller limit that applies to a particular type of loss or part of the policy.",
    insurance:
      "A limit applying within the overall policy limit to a specified coverage, peril, cost, location, or category.",
    presenter:
      "The headline policy limit may not be the only relevant number; a sublimit can apply to a narrower item.",
    boundary:
      "Always link a sublimit to the exact section and wording evidenced.",
  },
  {
    id: "deductible-excess",
    term: "Deductible / excess",
    category: "Insurance structure",
    plain:
      "An amount the insured may need to bear before or alongside the insurer’s payment, as the policy describes.",
    insurance:
      "The contractually stated retained amount or attachment point applicable to a covered loss, section, event, or period.",
    presenter:
      "It is a policy term the platform can extract; its application remains a professional matter.",
    boundary: "Do not calculate a claim outcome from the deductible alone.",
  },
  {
    id: "exclusion",
    term: "Exclusion",
    category: "Insurance structure",
    plain:
      "A policy provision that describes circumstances or types of loss the policy says are not included.",
    insurance:
      "A contractual provision limiting or removing the operation of an insuring clause in specified circumstances.",
    presenter:
      "The system can point to relevant exclusion text; it does not decide whether that exclusion applies to a real event.",
    boundary:
      "Never say ‘excluded’ without the complete applicable wording and professional interpretation.",
  },
  {
    id: "condition",
    term: "Condition",
    category: "Insurance structure",
    plain: "A requirement or rule stated in the policy.",
    insurance:
      "A contractual requirement that may govern operation of the policy, obligations, or entitlement, subject to wording and law.",
    presenter:
      "The platform highlights the condition and requests review; it does not decide the legal effect.",
    boundary: "Do not turn a condition into an automatic coverage outcome.",
  },
  {
    id: "territorial-scope",
    term: "Territorial scope",
    category: "Insurance structure",
    plain:
      "The countries or geographical boundaries described in the supplied policy information.",
    insurance:
      "The territorial parameters stated in the wording, schedule, or endorsement, interpreted with the relevant insuring clauses and jurisdictional provisions.",
    presenter:
      "When the business enters a new country, the system finds the relevant territory wording and routes it for professional interpretation.",
    boundary:
      "Do not infer included or excluded territory from an excerpt alone.",
  },
  {
    id: "property-damage",
    term: "Property damage",
    category: "Exposure and continuity",
    plain: "Physical loss of or damage to property, as the policy defines it.",
    insurance:
      "The property exposure and coverage section relating to insured physical assets, premises, stock, equipment, or machinery, subject to contract terms.",
    presenter:
      "In the demo, locations and asset values are reconciled against the supplied property schedule.",
    boundary: "Use the policy’s own definition for any real assessment.",
    sourceIds: ["zurichProperty"],
  },
  {
    id: "business-interruption",
    term: "Business interruption",
    abbreviation: "BI",
    category: "Exposure and continuity",
    plain:
      "Financial impact when business operations are interrupted after an event described by the policy.",
    insurance:
      "Protection for defined loss of profit, revenue, or increased costs following an insured trigger, subject to the policy basis, period, limits, and conditions.",
    presenter:
      "We treat BI mainly as a consequence layer: what happens to revenue when a critical site, supplier, or system stops working.",
    boundary:
      "A dependency alone does not establish a valid BI claim or insured trigger.",
    sourceIds: ["zurichProperty"],
  },
  {
    id: "indemnity-period",
    term: "Indemnity period",
    category: "Exposure and continuity",
    plain:
      "The period described in the business interruption section for measuring relevant financial loss after an insured event.",
    insurance:
      "The policy-defined period during which covered business interruption loss is measured, subject to the applicable trigger, maximum period, and terms.",
    presenter:
      "It tells reviewers how long the supplied BI structure is intended to respond, not how quickly the business will recover.",
    boundary:
      "Do not confuse indemnity period with the technical Recovery Time Objective.",
    sourceIds: ["zurichProperty"],
  },
  {
    id: "contingent-business-interruption",
    term: "Contingent business interruption",
    abbreviation: "CBI",
    category: "Exposure and continuity",
    plain:
      "Business interruption linked to disruption at an external supplier or customer rather than damage at the SME’s own premises.",
    insurance:
      "Dependency-based business interruption associated with physical damage or another defined trigger at a third party, subject to policy wording and scheduled dependencies.",
    presenter:
      "This is why supplier concentration matters: an outside supplier disruption can interrupt the SME’s own revenue.",
    boundary:
      "The exact trigger and dependency treatment vary by wording; do not assume every supplier is included.",
    sourceIds: ["zurichCbi"],
  },
  {
    id: "dependent-business-income",
    term: "Dependent business income",
    category: "Exposure and continuity",
    plain:
      "Income impact caused by interruption at a business or technology provider the SME depends on.",
    insurance:
      "A cyber or business interruption concept addressing defined income loss arising from interruption at a dependent entity or service provider.",
    presenter:
      "The cyber check asks whether new cloud dependencies are represented in the supplied evidence.",
    boundary:
      "Do not treat the presence of a cloud provider as proof that dependent business income protection applies.",
    sourceIds: ["zurichFinancialLines"],
  },
  {
    id: "supplier-concentration",
    term: "Supplier concentration",
    category: "Exposure and continuity",
    plain:
      "How much the business depends on one supplier for something important.",
    insurance:
      "The proportion of critical input, spend, volume, or revenue dependency concentrated in a supplier or supplier group.",
    presenter:
      "The demo flags a rise from 22% to 54% because that crosses a versioned materiality threshold.",
    boundary: "It is an exposure metric, not an insurance coverage status.",
    sourceIds: ["zurichCbi"],
  },
  {
    id: "recovery-time-objective",
    term: "Recovery Time Objective",
    abbreviation: "RTO",
    category: "Exposure and continuity",
    plain:
      "The target time for restoring a system or process before disruption becomes unacceptable.",
    insurance:
      "The planned maximum recovery duration for a system or process before business or mission impact becomes unacceptable.",
    presenter:
      "RTO is an operational resilience target; it helps explain dependency and recovery exposure.",
    boundary:
      "RTO is not a policy indemnity period or a guaranteed recovery time.",
    sourceIds: ["nistRto"],
  },
  {
    id: "multi-factor-authentication",
    term: "Multi-factor authentication",
    abbreviation: "MFA",
    category: "Cyber control",
    plain:
      "Signing in with more than one different type of proof, such as a password and a phone or security key.",
    insurance:
      "Authentication using factors from more than one distinct factor category, such as knowledge, possession, or inherence.",
    presenter:
      "MFA evidence is one cyber control input; the platform records what was evidenced and when.",
    boundary:
      "Do not infer that MFA is effective everywhere from a single attestation.",
    sourceIds: ["nistMfa"],
  },
  {
    id: "privileged-account",
    term: "Privileged account",
    category: "Cyber control",
    plain:
      "An account with powerful permissions that can make important system changes.",
    insurance:
      "An account authorized to perform security-relevant functions beyond those of a standard user.",
    presenter:
      "Because these accounts can do more damage if compromised, the evidence check treats them separately.",
    boundary:
      "Account inventory does not prove controls are configured or operating effectively.",
    sourceIds: ["nistPrivileged"],
  },
  {
    id: "backup-restore-evidence",
    term: "Backup and restore evidence",
    category: "Cyber control",
    plain:
      "Records showing that important data is backed up and that recovery has been tested.",
    insurance:
      "Versioned evidence of backup scope, isolation, retention, testing, restore outcomes, and ownership for critical systems.",
    presenter:
      "The system asks for evidence of recovery capability, not just a statement that backups exist.",
    boundary:
      "A backup record does not guarantee successful recovery in a future incident.",
    sourceIds: ["zurichCyber"],
  },
  {
    id: "broker",
    term: "Insurance broker",
    category: "Professional role",
    plain:
      "A professional intermediary who helps a client arrange and review insurance with insurers.",
    insurance:
      "An intermediary acting for the client within the applicable mandate and regulatory framework.",
    presenter:
      "The platform prepares evidence so the SME and broker can start the review with a shared set of facts.",
    boundary:
      "The platform does not replace broker advice or communication with the insurer.",
    sourceIds: ["moneySenseGeneral"],
  },
  {
    id: "underwriter",
    term: "Underwriter",
    category: "Professional role",
    plain:
      "An insurer professional who assesses insurance submissions and makes decisions within their authority.",
    insurance:
      "A professional who evaluates risk information and applies insurer appetite, terms, pricing, and delegated authority.",
    presenter:
      "The platform makes the evidence easier to review; it does not perform or replace underwriting.",
    boundary: "Protection Alignment is not an underwriting score.",
  },
  {
    id: "risk-engineer",
    term: "Risk engineer",
    category: "Professional role",
    plain:
      "A specialist who examines how a business operates and recommends ways to reduce risk.",
    insurance:
      "A technical risk professional who assesses hazards, controls, dependencies, and loss-prevention opportunities.",
    presenter:
      "Risk engineers can use the timeline and evidence trail to understand what changed between reviews.",
    boundary:
      "The platform’s rules do not replace a site survey or professional engineering judgement.",
    sourceIds: ["zurichPortal"],
  },
];

export const glossaryEntries = [...stateEntries, ...termEntries];

export const glossaryCategories = Array.from(
  new Set(glossaryEntries.map((entry) => entry.category)),
);

export function stateLabel(state: ProtectionState) {
  return protectionStateLanguage[state].term;
}

export function reviewStatusLabel(status: ReviewStatus) {
  return reviewStatusLanguage[status];
}

export function challengeOutcomeLabel(outcome: ChallengeResult["outcome"]) {
  return challengeOutcomeLanguage[outcome].label;
}

export function reviewCaseStateLabel(state: ProtectionReviewCase["state"]) {
  return reviewCaseStateLanguage[state];
}

export function protectionDomainLabel(domain: ProtectionDomain) {
  return protectionDomainLanguage[domain];
}
