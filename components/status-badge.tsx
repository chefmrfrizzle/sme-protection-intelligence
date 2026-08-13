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
import { stateLabel } from "@/domain/language/insurance-language";

const stateMeta: Record<ProtectionState, { icon: LucideIcon }> = {
  ALIGNED: { icon: CheckCircle2 },
  REVIEW_RECOMMENDED: { icon: AlertCircle },
  POTENTIAL_GAP: { icon: AlertTriangle },
  EVIDENCE_INCOMPLETE: { icon: FileQuestion },
  EVIDENCE_CONFLICT: { icon: AlertTriangle },
  POLICY_INTERPRETATION_REQUIRED: { icon: Scale },
  NOT_ASSESSED: { icon: CircleHelp },
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
      title={stateLabel(state)}
    >
      <Icon aria-hidden="true" size={compact ? 13 : 15} />
      {stateLabel(state)}
    </span>
  );
}
