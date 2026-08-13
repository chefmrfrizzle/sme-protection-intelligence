"use client";

import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Clock3,
  MousePointer2,
  Play,
  RotateCcw,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useDemo } from "@/components/demo-provider";
import { useRehearsal } from "@/components/rehearsal-provider";
import { useOpenRehearsalScene } from "@/components/use-rehearsal-scene";
import { demoScenes, formatDemoTime } from "@/domain/rehearsal/demo-script";

export default function RehearsalPage() {
  const router = useRouter();
  const { reset, setLens } = useDemo();
  const { start, jumpTo } = useRehearsal();
  const openRehearsalScene = useOpenRehearsalScene();

  const begin = (timed: boolean) => {
    reset();
    setLens("simple");
    start(timed);
    router.push("/overview");
  };

  const openCue = (index: number) => {
    jumpTo(index);
    openRehearsalScene(demoScenes[index]);
  };

  return (
    <div className="page-stack rehearsal-page">
      <PageHeader
        eyebrow="Presenter mode"
        title="Three-minute demo rehearsal"
        description="A timed, insurance-safe walkthrough of the exact production flow—from reset to the assessment receipt."
        actions={
          <div className="button-row">
            <button
              className="button secondary"
              type="button"
              onClick={() => begin(false)}
            >
              <RotateCcw size={16} /> Practice untimed
            </button>
            <button
              className="button primary"
              type="button"
              onClick={() => begin(true)}
              data-testid="start-rehearsal"
            >
              <Play size={16} /> Start timed rehearsal
            </button>
          </div>
        }
      />

      <section className="rehearsal-brief" aria-label="Rehearsal summary">
        <div>
          <Clock3 aria-hidden="true" size={20} />
          <span>Exact runtime</span>
          <strong>3:00</strong>
        </div>
        <div>
          <MousePointer2 aria-hidden="true" size={20} />
          <span>Presenter cues</span>
          <strong>{demoScenes.length}</strong>
        </div>
        <div>
          <ShieldCheck aria-hidden="true" size={20} />
          <span>Run mode</span>
          <strong>Replay</strong>
        </div>
        <p>
          Keep the rehearsal coach open during the demo. It follows you across
          pages and gives you the exact line, click, safe phrase, and fallback
          for the current timestamp.
        </p>
      </section>

      <section className="rehearsal-language-boundary">
        <ShieldCheck aria-hidden="true" size={19} />
        <div>
          <strong>Language boundary</strong>
          <span>
            Say “potential protection gap,” “available evidence,” and
            “professional review.” Never say the system confirms coverage,
            declares a location uninsured, or decides a claim.
          </span>
        </div>
      </section>

      <section className="rehearsal-runbook" aria-labelledby="runbook-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Exact run of show</p>
            <h2 id="runbook-title">Reset → receipt in ten cues</h2>
          </div>
          <span className="rehearsal-runbook-note">
            Use the fallback instead of improvising if a scene overruns.
          </span>
        </div>
        <ol className="rehearsal-scene-list">
          {demoScenes.map((scene, index) => (
            <li key={scene.id}>
              <div className="rehearsal-scene-time">
                <strong>{formatDemoTime(scene.startSeconds)}</strong>
                <span>{formatDemoTime(scene.endSeconds)}</span>
              </div>
              <div className="rehearsal-scene-copy">
                <span className="rehearsal-scene-number">
                  Cue {(index + 1).toString().padStart(2, "0")}
                </span>
                <h3>{scene.title}</h3>
                <div className="rehearsal-script-line">
                  <strong>Say</strong>
                  <p>“{scene.narration}”</p>
                </div>
                <div className="rehearsal-operator-line">
                  <MousePointer2 aria-hidden="true" size={15} />
                  <span>{scene.clickInstruction}</span>
                </div>
                <details>
                  <summary>
                    <TriangleAlert aria-hidden="true" size={14} /> Fallback
                  </summary>
                  <p>{scene.fallbackAction}</p>
                  <span>Say: “{scene.fallbackNarration}”</span>
                </details>
              </div>
              <button
                className="button secondary rehearsal-open-cue"
                type="button"
                onClick={() => openCue(index)}
                aria-label={`Open cue ${index + 1}: ${scene.title}`}
              >
                Open cue <ArrowRight size={14} />
              </button>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
