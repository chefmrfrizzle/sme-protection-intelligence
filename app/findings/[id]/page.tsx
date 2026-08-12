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
import { ViewLens } from "@/components/view-lens";
import { evidenceById } from "@/demo/evidence";
import { minimumEvidenceRequest } from "@/domain/evidence/completeness";

export default function FindingDetailPage() {
  const params = useParams<{ id: string }>();
  const { assessment, lens, submitReview } = useDemo();
  const [submitting, setSubmitting] = useState<"review" | "evidence" | null>(
    null,
  );
  const [submissionError, setSubmissionError] = useState(false);
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
  const sendReviewAction = async (
    action: "review" | "evidence",
    status: "REVIEWING" | "MORE_EVIDENCE_REQUESTED",
  ) => {
    setSubmitting(action);
    setSubmissionError(false);
    const accepted = await submitReview(finding.id, status);
    setSubmissionError(!accepted);
    setSubmitting(null);
  };

  return (
    <div className="page-stack finding-page">
      <Link className="back-link" href="/protection">
        <ArrowLeft size={15} /> Back to protection
      </Link>
      <PageHeader
        eyebrow={`Protection / ${finding.domain.replaceAll("_", " ")} / Assessment v${assessment.version}`}
        title={finding.title}
        description={finding.summary}
        actions={<StatusBadge state={finding.state} />}
      />

      <ViewLens label="Finding explanation lens" />

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
              <p className="eyebrow">
                {lens === "simple"
                  ? "What changed?"
                  : lens === "insurance"
                    ? "Exposure change"
                    : "Structured result"}
              </p>
              <h2>
                {lens === "simple"
                  ? finding.simpleExplanation
                  : lens === "insurance"
                    ? finding.insuranceExplanation
                    : `${finding.ruleTrace.ruleId} produced ${finding.state.replaceAll("_", " ")}`}
              </h2>
              <p>
                {lens === "evidence"
                  ? `Rule v${finding.ruleTrace.ruleVersion} evaluated the current evidence snapshot at ${new Date(finding.ruleTrace.evaluatedAt).toLocaleString("en-SG", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Singapore" })} SGT.`
                  : finding.whyItMatters}
              </p>
            </div>
          </section>

          <section className="detail-section">
            <span className="step-number">02</span>
            <div className="wide-content">
              <p className="eyebrow">
                {lens === "simple"
                  ? "Information checked"
                  : "Current protection evidence"}
              </p>
              <h2>
                {lens === "simple"
                  ? `${evidence.length} documents were used for this review`
                  : lens === "insurance"
                    ? "Source-grounded comparison"
                    : "Evidence and provenance"}
              </h2>
              <div className="evidence-comparison">
                {evidence
                  .slice(0, lens === "simple" ? 3 : 4)
                  .map((artifact) => (
                    <article key={artifact.id}>
                      <FileCheck2 aria-hidden="true" size={18} />
                      <div>
                        <strong>{artifact.title}</strong>
                        <span>
                          {artifact.fileName} · v{artifact.version}
                        </span>
                        {lens === "simple" ? null : (
                          <p>{artifact.pages[0].body}</p>
                        )}
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
              <p className="eyebrow">
                {lens === "simple"
                  ? "How we checked the finding"
                  : lens === "insurance"
                    ? "Coverage challenge"
                    : "Challenge result"}
              </p>
              <h2>
                {lens === "simple" && finding.challenge.outcome === "SURVIVES"
                  ? "The item still needs review"
                  : finding.challenge.outcome.replaceAll("_", " ")}
              </h2>
              <p>
                {lens === "simple" && finding.challenge.outcome === "SURVIVES"
                  ? `We checked ${finding.challenge.searchedEvidenceIds.length} supplied documents for newer or conflicting information. Nothing found resolved this item, so it remains open for human review. This is not a coverage determination.`
                  : finding.challenge.summary}
              </p>
              <div className="challenge-meta">
                <span>
                  <CheckCircle2 size={14} />{" "}
                  {finding.challenge.searchedEvidenceIds.length}{" "}
                  {lens === "simple"
                    ? "documents checked"
                    : "artifacts searched"}
                </span>
                {lens === "simple" ? null : (
                  <span>Completed deterministically</span>
                )}
              </div>
            </div>
          </section>

          <section className="detail-section">
            <span className="step-number">03</span>
            <div className="wide-content">
              <p className="eyebrow">What would resolve this?</p>
              <h2>
                {lens === "simple"
                  ? "Documents to request"
                  : lens === "insurance"
                    ? "Minimum evidence request"
                    : "Evidence required to resolve"}
              </h2>
              <p>
                {lens === "simple"
                  ? "Only the smallest useful set of documents is requested."
                  : "The smallest evidence set reasonably capable of resolving the current uncertainty."}
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
          <h2>
            {lens === "simple"
              ? "Send for professional review"
              : "Professional decision required"}
          </h2>
          <p>
            {lens === "simple"
              ? "A broker, insurer or appropriate adviser should confirm the next step."
              : "The system supports the review. A qualified human owns the decision."}
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
            onClick={() => sendReviewAction("review", "REVIEWING")}
            data-testid="request-review"
            disabled={submitting !== null}
          >
            <Send size={16} />
            {submitting === "review" ? "Sending…" : "Request review"}
          </button>
          <button
            className="button secondary full"
            type="button"
            onClick={() =>
              sendReviewAction("evidence", "MORE_EVIDENCE_REQUESTED")
            }
            disabled={submitting !== null}
          >
            {submitting === "evidence" ? "Sending…" : "Request documents"}
          </button>
          {submissionError ? (
            <p className="form-error" role="alert">
              The review request could not be validated. Please try again.
            </p>
          ) : null}
          <Link className="button secondary full" href="/review-case">
            <FileCheck2 size={16} /> Open review case
          </Link>
          <Link className="text-link centered" href="/audit">
            View audit trail <ArrowRight size={14} />
          </Link>
        </aside>
      </div>
      <Disclaimer />
    </div>
  );
}
