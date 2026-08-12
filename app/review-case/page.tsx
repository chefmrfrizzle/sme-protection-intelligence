"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  ChevronRight,
  CircleOff,
  Clock3,
  Cloud,
  FileCheck2,
  FileClock,
  Fingerprint,
  MessageSquareText,
  Network,
  PackageSearch,
  Send,
  ShieldCheck,
  Warehouse,
} from "lucide-react";
import { Disclaimer } from "@/components/disclaimer";
import { useDemo } from "@/components/demo-provider";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { evidenceById } from "@/demo/evidence";
import { buildProtectionReviewCase } from "@/domain/integration/review-case";
import { buildProfessionalReviewWorkspace } from "@/domain/professional-review/workspace";
import type { InsuranceContextItem } from "@/domain/professional-review/types";
import type { ReviewStatus } from "@/domain/types";
import { demoEvents } from "@/demo/events";
import { evidenceArtifacts } from "@/demo/evidence";

type WorkspaceTab =
  | "summary"
  | "exposure"
  | "programme"
  | "evidence"
  | "discussion"
  | "audit"
  | "export";

type ProfessionalView = "BROKER_RISK_ADVISOR" | "INSURER_REVIEWER";

const tabs: { id: WorkspaceTab; label: string }[] = [
  { id: "summary", label: "Summary" },
  { id: "exposure", label: "Exposure" },
  { id: "programme", label: "Programme" },
  { id: "evidence", label: "Evidence requests" },
  { id: "discussion", label: "Discussion" },
  { id: "audit", label: "Audit" },
  { id: "export", label: "Export" },
];

const contextGroups = [
  { id: "property", label: "Property", icon: Warehouse },
  {
    id: "businessInterruption",
    label: "Business interruption",
    icon: Clock3,
  },
  { id: "cyber", label: "Cyber", icon: Cloud },
  { id: "supplyChain", label: "Supply chain", icon: PackageSearch },
  { id: "workflow", label: "Workflow", icon: FileClock },
] as const;

const decisionActions: {
  status: ReviewStatus;
  label: string;
  shortLabel: string;
  needsRationale: boolean;
}[] = [
  {
    status: "REVIEWING",
    label: "Start professional review",
    shortLabel: "Start review",
    needsRationale: false,
  },
  {
    status: "CONFIRMED",
    label: "Confirm finding for workflow",
    shortLabel: "Confirm for review",
    needsRationale: true,
  },
  {
    status: "DISMISSED",
    label: "Dismiss with supporting evidence",
    shortLabel: "Dismiss",
    needsRationale: true,
  },
  {
    status: "MORE_EVIDENCE_REQUESTED",
    label: "Request minimum evidence",
    shortLabel: "Request evidence",
    needsRationale: false,
  },
  {
    status: "ESCALATED",
    label: "Escalate to specialist",
    shortLabel: "Escalate",
    needsRationale: true,
  },
];

const reviewStatusCopy: Record<
  ReviewStatus,
  { label: string; feedback: string }
> = {
  OPEN: { label: "Ready for review", feedback: "Review case reopened." },
  REVIEWING: {
    label: "Review in progress",
    feedback: "Professional review started.",
  },
  CONFIRMED: {
    label: "Confirmed for review",
    feedback: "Finding confirmed for the professional workflow.",
  },
  DISMISSED: {
    label: "Finding dismissed",
    feedback: "Finding dismissed with the recorded rationale.",
  },
  MORE_EVIDENCE_REQUESTED: {
    label: "Evidence requested",
    feedback: "Minimum evidence request recorded.",
  },
  ESCALATED: {
    label: "Escalated",
    feedback: "Finding escalated to a specialist reviewer.",
  },
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-SG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Singapore",
  });
}

function formatPolicyDate(value: string) {
  return new Date(value).toLocaleDateString("en-SG", {
    dateStyle: "medium",
    timeZone: "Asia/Singapore",
  });
}

function contextStatusLabel(status: InsuranceContextItem["status"]) {
  const labels = {
    EVIDENCED: "Evidenced",
    CHANGED: "Changed",
    MISSING: "Evidence needed",
    CONFLICTING: "Conflicting",
    INTERPRETATION_REQUIRED: "Interpretation required",
  };
  return labels[status];
}

