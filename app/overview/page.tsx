"use client";

import Link from "next/link";
import {
  ArrowRight,
  FileQuestion,
  Info,
  RotateCcw,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { AlignmentRing } from "@/components/alignment-ring";
import { Disclaimer } from "@/components/disclaimer";
import { DomainCard } from "@/components/domain-card";
import { PageHeader } from "@/components/page-header";
import { ProtectionDiff } from "@/components/protection-diff";
import { useDemo } from "@/components/demo-provider";
import { demoCompany } from "@/demo/company";

export default function OverviewPage() {
  const { assessment, eventIds, applyEvent, reset } = useDemo();
  const reviewCount = assessment.findings.filter(
    (finding) => finding.state !== "ALIGNED",
  ).length;
  const evidenceNeeded = assessment.findings.reduce(
    (total, finding) => total + finding.missingEvidence.length,
    0,
  );
  const hasWarehouse = eventIds.includes("event_new_warehouse");

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Your Protection"
        title={demoCompany.name}
        description={`Last reconciled: ${new Date(
          assessment.snapshotAt,
        ).toLocaleString("en-SG", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "Asia/Singapore",
        })} SGT`}
        actions={
          <button className="button secondary" type="button" onClick={reset}>
            <RotateCcw aria-hidden="true" size={16} /> Reset demo
          </button>
        }
      />

      <section className="hero-grid" aria-label="Protection summary">
        <article className="alignment-card">
          <div className="alignment-copy">
            <p className="eyebrow">Protection Alignment</p>
            <h2>{assessment.alignment}% evidence-aligned</h2>
            <p>
              Deterministic completeness and alignment across four evaluated
              protection domains.
            </p>
            <details className="methodology-details">
              <summary>
                <Info aria-hidden="true" size={14} /> How this is calculated
              </summary>
              <p>
                60% explicit alignment state and 40% required-evidence
                completeness, averaged across in-scope domains. It is not an
                underwriting, loss, pricing, claim, or insurer score.
              </p>
            </details>
          </div>
          <AlignmentRing value={assessment.alignment} />
        </article>

        <div className="metric-grid compact-metrics">
          <article className="metric-card">
            <span className="metric-icon neutral">
              <Sparkles aria-hidden="true" size={18} />
            </span>
            <div>
              <strong>{eventIds.length}</strong>
              <span>Material changes</span>
            </div>
          </article>
          <article className="metric-card">
            <span className="metric-icon warning">
              <TriangleAlert aria-hidden="true" size={18} />
            </span>
            <div>
              <strong>{reviewCount}</strong>
              <span>Items requiring review</span>
            </div>
          </article>
          <article className="metric-card">
            <span className="metric-icon muted">
              <FileQuestion aria-hidden="true" size={18} />
            </span>
            <div>
              <strong>{evidenceNeeded}</strong>
              <span>Evidence requests</span>
            </div>
          </article>
          <article className="metric-card version-card">
            <div>
              <strong>v{assessment.version}</strong>
              <span>Assessment version</span>
            </div>
          </article>
        </div>
      </section>

      {!hasWarehouse ? (
        <section className="storyline-callout">
          <div className="callout-icon">
            <Sparkles aria-hidden="true" size={20} />
          </div>
          <div>
            <p className="eyebrow">Demo storyline ready</p>
            <h2>Pacific Components has opened a second warehouse</h2>
            <p>
              Apply the synthetic change to compare current operations with the
              supplied programme evidence.
            </p>
          </div>
          <button
            className="button primary"
            type="button"
            onClick={() => applyEvent("event_new_warehouse")}
            data-testid="trigger-warehouse"
          >
            Reconcile change <ArrowRight aria-hidden="true" size={16} />
          </button>
        </section>
      ) : assessment.findings[0] ? (
        <section className="storyline-callout finding-callout">
          <div>
            <p className="eyebrow">New finding</p>
            <h2>{assessment.findings[0].title}</h2>
            <p>{assessment.findings[0].simpleExplanation}</p>
          </div>
          <Link
            className="button primary"
            href={`/findings/${assessment.findings[0].id}`}
            data-testid="open-finding"
          >
            Review finding <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </section>
      ) : null}

      <section>
        <div className="section-heading">
          <div>
            <p className="eyebrow">Protection domains</p>
            <h2>Current assessed state</h2>
          </div>
          <Link className="text-link" href="/protection">
            View protection profile <ArrowRight aria-hidden="true" size={15} />
          </Link>
        </div>
        <div className="domain-grid">
          {assessment.domains.map((domain) => (
            <DomainCard domain={domain} key={domain.domain} />
          ))}
        </div>
      </section>

      {eventIds.length ? <ProtectionDiff eventIds={eventIds} /> : null}
      <Disclaimer />
    </div>
  );
}
