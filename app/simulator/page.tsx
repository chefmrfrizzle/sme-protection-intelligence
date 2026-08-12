"use client";

import {
  ArrowRight,
  Check,
  Cloud,
  Factory,
  Globe2,
  PackagePlus,
  Play,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ProtectionDiff } from "@/components/protection-diff";
import { StatusBadge } from "@/components/status-badge";
import { useDemo } from "@/components/demo-provider";
import { demoEvents, eventPresentation } from "@/demo/events";

const icons = [Factory, PackagePlus, Users, Cloud, Globe2];

export default function SimulatorPage() {
  const { assessment, eventIds, hasEvent, applyEvent } = useDemo();
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Scenario simulator"
        title="What if my business changes?"
        description="Preview synthetic operating changes through the same deterministic reconciliation engine. Simulated events are clearly separated from production evidence."
      />
      <div className="simulator-banner">
        <Play size={17} />
        <div>
          <strong>Interactive demo surface</strong>
          <span>
            Every control applies a seeded, synthetic canonical event. No
            external system is changed.
          </span>
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
              onClick={() => applyEvent(event.id!)}
              disabled={applied}
            >
              <span className="scenario-icon">
                <Icon size={20} />
              </span>
              <span>
                <strong>{presentation.title}</strong>
                <small>{presentation.diff}</small>
              </span>
              {applied ? <Check size={17} /> : <ArrowRight size={17} />}
            </button>
          );
        })}
      </section>
      <ProtectionDiff eventIds={eventIds} />
      <section className="simulator-results">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Resulting assessment</p>
            <h2>{assessment.findings.length} findings or abstentions</h2>
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
                <a className="text-link" href={`/findings/${finding.id}`}>
                  Inspect <ArrowRight size={14} />
                </a>
              </article>
            ))}
          </div>
        ) : (
          <div className="inline-empty">
            <Check size={18} />
            <span>
              No material drift is present in the current simulated profile.
            </span>
          </div>
        )}
      </section>
    </div>
  );
}
