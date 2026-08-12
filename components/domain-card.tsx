import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ExplanationLens } from "./demo-provider";
import type {
  DomainAssessment,
  Finding,
  ProtectionDomain,
} from "@/domain/types";
import { StatusBadge } from "./status-badge";

const domainNames: Record<ProtectionDomain, string> = {
  CYBER: "Cyber",
  PROPERTY_ASSETS: "Assets",
  SUPPLY_CHAIN: "Supply Chain",
  BUSINESS_CONTINUITY: "Business Continuity",
};

export function domainName(domain: ProtectionDomain) {
  return domainNames[domain];
}

const alignedSimpleCopy: Record<ProtectionDomain, string> = {
  CYBER:
    "Your current cyber information matches the technology setup we assessed.",
  PROPERTY_ASSETS:
    "Your listed locations and asset values match the records supplied.",
  SUPPLY_CHAIN: "No major supplier-dependency change was found.",
  BUSINESS_CONTINUITY:
    "Your critical sites and dependencies match the records supplied.",
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
        <h3>{domainNames[domain.domain]}</h3>
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
