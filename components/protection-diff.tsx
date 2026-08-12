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
          <p className="eyebrow">Baseline comparison</p>
          <h2>How the business changed</h2>
        </div>
        <div className="version-pair">
          <span>Starting profile</span>
          <ArrowRight aria-hidden="true" size={16} />
          <strong>Current v{eventIds.length + 1}</strong>
        </div>
      </div>
      <div
        className="change-summary-grid"
        role="list"
        aria-label="Business profile comparison"
      >
        {rows.map(([label, before, after]) => (
          <div
            className={`change-summary-card ${before !== after ? "changed" : ""}`}
            role="listitem"
            key={label}
          >
            <span className="diff-label">{label}</span>
            <div>
              <span>{before}</span>
              <ArrowRight aria-hidden="true" size={15} />
              <strong>{after}</strong>
            </div>
            <small>{before !== after ? "Changed" : "No change"}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
