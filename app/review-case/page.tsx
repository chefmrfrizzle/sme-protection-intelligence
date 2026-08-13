"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CircleOff,
  FileCheck2,
  Fingerprint,
  Network,
  SearchCheck,
} from "lucide-react";
import { Disclaimer } from "@/components/disclaimer";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { useDemo } from "@/components/demo-provider";
import { evidenceArtifacts } from "@/demo/evidence";
import { demoEvents, eventPresentation } from "@/demo/events";
import { buildProtectionReviewCase } from "@/domain/integration/review-case";
import {
  challengeOutcomeLabel,
  reviewCaseStateLabel,
  reviewStatusLabel,
} from "@/domain/language/insurance-language";

const actionLabels = {
  ROUTE_FOR_REVIEW: "Send for professional review",
  REQUEST_EVIDENCE: "Request supporting documents",
  ABSTAIN: "Record as unresolved",
} as const;

export default function ReviewCasePage() {
  const { assessment } = useDemo();
  const reviewCase = buildProtectionReviewCase(
    assessment,
    demoEvents,
    evidenceArtifacts,
  );

  if (!reviewCase.events.length) {
    return (
      <div className="empty-state">
        <span className="empty-icon">
          <FileCheck2 size={20} />
        </span>
        <h1>No review case yet</h1>
        <p>
          Apply a synthetic operating change first. A review case is created
          only from the validated assessment state.
        </p>
        <Link className="button primary" href="/changes">
          Open synthetic changes <ArrowRight size={15} />
        </Link>
      </div>
    );
  }

  return (
    <div className="page-stack review-case-page">
      <PageHeader
        eyebrow="Human-owned workflow artifact"
        title="Protection Review Case"
        description="A synthetic, source-grounded package for broker or underwriter review—not an insurance or coverage decision."
        actions={
          <span className="connection-badge">
            <CircleOff size={14} /> Mock adapter · Not connected
          </span>
        }
      />

      <section className="case-summary-card">
        <div>
          <p className="eyebrow">Case state</p>
          <h2>{reviewCaseStateLabel(reviewCase.state)}</h2>
          <p>
            Created from assessment v{reviewCase.assessmentVersion}. A qualified
            human owns every insurance decision and next action.
          </p>
        </div>
        <dl>
          <div>
            <dt>Changes</dt>
            <dd>{reviewCase.events.length}</dd>
          </div>
          <div>
            <dt>Review items</dt>
            <dd>{reviewCase.findings.length}</dd>
          </div>
          <div>
            <dt>Evidence records</dt>
            <dd>{reviewCase.evidence.length}</dd>
          </div>
        </dl>
      </section>

      <div className="case-layout">
        <div className="case-main">
          <section className="case-section">
            <div className="case-section-heading">
              <Network size={19} />
              <div>
                <p className="eyebrow">01 · Trigger</p>
                <h2>Validated operating change</h2>
              </div>
            </div>
            <div className="case-event-list">
              {reviewCase.events.map((event) => (
                <article key={event.id}>
                  <div>
                    <strong>
                      {eventPresentation[event.id!]?.title ?? event.eventType}
                    </strong>
                    <span>
                      {event.source.name} ·{" "}
                      {new Date(event.observedAt).toLocaleString("en-SG", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "Asia/Singapore",
                      })}{" "}
                      SGT
                    </span>
                  </div>
                  <code>{event.eventType}</code>
                </article>
              ))}
            </div>
          </section>

          <section className="case-section">
            <div className="case-section-heading">
              <SearchCheck size={19} />
              <div>
                <p className="eyebrow">02 · Reconciliation and challenge</p>
                <h2>Items prepared for professional review</h2>
              </div>
            </div>
            {reviewCase.findings.map((finding) => (
              <article className="case-finding" key={finding.id}>
                <header>
                  <div>
                    <strong>{finding.title}</strong>
                    <span>
                      Rule {finding.ruleTrace.ruleId} · v
                      {finding.ruleTrace.ruleVersion}
                    </span>
                  </div>
                  <StatusBadge state={finding.state} compact />
                </header>
                <p>{finding.summary}</p>
                <div className="case-trace-grid">
                  <div>
                    <small>Challenge</small>
                    <strong>
                      {challengeOutcomeLabel(finding.challenge.outcome)}
                    </strong>
                  </div>
                  <div>
                    <small>Evidence inspected</small>
                    <strong>{finding.evidenceIds.length} records</strong>
                  </div>
                  <div>
                    <small>Human review</small>
                    <strong>{reviewStatusLabel(finding.reviewStatus)}</strong>
                  </div>
                </div>
                {finding.missingEvidence.length ? (
                  <div className="case-evidence-request">
                    <strong>Minimum evidence request</strong>
                    <ul>
                      {finding.resolutionSteps.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </article>
            ))}
          </section>

          <section className="case-section">
            <div className="case-section-heading">
              <FileCheck2 size={19} />
              <div>
                <p className="eyebrow">03 · Provenance</p>
                <h2>Evidence included in the case</h2>
              </div>
            </div>
            <div className="case-evidence-list">
              {reviewCase.evidence.map((evidence) => (
                <Link href={`/evidence#${evidence.id}`} key={evidence.id}>
                  <CheckCircle2 size={15} />
                  <span>
                    <strong>{evidence.title}</strong>
                    <small>
                      {evidence.fileName} · v{evidence.version}
                    </small>
                  </span>
                  <ArrowRight size={14} />
                </Link>
              ))}
            </div>
          </section>
        </div>

        <aside className="case-aside">
          <section className="integration-card">
            <div className="integration-icon">
              <Network size={20} />
            </div>
            <p className="eyebrow">Mock integration preview</p>
            <h2>Mapping-ready review contract</h2>
            <p>
              Insurer-neutral output prepared for sponsor validation. It is not
              connected, Zurich-certified, or ACORD-certified.
            </p>
            <dl>
              <div>
                <dt>Adapter</dt>
                <dd>{reviewCase.integration.adapter}</dd>
              </div>
              <div>
                <dt>Connection</dt>
                <dd>{reviewCase.integration.connectionState}</dd>
              </div>
              <div>
                <dt>Destination</dt>
                <dd>To be validated</dd>
              </div>
            </dl>
            <details className="payload-preview">
              <summary>Inspect outbound JSON</summary>
              <pre>{JSON.stringify(reviewCase.outboundPreview, null, 2)}</pre>
            </details>
          </section>
          <section className="case-receipt">
            <Fingerprint size={18} />
            <div>
              <strong>Review-case receipt</strong>
              <span>{reviewCase.receiptHash}</span>
            </div>
          </section>
          <section className="allowed-actions">
            <strong>Permitted system actions</strong>
            {reviewCase.allowedActions.map((action) => (
              <span key={action}>
                <CheckCircle2 size={13} /> {actionLabels[action]}
              </span>
            ))}
            <small>
              “Record as unresolved” is stored as a system abstention in the
              structured audit contract. It does not choose an insurance
              outcome. No price, bind, coverage, or claim decision is allowed.
            </small>
          </section>
        </aside>
      </div>
      <Disclaimer />
    </div>
  );
}