export default function ReviewCasePage() {
  const { assessment, activities, submitReview, submitActivity } = useDemo();
  const reviewCase = useMemo(
    () => buildProtectionReviewCase(assessment, demoEvents, evidenceArtifacts),
    [assessment],
  );
  const workspace = useMemo(
    () => buildProfessionalReviewWorkspace(assessment),
    [assessment],
  );
  const [selectedFindingId, setSelectedFindingId] = useState(
    workspace.queue[0]?.findingId ?? "",
  );
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("summary");
  const [view, setView] = useState<ProfessionalView>("BROKER_RISK_ADVISOR");
  const [rationale, setRationale] = useState("");
  const [comment, setComment] = useState("");
  const [commentVisibility, setCommentVisibility] = useState<
    "SHARED" | "PROFESSIONAL_ONLY"
  >("SHARED");
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!workspace.queue.length) {
    return (
      <div className="empty-state">
        <span className="empty-icon">
          <FileCheck2 size={20} />
        </span>
        <h1>No professional review items yet</h1>
        <p>
          Apply a synthetic operating change first. The queue is created only
          from validated deterministic findings.
        </p>
        <Link className="button primary" href="/changes">
          Open synthetic changes <ArrowRight size={15} />
        </Link>
      </div>
    );
  }

  const selectedQueueItem =
    workspace.queue.find((item) => item.findingId === selectedFindingId) ??
    workspace.queue[0];
  const selectedFinding = assessment.findings.find(
    (finding) => finding.id === selectedQueueItem.findingId,
  )!;
  const selectedRequest = workspace.evidenceRequests.find(
    (request) => request.findingId === selectedFinding.id,
  );
  const reviewRecord = assessment.auditEvents.filter(
    (event) => event.eventType === "HUMAN_REVIEW_PERFORMED",
  );

  const runDecision = async (status: ReviewStatus, needsRationale: boolean) => {
    if (needsRationale && rationale.trim().length < 4) {
      setFeedback("Add a short rationale before recording this decision.");
      return;
    }
    setSubmitting(status);
    setFeedback(null);
    const accepted = await submitReview(selectedFinding.id, status, {
      rationale: rationale.trim() || undefined,
      role: view,
      reviewer:
        view === "BROKER_RISK_ADVISOR"
          ? "Demo broker reviewer"
          : "Demo insurer reviewer",
    });
    setFeedback(
      accepted
        ? reviewStatusCopy[status].feedback
        : "The decision could not be validated. No state was changed.",
    );
    if (accepted) setRationale("");
    setSubmitting(null);
  };

  const addComment = async () => {
    if (comment.trim().length < 2) return;
    setSubmitting("comment");
    setFeedback(null);
    const accepted = await submitActivity(
      selectedFinding.id,
      comment.trim(),
      commentVisibility,
      view,
    );
    setFeedback(
      accepted
        ? "Comment added to the append-only case activity."
        : "The comment could not be validated.",
    );
    if (accepted) setComment("");
    setSubmitting(null);
  };

  return (
    <div className="page-stack professional-review-page">
      <PageHeader
        eyebrow="Professional review workspace"
        title="Protection review queue"
        description="Prioritise material changes, inspect the insurer-neutral case packet, request the minimum evidence, and record a human-owned disposition."
        actions={
          <span className="connection-badge">
            <CircleOff size={14} /> External adapters · Not connected
          </span>
        }
      />

      <section className="review-workspace-summary">
        <div className="renewal-summary-primary">
          <p className="eyebrow">Recorded renewal context</p>
          <div className="renewal-countdown">
            <strong>{workspace.renewal.daysRemaining}</strong>
            <span>days remaining</span>
          </div>
          <small>
            Recorded period end ·{" "}
            {formatPolicyDate(workspace.renewal.recordedPeriodEnd)}
          </small>
        </div>
        <dl>
          <div>
            <dt>Open items</dt>
            <dd>{workspace.renewal.openFindingIds.length}</dd>
          </div>
          <div>
            <dt>High priority</dt>
            <dd>
              {
                workspace.queue.filter((item) =>
                  ["URGENT", "HIGH"].includes(item.priority),
                ).length
              }
            </dd>
          </div>
          <div>
            <dt>Evidence requests</dt>
            <dd>{workspace.evidenceRequests.length}</dd>
          </div>
        </dl>
        <p className="renewal-context-note">
          Based on the supplied synthetic schedule. This is a planning reminder,
          not a statement that protection will expire.
        </p>
      </section>

      <div className="professional-view-row">
        <span>View workspace as</span>
        <div
          className="segmented-control"
          role="group"
          aria-label="Reviewer role"
        >
          <button
            type="button"
            aria-pressed={view === "BROKER_RISK_ADVISOR"}
            className={view === "BROKER_RISK_ADVISOR" ? "active" : ""}
            onClick={() => setView("BROKER_RISK_ADVISOR")}
          >
            Broker / risk adviser
          </button>
          <button
            type="button"
            aria-pressed={view === "INSURER_REVIEWER"}
            className={view === "INSURER_REVIEWER" ? "active" : ""}
            onClick={() => setView("INSURER_REVIEWER")}
          >
            Insurer reviewer
          </button>
        </div>
        <small>Demo perspective only · it does not grant a real role</small>
      </div>

      <div className="professional-workspace">
        <aside className="review-queue" aria-label="Professional review queue">
          <div className="review-queue-heading">
            <div>
              <p className="eyebrow">Review queue</p>
              <h2>{workspace.queue.length} active items</h2>
            </div>
            <span>Assessment v{assessment.version}</span>
          </div>
          <div className="review-queue-list">
            {workspace.queue.map((item) => (
              <button
                type="button"
                key={item.id}
                className={
                  item.findingId === selectedFinding.id
                    ? "review-queue-item active"
                    : "review-queue-item"
                }
                onClick={() => {
                  setSelectedFindingId(item.findingId);
                  setActiveTab("summary");
                  setFeedback(null);
                }}
                aria-pressed={item.findingId === selectedFinding.id}
              >
                <span
                  className={`priority priority-${item.priority.toLowerCase()}`}
                >
                  {item.priority}
                </span>
                <strong>{item.title}</strong>
                <span>{item.domain.replaceAll("_", " ")}</span>
                <small>
                  {item.evidenceReadiness.replaceAll("_", " ")} ·{" "}
                  {reviewStatusCopy[item.reviewStatus].label}
                </small>
                <ChevronRight aria-hidden="true" size={16} />
              </button>
            ))}
          </div>
        </aside>

        <main className="professional-case">
          <header className="professional-case-header">
            <div>
              <div className="case-kicker">
                <span
                  className={`priority priority-${selectedQueueItem.priority.toLowerCase()}`}
                >
                  {selectedQueueItem.priority} priority
                </span>
                <span>Case {workspace.caseId}</span>
              </div>
              <h2>{selectedFinding.title}</h2>
              <p>{selectedFinding.summary}</p>
            </div>
            <StatusBadge state={selectedFinding.state} />
          </header>

          <nav
            className="case-tabs"
            role="tablist"
            aria-label="Review case sections"
          >
            {tabs.map((tab) => (
              <button
                type="button"
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                className={activeTab === tab.id ? "active" : ""}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                {tab.id === "evidence" && selectedRequest ? (
                  <span>1</span>
                ) : null}
                {tab.id === "discussion" && activities.length ? (
                  <span>{activities.length}</span>
                ) : null}
              </button>
            ))}
          </nav>

          <section className="case-tab-panel" role="tabpanel">
            {activeTab === "summary" ? (
              <div className="case-summary-grid">
                <div className="case-summary-main">
                  <section className="professional-card">
                    <p className="eyebrow">Why this is prioritised</p>
                    <h3>Deterministic priority reasons</h3>
                    <ul className="plain-check-list">
                      {selectedQueueItem.priorityReasons.map((reason) => (
                        <li key={reason}>
                          <AlertTriangle size={15} /> {reason}
                        </li>
                      ))}
                    </ul>
                  </section>
                  <section className="professional-card">
                    <p className="eyebrow">Coverage challenge pass</p>
                    <div className="challenge-summary-row">
                      <ShieldCheck size={22} />
                      <div>
                        <h3>
                          {selectedFinding.challenge.outcome.replaceAll(
                            "_",
                            " ",
                          )}
                        </h3>
                        <p>{selectedFinding.challenge.summary}</p>
                      </div>
                    </div>
                    <div className="evidence-chip-row">
                      {selectedFinding.challenge.searchedEvidenceIds.map(
                        (id) => {
                          const artifact = evidenceById.get(id);
                          return artifact ? (
                            <Link key={id} href={`/evidence#${id}`}>
                              {artifact.title} <ArrowRight size={12} />
                            </Link>
                          ) : null;
                        },
                      )}
                    </div>
                  </section>
                  <section className="professional-card">
                    <p className="eyebrow">Minimum evidence request</p>
                    <h3>What would resolve the uncertainty</h3>
                    <ol className="professional-request-list">
                      {selectedFinding.resolutionSteps.map((item, index) => (
                        <li key={item}>
                          <span>{index + 1}</span>
                          {item}
                        </li>
                      ))}
                    </ol>
                  </section>
                </div>
                <aside className="decision-panel">
                  <p className="eyebrow">Human-owned decision</p>
                  <h3>
                    {reviewStatusCopy[selectedFinding.reviewStatus].label}
                  </h3>
                  <p>
                    Confirming a finding accepts it for the review workflow. It
                    does not confirm insurance coverage.
                  </p>
                  <label htmlFor="decision-rationale">Decision rationale</label>
                  <small className="decision-rationale-help">
                    Required to confirm, dismiss or escalate.
                  </small>
                  <textarea
                    id="decision-rationale"
                    value={rationale}
                    onChange={(event) => setRationale(event.target.value)}
                    placeholder="Explain the evidence and reason for the professional action…"
                    rows={4}
                  />
                  <div className="decision-actions">
                    {decisionActions.map((action) => (
                      <button
                        type="button"
                        key={action.status}
                        className={
                          action.status === "REVIEWING"
                            ? "button primary full"
                            : "button secondary full"
                        }
                        disabled={
                          submitting !== null ||
                          selectedFinding.reviewStatus === action.status
                        }
                        onClick={() =>
                          runDecision(action.status, action.needsRationale)
                        }
                        title={action.label}
                      >
                        {submitting === action.status
                          ? "Recording…"
                          : action.shortLabel}
                      </button>
                    ))}
                  </div>
                  {feedback ? (
                    <p className="decision-feedback" role="status">
                      {feedback}
                    </p>
                  ) : null}
                </aside>
              </div>
            ) : null}

            {activeTab === "exposure" ? (
              <div className="workspace-section-stack">
                <div className="section-intro">
                  <p className="eyebrow">Before and after</p>
                  <h3>Material exposure changes</h3>
                  <p>
                    Each comparison retains its effective time, materiality
                    rule, and evidence references.
                  </p>
                </div>
                <div className="exposure-difference-grid">
                  {workspace.exposureDifferences.map((difference) => (
                    <article key={difference.id}>
                      <div className="exposure-difference-heading">
                        <span>{difference.subjectType}</span>
                        <strong>{difference.subjectLabel}</strong>
                      </div>
                      <div className="before-after-row">
                        <div>
                          <small>Before</small>
                          <strong>{difference.before}</strong>
                        </div>
                        <ArrowRight aria-hidden="true" size={18} />
                        <div>
                          <small>Current</small>
                          <strong>{difference.after}</strong>
                        </div>
                      </div>
                      <footer>
                        <span>
                          {difference.materialityRuleId} v
                          {difference.materialityRuleVersion}
                        </span>
                        <span>{formatDate(difference.changedAt)}</span>
                      </footer>
                    </article>
                  ))}
                </div>
                {contextGroups.map(({ id, label, icon: Icon }) => (
                  <section className="context-group" key={id}>
                    <header>
                      <Icon size={19} />
                      <div>
                        <p className="eyebrow">Insurance context</p>
                        <h3>{label}</h3>
                      </div>
                    </header>
                    <div className="context-table">
                      {workspace.contexts[id].map((item) => (
                        <article key={item.id}>
                          <div>
                            <strong>{item.label}</strong>
                            <span>{item.value}</span>
                            <small>{item.note}</small>
                          </div>
                          <span
                            className={`context-status context-${item.status.toLowerCase()}`}
                          >
                            {contextStatusLabel(item.status)}
                          </span>
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : null}

            {activeTab === "programme" ? (
              <div className="workspace-section-stack">
                <section className="programme-header-card">
                  <Building2 size={23} />
                  <div>
                    <p className="eyebrow">Supplied synthetic programme</p>
                    <h3>{workspace.policy.namedInsured}</h3>
                    <p>
                      {workspace.policy.policyVersionId} ·{" "}
                      {new Date(
                        workspace.policy.periodStart,
                      ).toLocaleDateString("en-SG")}{" "}
                      to{" "}
                      {new Date(workspace.policy.periodEnd).toLocaleDateString(
                        "en-SG",
                      )}
                    </p>
                  </div>
                  <div>
                    <small>Recorded period end</small>
                    <strong>{workspace.renewal.daysRemaining} days</strong>
                  </div>
                </section>
                <div className="programme-section-grid">
                  {workspace.policy.sections.map((section) => (
                    <article key={section.id}>
                      <span>{section.evidenceStatus}</span>
                      <h3>{section.name}</h3>
                      <p>{section.limitSummary}</p>
                      <small>
                        {section.evidenceIds.length} evidence records
                      </small>
                    </article>
                  ))}
                </div>
                <section className="professional-card">
                  <p className="eyebrow">Endorsement context</p>
                  <h3>Documents checked for modifications</h3>
                  {workspace.policy.endorsements.map((endorsement) => (
                    <div className="endorsement-row" key={endorsement.id}>
                      <FileCheck2 size={18} />
                      <div>
                        <strong>{endorsement.number}</strong>
                        <span>
                          Effective {formatDate(endorsement.effectiveAt)} ·{" "}
                          {endorsement.appearsToModify.join(", ")}
                        </span>
                      </div>
                      <span>
                        {endorsement.interpretationStatus.replaceAll("_", " ")}
                      </span>
                    </div>
                  ))}
                </section>
              </div>
            ) : null}

            {activeTab === "evidence" ? (
              <div className="workspace-section-stack">
                <div className="section-intro">
                  <p className="eyebrow">Outstanding evidence</p>
                  <h3>Minimum requests across this case</h3>
                  <p>
                    Draft requests do not imply that the evidence does not
                    exist—only that it has not been supplied to this assessment.
                  </p>
                </div>
                <div className="evidence-request-grid">
                  {workspace.evidenceRequests.map((request) => (
                    <article
                      key={request.id}
                      className={
                        request.findingId === selectedFinding.id ? "active" : ""
                      }
                    >
                      <header>
                        <span>{request.status}</span>
                        <strong>{request.title}</strong>
                      </header>
                      <ul>
                        {request.requestedItems.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                      <footer>
                        <span>{request.requestedFrom}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFindingId(request.findingId);
                            setActiveTab("summary");
                          }}
                        >
                          Open finding <ArrowRight size={12} />
                        </button>
                      </footer>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {activeTab === "discussion" ? (
              <div className="discussion-layout">
                <section className="discussion-thread">
                  <div className="section-intro">
                    <p className="eyebrow">Broker and insurer discussion</p>
                    <h3>Append-only case comments</h3>
                  </div>
                  {activities.length ? (
                    activities
                      .filter(
                        (activity) =>
                          !activity.findingId ||
                          activity.findingId === selectedFinding.id,
                      )
                      .map((activity) => (
                        <article key={activity.id}>
                          <div className="comment-avatar">
                            <MessageSquareText size={16} />
                          </div>
                          <div>
                            <header>
                              <strong>{activity.author}</strong>
                              <span>{activity.role.replaceAll("_", " ")}</span>
                              <small>{formatDate(activity.occurredAt)}</small>
                            </header>
                            <p>{activity.message}</p>
                            <span>
                              {activity.visibility.replaceAll("_", " ")}
                            </span>
                          </div>
                        </article>
                      ))
                  ) : (
                    <div className="inline-empty-state">
                      <MessageSquareText size={20} />
                      <strong>No professional comments yet</strong>
                      <p>Start the discussion with a source-grounded note.</p>
                    </div>
                  )}
                </section>
                <aside className="comment-composer">
                  <label htmlFor="case-comment">Add review comment</label>
                  <textarea
                    id="case-comment"
                    rows={6}
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="Reference the evidence or explain the next professional action…"
                  />
                  <label htmlFor="comment-visibility">Visibility</label>
                  <select
                    id="comment-visibility"
                    value={commentVisibility}
                    onChange={(event) =>
                      setCommentVisibility(
                        event.target.value as typeof commentVisibility,
                      )
                    }
                  >
                    <option value="SHARED">
                      Shared with SME and professionals
                    </option>
                    <option value="PROFESSIONAL_ONLY">Professional only</option>
                  </select>
                  <button
                    type="button"
                    className="button primary full"
                    disabled={submitting !== null || comment.trim().length < 2}
                    onClick={addComment}
                  >
                    <Send size={15} />
                    {submitting === "comment" ? "Adding…" : "Add comment"}
                  </button>
                  {feedback ? (
                    <p className="decision-feedback">{feedback}</p>
                  ) : null}
                </aside>
              </div>
            ) : null}

            {activeTab === "audit" ? (
              <div className="workspace-section-stack">
                <div className="section-intro">
                  <p className="eyebrow">Replayable history</p>
                  <h3>Case decision and audit timeline</h3>
                  <p>
                    Historical events are never edited in place. Corrections
                    create new events and assessment versions.
                  </p>
                </div>
                <div className="professional-audit-list">
                  {workspace.activities
                    .filter(
                      (activity) =>
                        !activity.findingId ||
                        activity.findingId === selectedFinding.id,
                    )
                    .map((activity) => (
                      <article key={activity.id}>
                        <span className="audit-dot" />
                        <div>
                          <strong>{activity.type.replaceAll("_", " ")}</strong>
                          <p>{activity.message}</p>
                          <small>
                            {activity.actor} · {formatDate(activity.occurredAt)}
                          </small>
                        </div>
                        <code>{activity.eventHash.slice(-14)}</code>
                      </article>
                    ))}
                  {activities
                    .filter(
                      (activity) =>
                        !activity.findingId ||
                        activity.findingId === selectedFinding.id,
                    )
                    .map((activity) => (
                      <article key={activity.id}>
                        <span className="audit-dot human" />
                        <div>
                          <strong>COMMENT ADDED</strong>
                          <p>{activity.message}</p>
                          <small>
                            {activity.author} (
                            {activity.role.replaceAll("_", " ")}) ·{" "}
                            {formatDate(activity.occurredAt)}
                          </small>
                        </div>
                        <code>{activity.id.slice(-14)}</code>
                      </article>
                    ))}
                  {reviewRecord.map((event) => (
                    <article key={event.id}>
                      <span className="audit-dot human" />
                      <div>
                        <strong>HUMAN REVIEW PERFORMED</strong>
                        <p>{event.summary}</p>
                        <small>
                          {event.actor} · {formatDate(event.occurredAt)}
                        </small>
                      </div>
                      <code>{event.snapshotHash.slice(-14)}</code>
                    </article>
                  ))}
                </div>
                <Link className="text-link" href="/audit">
                  Open organisation audit trail <ArrowRight size={14} />
                </Link>
              </div>
            ) : null}

            {activeTab === "export" ? (
              <div className="export-layout">
                <section className="professional-card export-contract-card">
                  <Network size={22} />
                  <p className="eyebrow">Insurer-neutral contract</p>
                  <h3>Future Zurich eXchange mapping preview</h3>
                  <p>
                    The case is mapping-ready but unvalidated. Nothing is sent
                    to Zurich or another insurer.
                  </p>
                  <dl>
                    <div>
                      <dt>Adapter</dt>
                      <dd>{reviewCase.integration.adapter}</dd>
                    </div>
                    <div>
                      <dt>Mapping target</dt>
                      <dd>{reviewCase.integration.mappingTarget}</dd>
                    </div>
                    <div>
                      <dt>Mapping status</dt>
                      <dd>{reviewCase.integration.mappingStatus}</dd>
                    </div>
                    <div>
                      <dt>Connection</dt>
                      <dd>{reviewCase.integration.connectionState}</dd>
                    </div>
                  </dl>
                  <details className="payload-preview">
                    <summary>Inspect structured outbound preview</summary>
                    <pre>
                      {JSON.stringify(reviewCase.outboundPreview, null, 2)}
                    </pre>
                  </details>
                </section>
                <section className="connector-register">
                  <div className="section-intro">
                    <p className="eyebrow">Future integration register</p>
                    <h3>Approved adapters can be added later</h3>
                  </div>
                  {workspace.connectors.map((connector) => (
                    <article key={connector.id}>
                      <div>
                        <strong>{connector.name}</strong>
                        <span>{connector.provider}</span>
                      </div>
                      <p>{connector.purpose}</p>
                      <div>
                        <span>{connector.direction}</span>
                        <span>{connector.status.replaceAll("_", " ")}</span>
                      </div>
                      <small>{connector.safetyBoundary}</small>
                    </article>
                  ))}
                </section>
                <section className="case-receipt export-receipt">
                  <Fingerprint size={18} />
                  <div>
                    <strong>Review-case receipt</strong>
                    <span>{reviewCase.receiptHash}</span>
                  </div>
                </section>
              </div>
            ) : null}
          </section>
        </main>
      </div>

      <Disclaimer />
    </div>
  );
}
