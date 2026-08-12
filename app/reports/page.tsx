"use client";

import {
  Download,
  FileCheck2,
  FileText,
  Fingerprint,
  ShieldCheck,
} from "lucide-react";
import { Disclaimer } from "@/components/disclaimer";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { useDemo } from "@/components/demo-provider";
import { ViewLens } from "@/components/view-lens";
import { brand } from "@/domain/brand";

export default function ReportsPage() {
  const { assessment, eventIds, reviews, lens } = useDemo();
  const reviewQuery = Object.entries(reviews)
    .map(([findingId, review]) => `${findingId}:${review.status}`)
    .join(",");
  const reportUrl = `/api/reports/${assessment.id}?events=${encodeURIComponent(eventIds.join(","))}&reviews=${encodeURIComponent(reviewQuery)}`;
  const reportCopy = {
    simple: {
      summaryLabel: "At a glance",
      summaryTitle: `${assessment.appliedEventIds.length} business changes reviewed`,
      summary:
        assessment.findings.length > 0
          ? `${assessment.findings.length} ${assessment.findings.length === 1 ? "item needs" : "items need"} attention. The report explains what changed, why it matters and what to do next.`
          : "The information supplied matches the evaluated baseline areas. No selected change currently needs review.",
      domainLabel: "Areas checked",
      findingLabel: "What needs attention",
    },
    insurance: {
      summaryLabel: "Executive summary",
      summaryTitle: `${assessment.appliedEventIds.length} material exposure changes assessed`,
      summary:
        assessment.findings.length > 0
          ? `${assessment.findings.length} review items were produced across the supplied programme evidence. Uncertainty is preserved where evidence is incomplete or policy interpretation is required.`
          : "Available evidence supports current protection alignment for the evaluated baseline scope.",
      domainLabel: "Protection state register",
      findingLabel: "Material findings",
    },
    evidence: {
      summaryLabel: "Reproducibility summary",
      summaryTitle: `Assessment v${assessment.version} is source-linked and versioned`,
      summary: `${assessment.findings.length} review items were generated from evidence snapshot ${assessment.evidenceSnapshotId} using ruleset ${assessment.rulesetVersion}.`,
      domainLabel: "Evidence and audit basis",
      findingLabel: "Finding provenance",
    },
  }[lens];
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Reports and receipts"
        title="Protection Alignment Report"
        description={
          lens === "simple"
            ? "A shareable summary of what changed, what needs attention and what information was used."
            : lens === "insurance"
              ? "A professional assessment artifact for SME, broker and insurer review."
              : "A source-grounded, versioned assessment artifact with evidence and audit receipts."
        }
        actions={
          <div className="button-row page-control-row">
            <ViewLens />
            <a
              className="button primary"
              href={reportUrl}
              data-testid="download-report"
            >
              <Download size={16} /> Download PDF
            </a>
          </div>
        }
      />
      <div className="report-layout">
        <article className="report-preview">
          <header>
            <div>
              <span>{brand.wordmark}</span>
              <strong>{brand.reportTitle}</strong>
              <small>{demoCompanyName}</small>
            </div>
            <span className="synthetic-watermark">SYNTHETIC</span>
          </header>
          <section>
            <p className="eyebrow">{reportCopy.summaryLabel}</p>
            <h2>{reportCopy.summaryTitle}</h2>
            <p>{reportCopy.summary}</p>
            <div className="report-alignment">
              <strong>{assessment.alignment}%</strong>
              <span>
                {lens === "simple" ? "information aligned" : "evidence-aligned"}
              </span>
              <i>
                <b style={{ width: `${assessment.alignment}%` }} />
              </i>
            </div>
          </section>
          <section>
            <p className="eyebrow">{reportCopy.domainLabel}</p>
            {lens === "evidence" ? (
              <div className="report-evidence-grid">
                <div>
                  <span>Evidence snapshot</span>
                  <strong>{assessment.evidenceSnapshotId}</strong>
                </div>
                <div>
                  <span>Ruleset</span>
                  <strong>{assessment.rulesetVersion}</strong>
                </div>
                <div>
                  <span>Assessment receipt</span>
                  <strong>{assessment.receiptHash}</strong>
                </div>
                <div>
                  <span>Audit events</span>
                  <strong>{assessment.auditEvents.length}</strong>
                </div>
              </div>
            ) : (
              <div className="report-domain-list">
                {assessment.domains.map((domain) => (
                  <div key={domain.domain}>
                    <strong>{domain.domain.replaceAll("_", " ")}</strong>
                    <StatusBadge state={domain.state} compact />
                  </div>
                ))}
              </div>
            )}
          </section>
          <section>
            <p className="eyebrow">{reportCopy.findingLabel}</p>
            {assessment.findings.length ? (
              assessment.findings.slice(0, 3).map((finding) => (
                <div className="mini-finding" key={finding.id}>
                  <strong>{finding.title}</strong>
                  <span>
                    {lens === "simple"
                      ? finding.simpleExplanation
                      : lens === "insurance"
                        ? finding.insuranceExplanation
                        : `${finding.evidenceIds.length} linked artifacts · ${finding.ruleTrace.ruleId} v${finding.ruleTrace.ruleVersion} · Challenge ${finding.challenge.outcome.replaceAll("_", " ")}`}
                  </span>
                </div>
              ))
            ) : (
              <div className="mini-finding">
                <strong>No material drift in baseline</strong>
                <span>
                  Apply a synthetic business change to populate this section.
                </span>
              </div>
            )}
          </section>
          <footer>
            {lens === "simple"
              ? `Report for ${demoCompanyName} · Assessment v${assessment.version}`
              : `Report ID report_${assessment.id} · Assessment v${assessment.version} · Ruleset ${assessment.rulesetVersion}`}
          </footer>
        </article>
        <aside className="report-aside">
          <div className="sticky-card report-card">
            <FileText size={22} />
            <h2>Assessment v{assessment.version}</h2>
            <p>
              {lens === "simple"
                ? "Built from the current demo documents and selected business changes."
                : lens === "insurance"
                  ? "Generated from the current synthetic exposure and programme-evidence snapshot."
                  : "Generated from the versioned synthetic evidence and canonical-event snapshot."}
            </p>
            <dl>
              <div>
                <dt>Pages</dt>
                <dd>3+</dd>
              </div>
              <div>
                <dt>Evidence artifacts</dt>
                <dd>10</dd>
              </div>
              <div>
                <dt>Findings</dt>
                <dd>{assessment.findings.length}</dd>
              </div>
              <div>
                <dt>Ruleset</dt>
                <dd>{assessment.rulesetVersion}</dd>
              </div>
            </dl>
            <a className="button primary full" href={reportUrl}>
              <Download size={16} /> Download PDF
            </a>
          </div>
          <div className="receipt-panel">
            <Fingerprint size={18} />
            <div>
              <strong>
                {lens === "simple" ? "Report tracking" : "Assessment receipt"}
              </strong>
              <span>
                {lens === "evidence"
                  ? assessment.receiptHash
                  : "Included with the PDF"}
              </span>
            </div>
          </div>
          <div className="receipt-panel">
            <FileCheck2 size={18} />
            <div>
              <strong>
                {lens === "simple" ? "Information set" : "Evidence snapshot"}
              </strong>
              <span>
                {lens === "evidence"
                  ? assessment.evidenceSnapshotId
                  : "Versioned and recorded"}
              </span>
            </div>
          </div>
          <div className="receipt-panel">
            <ShieldCheck size={18} />
            <div>
              <strong>
                {lens === "simple" ? "Review status" : "Human review"}
              </strong>
              <span>
                {assessment.findings.some(
                  (finding) => finding.reviewStatus !== "OPEN",
                )
                  ? "In progress"
                  : "Open / unassigned"}
              </span>
            </div>
          </div>
        </aside>
      </div>
      <Disclaimer />
    </div>
  );
}

const demoCompanyName = "Pacific Components Pte Ltd";
