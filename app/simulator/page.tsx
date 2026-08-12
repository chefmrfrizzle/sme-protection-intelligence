"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  Cloud,
  Factory,
  Globe2,
  PackagePlus,
  Play,
  RotateCcw,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ProtectionDiff } from "@/components/protection-diff";
import { StatusBadge } from "@/components/status-badge";
import { useDemo } from "@/components/demo-provider";
import { demoEvents, eventPresentation } from "@/demo/events";

const icons = [Factory, PackagePlus, Users, Cloud, Globe2];

export default function SimulatorPage() {
  const { assessment, eventIds, hasEvent, toggleEvent, applyAll, reset } =
    useDemo();
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Scenario simulator"
        title="Explore a business change"
        description="Select one or more synthetic changes to see what may need review. Select a change again to remove it."
      />
      <div className="simulator-banner">
        <Play size={17} />
        <div>
          <strong>Demo controls</strong>
          <span>
            These scenarios are synthetic. No external system is changed.
          </span>
        </div>
        <div className="simulator-actions">
          <button className="button secondary" type="button" onClick={reset}>
            <RotateCcw size={15} /> Reset
          </button>
          <button className="button primary" type="button" onClick={applyAll}>
            <Play size={15} /> Run all
          </button>
        </div>
      </div>
      <section className="scenario-grid">
        {demoEvents.map((event, index) => {
          const presentation = eventPresentation[event.id!];
          const Icon = icons[index] ?? Users;
          const applied = hasEvent(event.id!);
          return (
            <button
              className={`scenario-card ${applied ? "selected" : ""}`}
              type="button"
              key={event.id}
              onClick={() => toggleEvent(event.id!)}
              aria-pressed={applied}
              aria-label={`${applied ? "Remove" : "Add"} ${presentation.title} ${applied ? "from" : "to"} scenario`}
            >
              <span className="scenario-icon">
                <Icon size={20} />
              </span>
              <span>
                <strong>{presentation.title}</strong>
                <small>{presentation.diff}</small>
              </span>
              <span className="scenario-state">
                {applied ? (
                  <>
                    <Check size={15} /> Selected
                  </>
                ) : (
                  <ArrowRight size={17} />
                )}
              </span>
            </button>
          );
        })}
      </section>
      <ProtectionDiff eventIds={eventIds} />
      <section className="simulator-results">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Scenario result</p>
            <h2>
              {assessment.findings.length
                ? `${assessment.findings.length} ${assessment.findings.length === 1 ? "item" : "items"} to review`
                : "No items need review"}
            </h2>
          </div>
        </div>
        {assessment.findings.length ? (
          <div className="result-list">
            {assessment.findings.map((finding) => (
              <article key={finding.id}>
                <div>
                  <StatusBadge state={finding.state} compact />
                  <h3>{finding.title}</h3>
                  <p>{finding.simpleExplanation}</p>
                </div>
                <Link className="text-link" href={`/findings/${finding.id}`}>
                  Review <ArrowRight size={14} />
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="inline-empty">
            <Check size={18} />
            <span>No selected change currently requires review.</span>
          </div>
        )}
      </section>
    </div>
  );
}
