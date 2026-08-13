"use client";

import Link from "next/link";
import { ArrowRight, BookOpenText, CheckCircle2, Info } from "lucide-react";
import { AlignmentRing } from "@/components/alignment-ring";
import { DomainCard, domainName } from "@/components/domain-card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { useDemo } from "@/components/demo-provider";
import { ViewLens } from "@/components/view-lens";

export default function ProtectionPage() {
  const { assessment, lens } = useDemo();
  const evidencePresent = assessment.domains.reduce(
    (total, domain) => total + domain.evidencePresent,
    0,
  );
  const evidenceRequired = assessment.domains.reduce(
    (total, domain) => total + domain.evidenceRequired,
    0,
  );
  const profileCopy = {
    simple:
      "A clear view of the business areas checked and anything that may need attention.",
    insurance:
      "Explicit assessment states across the current in-scope exposure and protection evidence.",
    evidence:
      "Evidence completeness and source-linked assessment results for every in-scope domain.",
  }[lens];
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={assessment.label}
        title="Protection profile"
        description={profileCopy}
        actions={
          <div className="page-control-row">
            <ViewLens />
            <Link className="button secondary" href="/glossary">
              <BookOpenText size={15} /> Language guide
            </Link>
          </div>
        }
      />
      <section className="profile-summary">
        <AlignmentRing value={assessment.alignment} size="small" />
        <div>
          <h2>{assessment.alignment}% evidence-aligned</h2>
          <p>
            {lens === "simple"
              ? "How closely the current business information supports alignment with the protection records supplied."
              : lens === "insurance"
                ? "60% explicit alignment state plus 40% evidence completeness across four in-scope domains."
                : `${evidencePresent} of ${evidenceRequired} required evidence checks are currently available.`}
          </p>
        </div>
        <div className="method-note">
          <Info size={17} />
          <span>
            {lens === "simple"
              ? "This does not confirm coverage or predict a claim decision."
              : "Not an underwriting, loss, pricing, claim, credit, or insurer risk score."}
          </span>
        </div>
      </section>
      <div className="domain-grid">
        {assessment.domains.map((domain) => (
          <DomainCard
            domain={domain}
            lens={lens}
            finding={assessment.findings.find((finding) =>
              domain.findingIds.includes(finding.id),
            )}
            key={domain.domain}
          />
        ))}
      </div>
      <section className="table-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Evaluated checks</p>
            <h2>
              {lens === "simple"
                ? "Areas checked"
                : lens === "insurance"
                  ? "Protection state register"
                  : "Evidence completeness by area"}
            </h2>
          </div>
        </div>
        <div
          className="responsive-table"
          role="table"
          aria-label="Protection checks"
        >
          <div className="table-row table-header" role="row">
            <span role="columnheader">
              {lens === "simple" ? "Area" : "Domain"}
            </span>
            <span role="columnheader">Current state</span>
            <span role="columnheader">
              {lens === "evidence" ? "Checklist" : "Information checked"}
            </span>
            <span role="columnheader">Next step</span>
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
