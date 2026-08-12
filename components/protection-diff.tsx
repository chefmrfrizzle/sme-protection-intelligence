import { ArrowRight } from "lucide-react";
import { protectionDiff } from "@/domain/reconciliation/engine";

export function ProtectionDiff({ eventIds }: { eventIds: string[] }) {
  const diff = protectionDiff(eventIds);
  const rows = [
    [
      "Operating locations",
      String(diff.locations.before),
      String(diff.locations.after),
    ],
    [
      "Observed assets",
      `S$${Math.round(diff.assetValueSgd.before / 1000)}k`,
      `S$${Math.round(diff.assetValueSgd.after / 1000)}k`,
    ],
    [
      "Critical supplier dependency",
      `${diff.supplierConcentrationPct.before}%`,
      `${diff.supplierConcentrationPct.after}%`,
    ],
    [
      "Critical cloud dependencies",
      String(diff.cloudDependencies.before),
      String(diff.cloudDependencies.after),
    ],
    [
      "Operating territories",
      diff.territories.before.join(" + "),
      diff.territories.after.join(" + "),
    ],
  ];
  return (
    <div className="diff-panel">
      <div className="diff-heading">
        <div>
          <p className="eyebrow">Protection Diff</p>
          <h2>What changed since the baseline</h2>
        </div>
        <div className="version-pair">
          <span>Profile v1</span>
          <ArrowRight aria-hidden="true" size={16} />
          <strong>Profile v{eventIds.length + 1}</strong>
        </div>
      </div>
      <div
        className="diff-table"
        role="table"
        aria-label="Protection profile changes"
      >
        {rows.map(([label, before, after]) => (
          <div
            className={`diff-row ${before !== after ? "changed" : ""}`}
            role="row"
            key={label}
          >
            <span className="diff-label" role="cell">
              {label}
            </span>
            <span role="cell">{before}</span>
            <ArrowRight aria-hidden="true" size={15} />
            <strong role="cell">{after}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
