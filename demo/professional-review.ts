import type { InsuranceContextItem } from "@/domain/professional-review/types";

export const PROFESSIONAL_REVIEW_AS_OF = "2026-08-12T16:00:00.000Z";

export const policyProgrammeFixture = {
  programmeId: "programme_pcpl_2026",
  policyId: "policy_pcpl_commercial_2026",
  policyVersionId: "policy_version_pcpl_2026_01",
  namedInsured: "Pacific Components Pte Ltd",
  insurerReference: "SYNTH-PCPL-COMM-2026",
  intermediary: "Synthetic broker record",
  currency: "SGD" as const,
  periodStart: "2026-01-01T00:00:00.000Z",
  periodEnd: "2027-01-01T00:00:00.000Z",
  sections: [
    {
      id: "section_property",
      name: "Commercial property",
      evidenceStatus: "INCOMPLETE" as const,
      limitSummary: "S$500,000 declared assets in the supplied schedule",
      evidenceIds: ["ev_policy_schedule", "ev_property_schedule"],
    },
    {
      id: "section_business_interruption",
      name: "Business interruption",
      evidenceStatus: "INCOMPLETE" as const,
      limitSummary: "12-month indemnity period stated in supplied summary",
      evidenceIds: ["ev_policy_schedule", "ev_financial_summary"],
    },
    {
      id: "section_cyber",
      name: "Cyber",
      evidenceStatus: "INCOMPLETE" as const,
      limitSummary: "S$1,000,000 aggregate limit stated in supplied summary",
      evidenceIds: ["ev_cyber_summary", "ev_infrastructure"],
    },
    {
      id: "section_cargo",
      name: "Cargo and transit",
      evidenceStatus: "STALE" as const,
      limitSummary:
        "Transit evidence supplied; current route confirmation absent",
      evidenceIds: ["ev_policy_schedule", "ev_supplier_register"],
    },
  ],
  endorsements: [
    {
      id: "endorsement_pack_2026",
      number: "SYNTH-END-001",
      effectiveAt: "2026-03-01T00:00:00.000Z",
      appearsToModify: ["Cyber security conditions"],
      interpretationStatus: "NO_RELEVANT_CHANGE_FOUND" as const,
      evidenceId: "ev_endorsements",
    },
  ],
};

