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
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Evidence register"
        title="Evidence"
        description="Validated synthetic artifacts with direct provenance from extracted fact to source excerpt."
        actions={
          <div className="synthetic-pill">
            <ShieldCheck size={14} /> 10 synthetic artifacts
          </div>
        }
      />
      <div className="evidence-summary-grid">
        <article>
          <strong>10</strong>
          <span>Artifacts supplied</span>
        </article>
        <article>
          <strong>10</strong>
          <span>Validated</span>
        </article>
        <article>
          <strong>0</strong>
          <span>Unresolved ingestion errors</span>
        </article>
        <article>
          <strong>Replay</strong>
          <span>Extraction mode</span>
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
                  <Hash size={13} /> {artifact.sourceHash}
                </span>
                <span>Version {artifact.version}</span>
                <span>
                  Issued{" "}
                  {new Date(artifact.issuedAt).toLocaleDateString("en-SG", {
                    dateStyle: "medium",
                  })}
                </span>
                <span>Replay validated · parser 1.3.0</span>
              </div>
              {artifact.pages.map((page) => (
                <article className="source-page" key={page.page}>
                  <div>
                    <span>Page {page.page}</span>
                    <strong>{page.heading}</strong>
                  </div>
                  <p>{page.body}</p>
                  <span className="source-grounded">
                    <Link2 size={13} /> Source-grounded excerpt
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
