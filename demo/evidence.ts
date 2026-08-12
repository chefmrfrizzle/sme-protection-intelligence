import { EvidenceArtifactSchema } from "@/domain/schemas";
import type { EvidenceArtifact, SourceReference } from "@/domain/types";
import { DEMO_ORGANIZATION_ID } from "./company";

const artifacts: EvidenceArtifact[] = [
  {
    id: "ev_policy_schedule",
    organizationId: DEMO_ORGANIZATION_ID,
    title: "Commercial Programme Policy Schedule",
    fileName: "PCPL_Commercial_Programme_Schedule_2026.pdf",
    documentType: "POLICY_SCHEDULE",
    version: "1.0",
    issuedAt: "2026-01-03T00:00:00.000Z",
    validFrom: "2026-01-01T00:00:00.000Z",
    validTo: "2026-12-31T15:59:59.000Z",
    sourceHash: "sha256-demo-policy-schedule-7a14",
    synthetic: true,
    pages: [
      {
        page: 1,
        heading: "Policy particulars",
        body: "Synthetic document. Insured: Pacific Components Pte Ltd. Policy period: 1 January 2026 to 31 December 2026. Sections supplied: Property Damage, Business Interruption, Cyber and Transit.",
      },
      {
        page: 2,
        heading: "Locations and limits",
        body: "Location A: 18 Tuas South Avenue 8, Singapore 637369. Property declared value S$500,000. Business interruption gross profit limit S$1,200,000. Indemnity period 12 months.",
      },
    ],
  },
  {
    id: "ev_property_schedule",
    organizationId: DEMO_ORGANIZATION_ID,
    title: "Property Location and Values Schedule",
    fileName: "PCPL_Property_Schedule_2026.pdf",
    documentType: "PROPERTY_SCHEDULE",
    version: "1.0",
    issuedAt: "2026-01-03T00:00:00.000Z",
    validFrom: "2026-01-01T00:00:00.000Z",
    validTo: "2026-12-31T15:59:59.000Z",
    sourceHash: "sha256-demo-property-schedule-129e",
    synthetic: true,
    pages: [
      {
        page: 1,
        heading: "Declared locations",
        body: "Premises 1 / Location A only: 18 Tuas South Avenue 8, Singapore 637369. Occupancy: manufacturing and distribution. Construction: reinforced concrete.",
      },
      {
        page: 2,
        heading: "Declared values",
        body: "Plant and machinery S$320,000; stock S$130,000; contents S$50,000. Total declared value: S$500,000.",
      },
    ],
  },
  {
    id: "ev_cyber_summary",
    organizationId: DEMO_ORGANIZATION_ID,
    title: "Cyber Policy Summary",
    fileName: "PCPL_Cyber_Summary_2026.pdf",
    documentType: "CYBER_SUMMARY",
    version: "1.0",
    issuedAt: "2026-01-03T00:00:00.000Z",
    validFrom: "2026-01-01T00:00:00.000Z",
    validTo: "2026-12-31T15:59:59.000Z",
    sourceHash: "sha256-demo-cyber-summary-955b",
    synthetic: true,
    pages: [
      {
        page: 1,
        heading: "Cyber risk information",
        body: "Primary production planning service hosted on AWS Singapore. MFA is attested for privileged accounts. Daily encrypted backup with quarterly restore test. Cyber aggregate limit S$1,000,000; deductible S$10,000.",
      },
      {
        page: 2,
        heading: "Technology dependency declaration",
        body: "Declared critical external technology dependency: AWS Singapore production environment. No current dependency schedule or later cloud service declaration was supplied with this summary.",
      },
    ],
  },
  {
    id: "ev_wording",
    organizationId: DEMO_ORGANIZATION_ID,
    title: "Selected Commercial Policy Wording",
    fileName: "PCPL_Selected_Wording_2026.pdf",
    documentType: "POLICY_WORDING",
    version: "1.0",
    issuedAt: "2026-01-03T00:00:00.000Z",
    validFrom: "2026-01-01T00:00:00.000Z",
    sourceHash: "sha256-demo-wording-a309",
    synthetic: true,
    pages: [
      {
        page: 14,
        heading: "Territorial scope - selected excerpt",
        body: "Subject to the schedule and applicable endorsements, certain insured events occurring in Singapore and elsewhere may be considered under the relevant section. This synthetic excerpt is intentionally insufficient for automated interpretation and must be read with the complete wording and schedule.",
      },
      {
        page: 31,
        heading: "Property descriptions - selected excerpt",
        body: "Property terms are subject to premises, interests and values shown in the schedule, together with applicable extensions and endorsements. Professional interpretation may be required.",
      },
    ],
  },
  {
    id: "ev_endorsements",
    organizationId: DEMO_ORGANIZATION_ID,
    title: "Endorsement Pack",
    fileName: "PCPL_Endorsements_2026.pdf",
    documentType: "ENDORSEMENT",
    version: "1.0",
    issuedAt: "2026-02-10T00:00:00.000Z",
    validFrom: "2026-02-10T00:00:00.000Z",
    sourceHash: "sha256-demo-endorsements-c14e",
    synthetic: true,
    pages: [
      {
        page: 1,
        heading: "Endorsement index",
        body: "Endorsement 1: revised machinery deductible. Endorsement 2: backup restoration condition. No endorsement naming Location B appears in this supplied pack.",
      },
      {
        page: 3,
        heading: "Machinery deductible",
        body: "Machinery breakdown deductible amended to S$5,000 for the scheduled premises. All other terms remain subject to the policy wording and schedule.",
      },
    ],
  },
  {
    id: "ev_lease_b",
    organizationId: DEMO_ORGANIZATION_ID,
    title: "Warehouse B Lease Agreement",
    fileName: "PCPL_Warehouse_B_Lease_SYNTHETIC.pdf",
    documentType: "LEASE",
    version: "1.0",
    issuedAt: "2026-06-20T00:00:00.000Z",
    validFrom: "2026-07-01T00:00:00.000Z",
    validTo: "2028-06-30T15:59:59.000Z",
    sourceHash: "sha256-demo-lease-b-920d",
    synthetic: true,
    pages: [
      {
        page: 1,
        heading: "Parties and premises",
        body: "Synthetic lease between Demo Industrial Landlord Pte Ltd and Pacific Components Pte Ltd for Warehouse B, 71 Pioneer Sector Walk, Singapore 627876.",
      },
      {
        page: 4,
        heading: "Term and permitted use",
        body: "Term commences 1 July 2026. Permitted use: storage, light assembly and distribution of precision components. Tenant access is exclusive during the lease term.",
      },
    ],
  },
  {
    id: "ev_asset_register",
    organizationId: DEMO_ORGANIZATION_ID,
    title: "Fixed Asset Register",
    fileName: "PCPL_Asset_Register_2026-07.xlsx",
    documentType: "ASSET_REGISTER",
    version: "2026.07",
    issuedAt: "2026-07-03T00:00:00.000Z",
    validFrom: "2026-07-03T00:00:00.000Z",
    sourceHash: "sha256-demo-assets-july-b013",
    synthetic: true,
    pages: [
      {
        page: 1,
        heading: "Asset summary",
        body: "Location A net replacement-value proxy: S$500,000. Warehouse B racking, test equipment, forklifts and inventory-handling equipment: S$350,000. Combined observed asset value: S$850,000.",
      },
      {
        page: 2,
        heading: "Warehouse B additions",
        body: "Automated test bench S$180,000; racking S$70,000; forklifts S$65,000; handling equipment S$35,000. All values and entities are synthetic.",
      },
    ],
  },
  {
    id: "ev_supplier_register",
    organizationId: DEMO_ORGANIZATION_ID,
    title: "Critical Supplier Register",
    fileName: "PCPL_Supplier_Register_2026-Q3.xlsx",
    documentType: "SUPPLIER_REGISTER",
    version: "2026.Q3",
    issuedAt: "2026-07-10T00:00:00.000Z",
    validFrom: "2026-07-10T00:00:00.000Z",
    sourceHash: "sha256-demo-suppliers-q3-f1b0",
    synthetic: true,
    pages: [
      {
        page: 1,
        heading: "Critical component suppliers",
        body: "Synthetic supplier data. Hai Phong Precision Co supplies 54% of controller assemblies, up from 22%. Lead time 8 weeks. Current qualified alternatives: one, subject to capacity validation.",
      },
    ],
  },
  {
    id: "ev_financial_summary",
    organizationId: DEMO_ORGANIZATION_ID,
    title: "Management Financial Summary",
    fileName: "PCPL_Management_Accounts_2026-Q2.pdf",
    documentType: "FINANCIAL_SUMMARY",
    version: "2026.Q2",
    issuedAt: "2026-06-30T00:00:00.000Z",
    validFrom: "2026-04-01T00:00:00.000Z",
    sourceHash: "sha256-demo-financial-q2-510c",
    synthetic: true,
    pages: [
      {
        page: 1,
        heading: "Management summary",
        body: "Synthetic annualised revenue S$4.8m; annualised gross profit S$1.15m. Location A and the production planning platform are recorded as critical to order fulfilment.",
      },
    ],
  },
  {
    id: "ev_infrastructure",
    organizationId: DEMO_ORGANIZATION_ID,
    title: "Infrastructure Inventory",
    fileName: "PCPL_Infrastructure_Inventory_2026-07.pdf",
    documentType: "INFRASTRUCTURE_INVENTORY",
    version: "2026.07",
    issuedAt: "2026-07-14T00:00:00.000Z",
    validFrom: "2026-07-14T00:00:00.000Z",
    sourceHash: "sha256-demo-infra-july-64cd",
    synthetic: true,
    pages: [
      {
        page: 1,
        heading: "Critical services",
        body: "AWS Singapore remains the production host. A new managed database and a separate cloud-based warehouse workflow are now designated mission-critical, increasing critical external cloud dependencies from one to three.",
      },
      {
        page: 2,
        heading: "Control evidence status",
        body: "MFA evidence is current for AWS privileged access. Backup evidence for the managed database and warehouse workflow was not supplied. No updated technology dependency declaration was supplied.",
      },
    ],
  },
];

export const evidenceArtifacts =
  EvidenceArtifactSchema.array().parse(artifacts);

export const evidenceById = new Map(
  evidenceArtifacts.map((artifact) => [artifact.id, artifact]),
);

export function sourceRef(
  documentId: string,
  page: number,
  section: string,
  snippet: string,
): SourceReference {
  const artifact = evidenceById.get(documentId);
  if (!artifact) throw new Error(`Unknown evidence artifact: ${documentId}`);
  return {
    documentId,
    fileName: artifact.fileName,
    documentVersion: artifact.version,
    page,
    section,
    snippet,
    extractionTimestamp: "2026-07-21T09:02:00.000Z",
    extractionMethod: "replay_validated",
    modelVersion: "replay-fixture-2026.08",
    parserVersion: "parser-1.3.0",
    confidence: 0.99,
    sourceHash: artifact.sourceHash,
  };
}
