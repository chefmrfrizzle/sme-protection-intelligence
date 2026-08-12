"use client";

import {
  CheckCircle2,
  ChevronDown,
  FileText,
  Hash,
  Link2,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useDemo } from "@/components/demo-provider";
import { ViewLens } from "@/components/view-lens";
import { evidenceArtifacts } from "@/demo/evidence";

const typeLabels: Record<string, string> = {
  POLICY_SCHEDULE: "Policy schedule",
  PROPERTY_SCHEDULE: "Property schedule",
  CYBER_SUMMARY: "Cyber summary",
  POLICY_WORDING: "Policy wording",
  ENDORSEMENT: "Endorsement",
  LEASE: "Lease",
  ASSET_REGISTER: "Asset register",
  SUPPLIER_REGISTER: "Supplier register",
  FINANCIAL_SUMMARY: "Financial summary",
  INFRASTRUCTURE_INVENTORY: "Infrastructure inventory",
};

export default function EvidencePage() {
  const { lens } = useDemo();
  const summaryLabels = {
    simple: [
      "Documents provided",
      "Ready to use",
      "Files needing attention",
      "How they were read",
    ],
    insurance: [
      "Programme artifacts",
      "Validated",
      "Ingestion exceptions",
      "Extraction mode",
    ],
    evidence: [
      "Artifacts supplied",
      "Schema validated",
      "Unresolved ingestion errors",
      "Extraction mode",
    ],
  }[lens];
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Evidence register"
        title="Evidence"
        description={
          lens === "simple"
            ? "The documents and records used to review your current protection."
            : lens === "insurance"
              ? "Policy and business records used in the current protection assessment."
              : "Validated synthetic artifacts with direct provenance from extracted fact to source excerpt."
        }
        actions={
          <div className="button-row page-control-row">
            <ViewLens />
            <div className="synthetic-pill">
              <ShieldCheck size={14} /> 10 synthetic artifacts
            </div>
          </div>
        }
      />
      <div className="evidence-summary-grid">
        <article>
          <strong>10</strong>
          <span>{summaryLabels[0]}</span>
        </article>
        <article>
          <strong>10</strong>
          <span>{summaryLabels[1]}</span>
        </article>
        <article>
          <strong>0</strong>
          <span>{summaryLabels[2]}</span>
        </article>
        <article>
          <strong>{lens === "simple" ? "Saved demo" : "Replay"}</strong>
          <span>{summaryLabels[3]}</span>
        </article>
      </div>
      <section className="evidence-register">
        {evidenceArtifacts.map((artifact) => (
          <details
            className="evidence-document"
            id={artifact.id}
            key={artifact.id}
          >
            <summary>
              <span className="document-icon">
                <FileText size={19} />
              </span>
              <div className="document-title">
                <strong>{artifact.title}</strong>
                <span>{artifact.fileName}</span>
              </div>
              <span className="document-type">
                {typeLabels[artifact.documentType]}
              </span>
              <span className="validated">
                <CheckCircle2 size={14} /> Validated
              </span>
              <ChevronDown className="summary-chevron" size={17} />
            </summary>
            <div className="document-body">
              <div className="provenance-strip">
                <span>
                  <Hash size={13} />
                  {lens === "simple" ? "File fingerprint" : "Source hash"}:{" "}
                  {artifact.sourceHash}
                </span>
                <span>Version {artifact.version}</span>
                <span>
                  Issued{" "}
                  {new Date(artifact.issuedAt).toLocaleDateString("en-SG", {
                    dateStyle: "medium",
                  })}
                </span>
                <span>
                  {lens === "simple"
                    ? "Validated for this demo"
                    : lens === "insurance"
                      ? "Replay validated"
                      : "Replay validated · parser 1.3.0"}
                </span>
              </div>
              {artifact.pages.map((page) => (
                <article className="source-page" key={page.page}>
                  <div>
                    <span>Page {page.page}</span>
                    <strong>{page.heading}</strong>
                  </div>
                  <p>{page.body}</p>
                  <span className="source-grounded">
                    <Link2 size={13} />
                    {lens === "simple"
                      ? "Used in assessment"
                      : lens === "insurance"
                        ? "Relevant evidence"
                        : "Source-grounded excerpt"}
                  </span>
                </article>
              ))}
            </div>
          </details>
        ))}
      </section>
    </div>
  );
}
