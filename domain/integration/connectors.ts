import type { ConnectorCapability } from "../professional-review/types";

export const futureConnectorCapabilities: ConnectorCapability[] = [
  {
    id: "connector_zurich_policy",
    provider: "Zurich eXchange",
    name: "Policy - My Zurich Connector",
    direction: "INBOUND",
    status: "ACCESS_REQUIRED",
    dataClasses: ["policy", "policy version", "policy values"],
    purpose:
      "Import approved commercial policy information into the insurer-neutral evidence model.",
    safetyBoundary:
      "No credentials are configured. Access and field mapping require Zurich approval.",
  },
  {
    id: "connector_zurich_exposure",
    provider: "Zurich eXchange",
    name: "Exposure - My Zurich Connector",
    direction: "BIDIRECTIONAL",
    status: "ACCESS_REQUIRED",
    dataClasses: ["locations", "property exposure", "statement of values"],
    purpose:
      "Map validated location and value changes after professional approval.",
    safetyBoundary:
      "Outbound transmission is disabled and would require explicit human approval.",
  },
  {
    id: "connector_zurich_risk_engineering",
    provider: "Zurich eXchange",
    name: "Risk Engineering - My Zurich Connector",
    direction: "INBOUND",
    status: "ACCESS_REQUIRED",
    dataClasses: ["locations", "risk engineering", "recommendations"],
    purpose:
      "Import approved location risk-engineering information as source evidence.",
    safetyBoundary:
      "Imported records remain evidence and cannot directly determine a finding.",
  },
  {
    id: "connector_zurich_documents",
    provider: "Zurich eXchange",
    name: "Documents - My Zurich Connector",
    direction: "INBOUND",
    status: "ACCESS_REQUIRED",
    dataClasses: ["policy documents", "schedules", "endorsements"],
    purpose:
      "Import approved commercial-insurance documents as versioned source evidence.",
    safetyBoundary:
      "Documents remain immutable source artifacts; access requires Zurich approval and tenant consent.",
  },
  {
    id: "connector_zurich_submission",
    provider: "Zurich eXchange",
    name: "Submission - My Zurich Connector",
    direction: "OUTBOUND",
    status: "ACCESS_REQUIRED",
    dataClasses: ["renewal submission", "exposure values"],
    purpose:
      "Prepare a broker-approved renewal package from the neutral review contract.",
    safetyBoundary:
      "The demo creates a preview only; it does not submit, quote, bind, or amend insurance.",
  },
  {
    id: "connector_xero",
    provider: "Xero",
    name: "Accounting and Assets",
    direction: "INBOUND",
    status: "FUTURE",
    dataClasses: ["invoices", "suppliers", "assets", "financial reports"],
    purpose:
      "Observe material operating changes through a consented read-only connection.",
    safetyBoundary:
      "Only minimum required fields would be imported through the canonical event schema.",
  },
  {
    id: "connector_quickbooks",
    provider: "QuickBooks Online",
    name: "Accounting",
    direction: "INBOUND",
    status: "FUTURE",
    dataClasses: ["vendors", "bills", "inventory", "reports"],
    purpose: "Provide an alternative accounting source to Xero.",
    safetyBoundary:
      "A tenant selects one accounting source; the connector remains read-only by default.",
  },
  {
    id: "connector_cloud",
    provider: "Cloud inventory",
    name: "AWS Config / Microsoft Graph",
    direction: "INBOUND",
    status: "FUTURE",
    dataClasses: ["cloud resources", "backups", "devices", "dependencies"],
    purpose:
      "Supply current infrastructure facts for cyber and business-interruption assessments.",
    safetyBoundary:
      "Use least-privilege inventory permissions; never change cloud configuration.",
  },
  {
    id: "connector_documents",
    provider: "Document sources",
    name: "Google Drive / SharePoint",
    direction: "INBOUND",
    status: "FUTURE",
    dataClasses: ["policy documents", "leases", "registers", "endorsements"],
    purpose: "Detect approved document additions and version changes.",
    safetyBoundary:
      "Folder-scoped read access only; original files remain unmodified.",
  },
];
