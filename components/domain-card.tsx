import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { DomainAssessment, ProtectionDomain } from "@/domain/types";
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

export function DomainCard({ domain }: { domain: DomainAssessment }) {
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
      <p>{domain.sentence}</p>
      <div className="domain-completeness">
        <span>
          Evidence {domain.evidencePresent}/{domain.evidenceRequired}
        </span>
        <span>{domain.score}% aligned</span>
      </div>
      <div className="micro-progress" aria-hidden="true">
        <span style={{ width: `${domain.score}%` }} />
      </div>
    </Link>
  );
}
