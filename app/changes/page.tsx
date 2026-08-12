"use client";

import Link from "next/link";
import { ArrowRight, Check, Play, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ProtectionDiff } from "@/components/protection-diff";
import { useDemo } from "@/components/demo-provider";
import { ViewLens } from "@/components/view-lens";
import {
  demoEvents,
  eventPresentation,
  findingIdByEventId,
} from "@/demo/events";

export default function ChangesPage() {
  const { assessment, eventIds, lens, hasEvent, applyEvent, applyAll, reset } =
    useDemo();
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Business change timeline"
        title="Changes"
        description={
          lens === "simple"
            ? "See what changed in the business and whether anything needs attention."
            : lens === "insurance"
              ? "Material operating changes reconciled against the supplied protection evidence."
              : "Each change is linked to its source records, rule result and assessment version."
        }
        actions={
          <div className="button-row page-control-row">
            <ViewLens />
            <button className="button secondary" type="button" onClick={reset}>
              <RotateCcw size={16} /> Reset
            </button>
            <button className="button primary" type="button" onClick={applyAll}>
              <Play size={16} /> Run full storyline
            </button>
          </div>
        }
      />

      <section className="change-progress" aria-label="Demo progress">
        <div>
          <span>Demo progress</span>
          <strong>
            {eventIds.length} of {demoEvents.length} changes included
          </strong>
        </div>
        <div className="micro-progress">
          <span
            style={{ width: `${(eventIds.length / demoEvents.length) * 100}%` }}
          />
        </div>
        <small>Current assessment v{assessment.version}</small>
      </section>

      <section className="change-list" aria-label="Synthetic change events">
        {demoEvents.map((event, index) => {
          const applied = hasEvent(event.id!);
          const presentation = eventPresentation[event.id!];
          const relatedFinding = assessment.findings.find(
            (finding) => finding.id === findingIdByEventId[event.id!],
          );
          const explanation =
            lens === "simple"
              ? presentation.detail
              : lens === "insurance"
                ? (relatedFinding?.insuranceExplanation ??
                  `Configured materiality rules will evaluate the ${presentation.affected.toLowerCase()} exposure.`)
                : `${event.evidenceReferences.length} source records linked: ${event.evidenceReferences.join(", ")}.`;
          return (
            <article
              className={`change-row ${applied ? "applied" : ""}`}
              key={event.id}
            >
              <div className="change-index" aria-hidden="true">
                {applied ? (
                  <Check size={15} />
                ) : (
                  String(index + 1).padStart(2, "0")
                )}
              </div>
              <div className="change-main">
                <span className="change-date">
                  {new Date(event.observedAt).toLocaleDateString("en-SG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  {" · "}
                  {event.source.name}
                </span>
                <h2>{presentation.title}</h2>
                <p>{explanation}</p>
                <span className="change-domain">{presentation.affected}</span>
              </div>
              <div className="change-value">
                <span>Business change</span>
                <strong>{presentation.diff}</strong>
              </div>
              <div className="change-action">
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
                      <Check size={14} /> Included
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
      {eventIds.length ? <ProtectionDiff eventIds={eventIds} /> : null}
    </div>
  );
}
