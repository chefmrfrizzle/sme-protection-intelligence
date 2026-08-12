"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  SearchCheck,
  Send,
} from "lucide-react";
import { Disclaimer } from "@/components/disclaimer";
import { useDemo } from "@/components/demo-provider";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { evidenceById } from "@/demo/evidence";
import { minimumEvidenceRequest } from "@/domain/evidence/completeness";

type Lens = "simple" | "insurance" | "evidence";

export default function FindingDetailPage() {
  const params = useParams<{ id: string }>();
  const { assessment, updateReview } = useDemo();
  const [lens, setLens] = useState<Lens>("simple");
  const finding = assessment.findings.find((item) => item.id === params.id);

  if (!finding) {
    return (
      <div className="empty-state">
        <span className="empty-icon">i</span>
        <h1>This finding is not active</h1>
        <p>
          Reset the demo and apply the related synthetic change to create it.
        </p>
        <Link className="button primary" href="/changes">
          Open changes
        </Link>
      </div>
    );
  }

  const evidence = finding.evidenceIds
    .map((id) => evidenceById.get(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const request = minimumEvidenceRequest(finding);

  return (
    <div className="page-stack finding-page">
      <Link className="back-link" href="/overview">
        <ArrowLeft size={15} /> Back to overview
      </Link>
      <PageHeader
        eyebrow={`Assessment v${assessment.version} / ${finding.domain.replaceAll("_", " ")}`}
        title={finding.title}
        description={finding.summary}
        actions={<StatusBadge state={finding.state} />}
      />

      <div
        className="lens-tabs"
        role="tablist"
        aria-label="Finding explanation lens"
      >
        {(["simple", "insurance", "evidence"] as Lens[]).map((item) => (
          <button
            key={item}
            className={lens === item ? "active" : ""}
            type="button"
            role="tab"
            aria-selected={lens === item}
            onClick={() => setLens(item)}
          >
            {item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>

      <section className="lens-panel" role="tabpanel">
        {lens === "simple" ? (
          <>
            <p className="eyebrow">In plain English</p>
            <h2>{finding.simpleExplanation}</h2>
            <p>{finding.whyItMatters}</p>
          </>
        ) : lens === "insurance" ? (
          <>
            <p className="eyebrow">Insurance lens</p>
            <h2>{finding.insuranceExplanation}</h2>
            <div className="rule-trace-inline">
              <span>Rule {finding.ruleTrace.ruleId}</span>
              <span>v{finding.ruleTrace.ruleVersion}</span>
              <span>
                {finding.ruleTrace.passed ? "Threshold met" : "Abstained"}
              </span>
            </div>
          </>
        ) : (
          <>
            <p className="eyebrow">Evidence lens</p>
            <h2>
              {evidence.length} source artifacts support this structured
              assessment
            </h2>
            <p>
              Each extracted fact retains its file, version, page, section,
              source hash, parser, method and confidence.
            </p>
            <div className="evidence-chip-row">
              {evidence.map((artifact) => (
                <Link href={`/evidence#${artifact.id}`} key={artifact.id}>
                  {artifact.title} <ExternalLink size={13} />
                </Link>
              ))}
            </div>
          </>
        )}
      </section>

      <div className="finding-layout">
        <div className="finding-main">
          <section className="detail-section">
            <span className="step-number">01</span>
            <div>
              <p className="eyebrow">What changed?</p>
              <h2>{finding.summary}</h2>
              <p>{finding.whyItMatters}</p>
            </div>
          </section>

          <section className="detail-section">
            <span className="step-number">02</span>
            <div className="wide-content">
              <p className="eyebrow">Current protection evidence</p>
              <h2>Source-grounded comparison</h2>
              <div className="evidence-comparison">
                {evidence.slice(0, 4).map((artifact) => (
                  <article key={artifact.id}>
                    <FileCheck2 aria-hidden="true" size={18} />
                    <div>
                      <strong>{artifact.title}</strong>
                      <span>
                        {artifact.fileName} · v{artifact.version}
                      </span>
                      <p>{artifact.pages[0].body}</p>
                    </div>
                    <Link
                      href={`/evidence#${artifact.id}`}
                      aria-label={`Show evidence from ${artifact.title}`}
                    >
                      <ExternalLink size={15} />
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="challenge-card">
            <div className="challenge-icon">
              <SearchCheck aria-hidden="true" size={22} />
            </div>
            <div>
              <p className="eyebrow">Coverage Challenge result</p>
              <h2>{finding.challenge.outcome.replaceAll("_", " ")}</h2>
              <p>{finding.challenge.summary}</p>
              <div className="challenge-meta">
                <span>
                  <CheckCircle2 size={14} />{" "}
                  {finding.challenge.searchedEvidenceIds.length} artifacts
                  searched
                </span>
                <span>Completed deterministically</span>
              </div>
            </div>
          </section>

          <section className="detail-section">
            <span className="step-number">03</span>
            <div className="wide-content">
              <p className="eyebrow">What would resolve this?</p>
              <h2>Minimum Evidence Request</h2>
              <p>
                The smallest evidence set reasonably capable of resolving the
                current uncertainty.
              </p>
              <ol className="resolution-list">
                {request.map((item) => (
                  <li key={item}>
                    <span>{request.indexOf(item) + 1}</span>
                    {item}
                  </li>
                ))}
              </ol>
            </div>
          </section>
        </div>

        <aside className="review-panel">
          <p className="eyebrow">Human review</p>
          <h2>Professional decision required</h2>
          <p>
            The system supports the review. A qualified human owns the decision.
          </p>
          <dl>
            <div>
              <dt>Status</dt>
              <dd>{finding.reviewStatus.replaceAll("_", " ")}</dd>
            </div>
            <div>
              <dt>Owner</dt>
              <dd>Unassigned</dd>
            </div>
            <div>
              <dt>Assessment</dt>
              <dd>v{assessment.version}</dd>
            </div>
          </dl>
          <button
            className="button primary full"
            type="button"
            onClick={() => updateReview(finding.id, "REVIEWING")}
            data-testid="request-review"
          >
            <Send size={16} /> Request review
          </button>
          <button
            className="button secondary full"
            type="button"
            onClick={() => updateReview(finding.id, "MORE_EVIDENCE_REQUESTED")}
          >
            Request evidence
          </button>
          <Link className="text-link centered" href="/audit">
            View decision history <ArrowRight size={14} />
          </Link>
        </aside>
      </div>
      <Disclaimer />
    </div>
  );
}
