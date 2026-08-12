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
import { brand } from "@/domain/brand";

export default function ReportsPage() {
  const { assessment, eventIds, reviews } = useDemo();
  const reviewQuery = Object.entries(reviews)
    .map(([findingId, review]) => `${findingId}:${review.status}`)
    .join(",");
  const reportUrl = `/api/reports/${assessment.id}?events=${encodeURIComponent(eventIds.join(","))}&reviews=${encodeURIComponent(reviewQuery)}`;
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Reports and receipts"
        title="Protection Alignment Report"
        description="A professional, source-grounded assessment artifact for SME, broker, insurer and audit review."
        actions={
          <a
            className="button primary"
            href={reportUrl}
            data-testid="download-report"
          >
            <Download size={16} /> Download PDF
          </a>
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
            <p className="eyebrow">Executive Summary</p>
            <h2>
              {assessment.appliedEventIds.length} material changes assessed
            </h2>
            <p>
              {assessment.findings.length
                ? `${assessment.findings.length} items require attention across the supplied evidence. The system preserved uncertainty where current evidence was insufficient or required professional interpretation.`
                : "Available evidence supports current protection alignment for the evaluated baseline scope."}
            </p>
            <div className="report-alignment">
              <strong>{assessment.alignment}%</strong>
              <span>evidence-aligned</span>
              <i>
                <b style={{ width: `${assessment.alignment}%` }} />
              </i>
            </div>
          </section>
          <section>
            <p className="eyebrow">Current protection alignment</p>
            <div className="report-domain-list">
              {assessment.domains.map((domain) => (
                <div key={domain.domain}>
                  <strong>{domain.domain.replaceAll("_", " ")}</strong>
                  <StatusBadge state={domain.state} compact />
                </div>
              ))}
            </div>
          </section>
          <section>
            <p className="eyebrow">Material findings</p>
            {assessment.findings.length ? (
              assessment.findings.slice(0, 3).map((finding) => (
                <div className="mini-finding" key={finding.id}>
                  <strong>{finding.title}</strong>
                  <span>{finding.simpleExplanation}</span>
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
            Report ID report_{assessment.id} · Assessment v{assessment.version}{" "}
            · Ruleset {assessment.rulesetVersion}
          </footer>
        </article>
        <aside className="report-aside">
          <div className="sticky-card report-card">
            <FileText size={22} />
            <h2>Assessment v{assessment.version}</h2>
            <p>
              Generated from the current synthetic evidence and event snapshot.
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
              <strong>Assessment Receipt</strong>
              <span>{assessment.receiptHash}</span>
            </div>
          </div>
          <div className="receipt-panel">
            <FileCheck2 size={18} />
            <div>
              <strong>Evidence Snapshot</strong>
              <span>{assessment.evidenceSnapshotId}</span>
            </div>
          </div>
          <div className="receipt-panel">
            <ShieldCheck size={18} />
            <div>
              <strong>Human review</strong>
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