export const professionalContextFixture: {
  property: InsuranceContextItem[];
  businessInterruption: InsuranceContextItem[];
  cyber: InsuranceContextItem[];
  supplyChain: InsuranceContextItem[];
  workflow: InsuranceContextItem[];
} = {
  property: [
    {
      id: "property_locations",
      label: "Operating locations",
      value: "2 current locations; 1 appears in the supplied property schedule",
      status: "CHANGED",
      effectiveAt: "2026-07-01T02:00:00.000Z",
      note: "Warehouse B is supported by the synthetic lease and asset register.",
      evidenceIds: ["ev_lease_b", "ev_asset_register", "ev_property_schedule"],
    },
    {
      id: "property_values",
      label: "Assets and equipment",
      value: "S$850,000 observed; S$500,000 evidenced in the supplied schedule",
      status: "CHANGED",
      effectiveAt: "2026-07-03T03:00:00.000Z",
      note: "Values are compared deterministically; adequacy is not determined.",
      evidenceIds: ["ev_asset_register", "ev_property_schedule"],
    },
    {
      id: "property_occupancy",
      label: "Occupancy and operations",
      value:
        "Manufacturing and distribution at Warehouse A; storage and assembly at Warehouse B",
      status: "EVIDENCED",
      note: "The current activity at each site is needed for professional review.",
      evidenceIds: ["ev_lease_b", "ev_asset_register"],
    },
    {
      id: "property_fire_controls",
      label: "Fire and physical controls",
      value:
        "Warehouse A controls described; Warehouse B verification not supplied",
      status: "MISSING",
      note: "A site-control survey or attestation would resolve this evidence item.",
      evidenceIds: ["ev_property_schedule", "ev_lease_b"],
    },
    {
      id: "property_inventory_peak",
      label: "Peak inventory",
      value: "Current and seasonal maximum inventory not established",
      status: "MISSING",
      note: "Book value and peak replacement exposure should not be treated as identical.",
      evidenceIds: ["ev_financial_summary"],
    },
  ],
  businessInterruption: [
    {
      id: "bi_indemnity",
      label: "Recorded indemnity period",
      value: "12 months in the supplied programme schedule",
      status: "EVIDENCED",
      note: "Professional review should compare this period with realistic recovery dependencies.",
      evidenceIds: ["ev_policy_schedule"],
    },
    {
      id: "bi_revenue_dependency",
      label: "Revenue dependency",
      value:
        "Management summary supplied; site-level gross-profit dependency not allocated",
      status: "MISSING",
      note: "Location-level dependency is needed to estimate the consequence of disruption.",
      evidenceIds: ["ev_financial_summary"],
    },
    {
      id: "bi_recovery",
      label: "Recovery objectives",
      value: "RTO and RPO for the warehouse workflow have not been supplied",
      status: "MISSING",
      note: "The platform abstains rather than assuming a recovery duration.",
      evidenceIds: ["ev_infrastructure"],
    },
    {
      id: "bi_dependencies",
      label: "Critical dependencies",
      value:
        "Warehouse A, Warehouse B, one concentrated supplier, and three cloud services",
      status: "CHANGED",
      effectiveAt: "2026-07-14T05:00:00.000Z",
      note: "Business interruption is treated as a consequence and dependency layer.",
      evidenceIds: [
        "ev_asset_register",
        "ev_supplier_register",
        "ev_infrastructure",
      ],
    },
    {
      id: "bi_alternatives",
      label: "Alternative facilities and suppliers",
      value: "No tested alternative-site or supplier recovery plan supplied",
      status: "MISSING",
      note: "This is an evidence deficiency, not evidence that no alternative exists.",
      evidenceIds: ["ev_supplier_register", "ev_lease_b"],
    },
  ],
  cyber: [
    {
      id: "cyber_dependencies",
      label: "Critical cloud dependencies",
      value:
        "3 current dependencies; supplied cyber summary describes the original AWS environment",
      status: "CHANGED",
      effectiveAt: "2026-07-14T05:00:00.000Z",
      note: "The new managed database and warehouse workflow require updated evidence.",
      evidenceIds: ["ev_cyber_summary", "ev_infrastructure"],
    },
    {
      id: "cyber_mfa",
      label: "Multi-factor authentication",
      value:
        "MFA attested for privileged AWS accounts; complete current scope not established",
      status: "MISSING",
      note: "Do not generalize one control statement to every system or user.",
      evidenceIds: ["ev_cyber_summary", "ev_infrastructure"],
    },
    {
      id: "cyber_backups",
      label: "Backups and restoration",
      value:
        "Daily backups stated for the original environment; restoration evidence for new services absent",
      status: "MISSING",
      note: "Backup existence and tested recovery are separate facts.",
      evidenceIds: ["ev_infrastructure"],
    },
    {
      id: "cyber_response",
      label: "Incident response",
      value:
        "Policy summary references notification duties; current response plan not supplied",
      status: "MISSING",
      note: "Policy conditions and operational response evidence remain separate.",
      evidenceIds: ["ev_cyber_summary", "ev_wording"],
    },
  ],
  supplyChain: [
    {
      id: "supply_concentration",
      label: "Critical supplier concentration",
      value: "54% current dependency, increased from 22%",
      status: "CHANGED",
      effectiveAt: "2026-07-10T04:00:00.000Z",
      note: "The configured materiality threshold is exceeded.",
      evidenceIds: ["ev_supplier_register", "ev_financial_summary"],
    },
    {
      id: "supply_geography",
      label: "Supplier geography",
      value:
        "Important overseas dependency recorded; route and territorial evidence require review",
      status: "INTERPRETATION_REQUIRED",
      note: "The system does not infer that the geography is excluded.",
      evidenceIds: ["ev_supplier_register", "ev_wording"],
    },
    {
      id: "supply_alternatives",
      label: "Alternative supplier",
      value:
        "No current qualified alternative is identified in the supplied register",
      status: "MISSING",
      note: "This only describes the supplied evidence set.",
      evidenceIds: ["ev_supplier_register"],
    },
    {
      id: "supply_lead_time",
      label: "Replacement lead time and stock buffer",
      value: "Not supplied",
      status: "MISSING",
      note: "These inputs help evaluate interruption consequences.",
      evidenceIds: ["ev_supplier_register"],
    },
  ],
  workflow: [
    {
      id: "workflow_owner",
      label: "Case owner",
      value: "Unassigned professional reviewer",
      status: "MISSING",
      note: "A named human must own each professional disposition.",
      evidenceIds: [],
    },
    {
      id: "workflow_renewal",
      label: "Recorded policy period end",
      value: "1 January 2027",
      status: "EVIDENCED",
      note: "This date comes from the supplied synthetic policy schedule.",
      evidenceIds: ["ev_policy_schedule"],
    },
    {
      id: "workflow_notification",
      label: "Broker or insurer notification",
      value: "No notification evidence supplied for the July changes",
      status: "MISSING",
      note: "Absence of supplied evidence is not proof that notification did not occur.",
      evidenceIds: [],
    },
    {
      id: "workflow_review",
      label: "Professional disposition",
      value: "Open",
      status: "CHANGED",
      note: "The system supports the decision; a qualified human owns it.",
      evidenceIds: [],
    },
  ],
};
