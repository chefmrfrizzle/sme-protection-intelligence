import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  CircleHelp,
  FileQuestion,
  Scale,
  type LucideIcon,
} from "lucide-react";
import type { ProtectionState } from "@/domain/types";

const stateMeta: Record<ProtectionState, { label: string; icon: LucideIcon }> =
  {
    ALIGNED: { label: "Aligned", icon: CheckCircle2 },
    REVIEW_RECOMMENDED: { label: "Review recommended", icon: AlertCircle },
    POTENTIAL_GAP: { label: "Potential gap", icon: AlertTriangle },
    EVIDENCE_INCOMPLETE: { label: "Evidence incomplete", icon: FileQuestion },
    EVIDENCE_CONFLICT: { label: "Evidence conflict", icon: AlertTriangle },
    POLICY_INTERPRETATION_REQUIRED: {
      label: "Interpretation required",
      icon: Scale,
    },
    NOT_ASSESSED: { label: "Not assessed", icon: CircleHelp },
  };

export function StatusBadge({
  state,
  compact = false,
}: {
  state: ProtectionState;
  compact?: boolean;
}) {
  const meta = stateMeta[state];
  const Icon = meta.icon;
  return (
    <span
      className={`status-badge state-${state.toLowerCase()} ${compact ? "compact" : ""}`}
    >
      <Icon aria-hidden="true" size={compact ? 13 : 15} />
      {meta.label}
    </span>
  );
}

export function stateLabel(state: ProtectionState) {
  return stateMeta[state].label;
}
