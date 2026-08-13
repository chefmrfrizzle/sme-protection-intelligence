import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ExplanationLens } from "./demo-provider";
import type {
  DomainAssessment,
  Finding,
  ProtectionDomain,
} from "@/domain/types";
import { StatusBadge } from "./status-badge";
import { protectionDomainLabel } from "@/domain/language/insurance-language";

export function domainName(domain: ProtectionDomain) {
  return protectionDomainLabel(domain);
}

const alignedSimpleCopy: Record<ProtectionDomain, string> = {
  CYBER:
    "The supplied cyber information supports alignment for the technology setup assessed.",
  PROPERTY_ASSETS:
    "The supplied schedule supports alignment for the locations and asset values assessed.",
  SUPPLY_CHAIN:
    "No material supplier-dependency change was identified in the records assessed.",
  BUSINESS_CONTINUITY:
    "The supplied evidence supports alignment for the critical sites and dependencies assessed.",
};

function domainDescription(
  domain: DomainAssessment,
  lens: ExplanationLens,
  finding?: Finding,
) {
  if (lens === "evidence") {
    return `${domain.evidencePresent} of ${domain.evidenceRequired} required checks have supporting information.${finding?.missingEvidence.length ? ` ${finding.missingEvidence.length} evidence request${finding.missingEvidence.length === 1 ? "" : "s"} remain.` : ""}`;
  }
  if (lens === "insurance") {
    return finding?.insuranceExplanation ?? domain.sentence;
  }
  return finding?.simpleExplanation ?? alignedSimpleCopy[domain.domain];
}

export function DomainCard({
  domain,
  lens = "simple",
  finding,
}: {
  domain: DomainAssessment;
  lens?: ExplanationLens;
  finding?: Finding;
}) {
  const findingHref = domain.findingIds[0]
    ? `/findings/${domain.findingIds[0]}`
    : "/protection";
  return (
    <Link className="domain-card" href={findingHref}>
      <div className="domain-card-top">
        <h3>{protectionDomainLabel(domain.domain)}</h3>
        <ArrowUpRight aria-hidden="true" size={17} />
      </div>
      <StatusBadge state={domain.state} compact />
      <p>{domainDescription(domain, lens, finding)}</p>
      <div className="domain-completeness">
        <span>
          {lens === "simple" ? "Information checked" : "Evidence"}{" "}
          {domain.evidencePresent}/{domain.evidenceRequired}
        </span>
        {lens === "simple" ? null : <span>{domain.score}% aligned</span>}
      </div>
      {lens === "simple" ? null : (
        <div className="micro-progress" aria-hidden="true">
          <span style={{ width: `${domain.score}%` }} />
        </div>
      )}
    </Link>
  );
}
