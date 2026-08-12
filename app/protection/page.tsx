"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Info } from "lucide-react";
import { AlignmentRing } from "@/components/alignment-ring";
import { DomainCard, domainName } from "@/components/domain-card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { useDemo } from "@/components/demo-provider";

export default function ProtectionPage() {
  const { assessment } = useDemo();
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={assessment.label}
        title="Protection profile"
        description="Explicit assessed states across the current in-scope evidence and exposure domains."
      />
      <section className="profile-summary">
        <AlignmentRing value={assessment.alignment} size="small" />
        <div>
          <h2>{assessment.alignment}% evidence-aligned</h2>
          <p>
            Methodology: 60% explicit alignment state plus 40% evidence
            completeness, averaged across the four in-scope domains.
          </p>
        </div>
        <div className="method-note">
          <Info size={17} />
          <span>
            Not an underwriting, loss, pricing, claim, credit, or insurer risk
            score.
          </span>
        </div>
      </section>
      <div className="domain-grid">
        {assessment.domains.map((domain) => (
          <DomainCard domain={domain} key={domain.domain} />
        ))}
      </div>
      <section className="table-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Evaluated checks</p>
            <h2>Protection state register</h2>
          </div>
        </div>
        <div
          className="responsive-table"
          role="table"
          aria-label="Protection state register"
        >
          <div className="table-row table-header" role="row">
            <span role="columnheader">Domain</span>
            <span role="columnheader">State</span>
            <span role="columnheader">Evidence</span>
            <span role="columnheader">Action</span>
          </div>
          {assessment.domains.map((domain) => (
            <div className="table-row" role="row" key={domain.domain}>
              <strong role="cell">{domainName(domain.domain)}</strong>
              <span role="cell">
                <StatusBadge state={domain.state} compact />
              </span>
              <span role="cell">
                {domain.evidencePresent} of {domain.evidenceRequired} checklist
                items
              </span>
              <span role="cell">
                {domain.findingIds[0] ? (
                  <Link
                    className="text-link"
                    href={`/findings/${domain.findingIds[0]}`}
                  >
                    Review <ArrowRight size={14} />
                  </Link>
                ) : (
                  <span className="aligned-inline">
                    <CheckCircle2 size={14} /> No action
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
