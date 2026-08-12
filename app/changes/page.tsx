"use client";

import Link from "next/link";
import { ArrowRight, Check, Clock3, Play, Plus, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ProtectionDiff } from "@/components/protection-diff";
import { useDemo } from "@/components/demo-provider";
import { demoEvents, eventPresentation } from "@/demo/events";

export default function ChangesPage() {
  const { assessment, eventIds, hasEvent, applyEvent, applyAll, reset } =
    useDemo();
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Business change timeline"
        title="Changes"
        description="Material operating changes are reconciled against the supplied protection evidence."
        actions={
          <div className="button-row">
            <button className="button secondary" type="button" onClick={reset}>
              <RotateCcw size={16} /> Reset
            </button>
            <button className="button primary" type="button" onClick={applyAll}>
              <Play size={16} /> Run full storyline
            </button>
          </div>
        }
      />

      <div className="timeline-layout">
        <section
          className="event-timeline"
          aria-label="Synthetic change events"
        >
          {demoEvents.map((event, index) => {
            const applied = hasEvent(event.id!);
            const presentation = eventPresentation[event.id!];
            const relatedFinding = assessment.findings.find(
              (finding) => finding.ruleTrace.evaluatedAt === event.observedAt,
            );
            return (
              <article
                className={`event-card ${applied ? "applied" : ""}`}
                key={event.id}
              >
                <div className="timeline-marker">
                  <span>
                    {applied ? <Check size={15} /> : <Plus size={15} />}
                  </span>
                  {index < demoEvents.length - 1 ? <i /> : null}
                </div>
                <div className="event-content">
                  <div className="event-meta">
                    <span>
                      <Clock3 size={13} />{" "}
                      {new Date(event.observedAt).toLocaleDateString("en-SG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span>{event.source.name}</span>
                  </div>
                  <h2>{presentation.title}</h2>
                  <p>{presentation.detail}</p>
                  <div className="event-diff">{presentation.diff}</div>
                  <dl className="event-details">
                    <div>
                      <dt>Why it matters</dt>
                      <dd>A configured materiality rule is met.</dd>
                    </div>
                    <div>
                      <dt>Protection affected</dt>
                      <dd>{presentation.affected}</dd>
                    </div>
                    <div>
                      <dt>Evidence</dt>
                      <dd>{event.evidenceReferences.length} linked sources</dd>
                    </div>
                  </dl>
                  {applied ? (
                    relatedFinding ? (
                      <Link
                        className="button secondary"
                        href={`/findings/${relatedFinding.id}`}
                      >
                        Open assessment <ArrowRight size={15} />
                      </Link>
                    ) : (
                      <span className="applied-label">
                        <Check size={14} /> Applied - no surviving finding
                      </span>
                    )
                  ) : (
                    <button
                      className="button primary"
                      type="button"
                      onClick={() => applyEvent(event.id!)}
                    >
                      Apply change <ArrowRight size={15} />
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </section>
        <aside className="timeline-aside">
          <div className="sticky-card">
            <p className="eyebrow">Assessment state</p>
            <strong>Profile v{assessment.version}</strong>
            <span>
              {eventIds.length} of {demoEvents.length} changes applied
            </span>
            <div className="micro-progress">
              <span
                style={{
                  width: `${(eventIds.length / demoEvents.length) * 100}%`,
                }}
              />
            </div>
            <p>
              Changes are applied chronologically and every conclusion creates a
              new version.
            </p>
          </div>
        </aside>
      </div>
      {eventIds.length ? <ProtectionDiff eventIds={eventIds} /> : null}
    </div>
  );
}
