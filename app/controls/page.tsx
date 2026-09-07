import {
  ArchiveRestore,
  CheckCircle2,
  FileKey2,
  Fingerprint,
  Network,
  ScanSearch,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { Disclaimer } from "@/components/disclaimer";
import { PageHeader } from "@/components/page-header";

const controls = [
  {
    id: "BN-01",
    title: "Trusted reports and review",
    icon: ShieldCheck,
    status: "VALIDATED IN SYNTHETIC DEMO",
    explanation:
      "A saved report uses the review events stored on the server. A browser cannot rewrite the professional-review state in a signed-in report.",
  },
  {
    id: "BN-02",
    title: "Approved people and roles",
    icon: UsersRound,
    status: "MAPPING-READY",
    explanation:
      "Signing in proves identity; an accepted, active membership decides what that person may do. Uninvited, expired, and revoked identities fail closed.",
  },
  {
    id: "BN-03",
    title: "Sealed event intake",
    icon: FileKey2,
    status: "VALIDATED IN SYNTHETIC TESTS",
    explanation:
      "External change events are signed, time-limited, tenant-bound, replay-resistant, and idempotent before they create durable work.",
  },
  {
    id: "BN-04",
    title: "Evidence lifecycle",
    icon: ScanSearch,
    status: "MAPPING-READY",
    explanation:
      "Synthetic files are quarantined, type-checked, hashed, scanned, versioned, privately downloaded, retained, and erased through an audited tombstone flow.",
  },
  {
    id: "BN-05",
    title: "Facts with receipts",
    icon: Network,
    status: "VALIDATED IN SYNTHETIC TESTS",
    explanation:
      "Every material fact keeps its document version and exact source span. Conflicts remain conflicts, and corrections append instead of rewriting history.",
  },
  {
    id: "BN-06",
    title: "Tamper-evident audit",
    icon: Fingerprint,
    status: "MAPPING-READY",
    explanation:
      "Production-oriented receipts use canonical SHA-256 inputs, and material database records have append-only enforcement in the migration design.",
  },
  {
    id: "BN-07",
    title: "Reliable outbound delivery",
    icon: ArchiveRestore,
    status: "VALIDATED IN SYNTHETIC TESTS",
    explanation:
      "A committed review writes an outbound event in the same transaction. Delivery is signed, bounded, retried, dead-lettered, and replayable without changing its identity.",
  },
  {
    id: "BN-08",
    title: "Tenant isolation",
    icon: CheckCircle2,
    status: "MAPPING-READY",
    explanation:
      "Tenant scope is present in keys and foreign keys, routes fail closed, and Data API access is revoked. Live two-tenant database proof is still required.",
  },
] as const;

export default function ControlsPage() {
  return (
    <div className="page-stack controls-page">
      <PageHeader
        eyebrow="Build-now trust programme"
        title="Control centre"
        description="A plain-English view of the safeguards around the synthetic protection-intelligence demo—and what still needs customer-environment proof."
        actions={
          <span className="connection-badge">
            <ShieldCheck size={14} /> Decision support only
          </span>
        }
      />

      <section className="case-summary-card control-summary">
        <div>
          <p className="eyebrow">Current engineering position</p>
          <h2>Core trust substrate built</h2>
          <p>
            The controls are executable in the synthetic application. None is
            described as live in a customer or insurer environment until its
            target-environment tests and approvals exist.
          </p>
        </div>
        <dl>
          <div>
            <dt>Workstreams</dt>
            <dd>8</dd>
          </div>
          <div>
            <dt>Live claims</dt>
            <dd>0</dd>
          </div>
          <div>
            <dt>Safety boundary</dt>
            <dd>On</dd>
          </div>
        </dl>
      </section>

      <section className="controls-grid" aria-label="BUILD NOW controls">
        {controls.map(({ id, title, icon: Icon, status, explanation }) => (
          <article className="control-card" key={id}>
            <div className="control-card-top">
              <span className="control-icon">
                <Icon size={18} aria-hidden="true" />
              </span>
              <span className="control-id">{id}</span>
            </div>
            <h2>{title}</h2>
            <span className="readiness-badge">{status}</span>
            <p>{explanation}</p>
          </article>
        ))}
      </section>

      <section className="control-boundary">
        <div>
          <p className="eyebrow">What this product may do</p>
          <h2>Detect, explain, preserve uncertainty, and route</h2>
          <p>
            It can compare validated facts with versioned programme evidence,
            show the rule trace, request missing evidence, and prepare a package
            for an authorized professional.
          </p>
        </div>
        <div>
          <p className="eyebrow">What it must never do</p>
          <h2>Make an insurance or legal decision</h2>
          <p>
            It cannot confirm or deny coverage, bind or price insurance, decide
            a claim, provide legal advice, or silently choose between
            contradictory evidence.
          </p>
        </div>
      </section>

      <Disclaimer />
    </div>
  );
}
