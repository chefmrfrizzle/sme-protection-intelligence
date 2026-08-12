"use client";

import {
  CheckCircle2,
  Copy,
  FileClock,
  Fingerprint,
  GitCompareArrows,
  History,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useDemo } from "@/components/demo-provider";

export default function AuditPage() {
  const { assessment } = useDemo();
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Append-only decision history"
        title="Audit trail"
        description="What the system knew, which rules it used, and why it produced the current assessment."
        actions={
          <div className="receipt-chip">
            <Fingerprint size={15} /> {assessment.receiptHash.slice(-12)}
          </div>
        }
      />
      <section className="audit-receipt">
        <div>
          <p className="eyebrow">Assessment Receipt</p>
          <h2>Profile v{assessment.version}</h2>
          <span>Replayable synthetic snapshot</span>
        </div>
        <dl>
          <div>
            <dt>Assessment ID</dt>
            <dd>{assessment.id}</dd>
          </div>
          <div>
            <dt>Evidence snapshot</dt>
            <dd>{assessment.evidenceSnapshotId}</dd>
          </div>
          <div>
            <dt>Ruleset</dt>
            <dd>{assessment.rulesetVersion}</dd>
          </div>
          <div>
            <dt>Receipt hash</dt>
            <dd>{assessment.receiptHash}</dd>
          </div>
        </dl>
      </section>
      <div className="audit-layout">
        <section className="audit-timeline">
          {assessment.auditEvents.map((event, index) => (
            <article key={event.id}>
              <div className="audit-marker">
                <span>
                  {index === assessment.auditEvents.length - 1 ? (
                    <CheckCircle2 size={15} />
                  ) : (
                    <History size={15} />
                  )}
                </span>
                {index < assessment.auditEvents.length - 1 ? <i /> : null}
              </div>
              <div className="audit-event">
                <div>
                  <strong>{event.eventType.replaceAll("_", " ")}</strong>
                  <time>
                    {new Date(event.occurredAt).toLocaleString("en-SG", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "Asia/Singapore",
                    })}{" "}
                    SGT
                  </time>
                </div>
                <p>{event.summary}</p>
                <span>{event.actor}</span>
                <code>{event.snapshotHash}</code>
              </div>
            </article>
          ))}
        </section>
        <aside className="audit-aside">
          <div className="sticky-card">
            <FileClock size={20} />
            <h3>Versioned conclusions</h3>
            <p>
              No conclusion is overwritten. Each applied change produces a new
              assessment version.
            </p>
            <div className="version-list">
              {Array.from({ length: assessment.version }, (_, index) => (
                <div
                  className={index + 1 === assessment.version ? "current" : ""}
                  key={index}
                >
                  <span>v{index + 1}</span>
                  <small>
                    {index
                      ? `${index} change${index > 1 ? "s" : ""}`
                      : "Baseline"}
                  </small>
                  {index + 1 === assessment.version ? (
                    <strong>Current</strong>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
          <div className="audit-principle">
            <GitCompareArrows size={18} />
            <div>
              <strong>Replayability</strong>
              <span>
                Evidence, rules and finding snapshots are independently
                traceable.
              </span>
            </div>
          </div>
          <div className="audit-principle">
            <Copy size={18} />
            <div>
              <strong>No blockchain</strong>
              <span>
                Content hashes and append-only events provide the required
                receipt.
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
