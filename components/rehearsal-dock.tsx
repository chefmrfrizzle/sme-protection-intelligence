"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  CircleStop,
  ExternalLink,
  MousePointer2,
  Pause,
  Play,
  Quote,
  ShieldCheck,
} from "lucide-react";
import { useRehearsal } from "./rehearsal-provider";
import { useOpenRehearsalScene } from "./use-rehearsal-scene";
import {
  DEMO_DURATION_SECONDS,
  demoScenes,
  formatDemoTime,
} from "@/domain/rehearsal/demo-script";

export function RehearsalDock() {
  const pathname = usePathname();
  const [minimized, setMinimized] = useState(false);
  const openRehearsalScene = useOpenRehearsalScene();
  const {
    active,
    running,
    elapsedSeconds,
    sceneIndex,
    stop,
    pause,
    resume,
    next,
    previous,
  } = useRehearsal();

  if (!active || pathname === "/rehearsal") return null;

  const scene = demoScenes[sceneIndex];
  const progress = Math.min(
    100,
    Math.round((elapsedSeconds / DEMO_DURATION_SECONDS) * 100),
  );

  const openScene = () => {
    openRehearsalScene(scene);
    if (
      scene.setup === "OPEN_PROFESSIONAL_REVIEW" ||
      scene.setup === "OPEN_REPORT" ||
      scene.setup === "OPEN_AUDIT"
    ) {
      setMinimized(true);
    }
  };

  return (
    <aside
      className={`rehearsal-dock ${minimized ? "minimized" : ""}`}
      aria-label="Demo rehearsal coach"
      data-testid="rehearsal-dock"
    >
      <header>
        <div>
          <span className="rehearsal-live-dot" aria-hidden="true" />
          <strong>Demo rehearsal</strong>
          <span>
            Cue {sceneIndex + 1}/{demoScenes.length}
          </span>
        </div>
        <div className="rehearsal-timer" aria-label="Elapsed rehearsal time">
          {formatDemoTime(elapsedSeconds)}
          <small>/ 3:00</small>
        </div>
        <button
          className="rehearsal-icon-button"
          type="button"
          onClick={() => setMinimized((current) => !current)}
          aria-label={
            minimized ? "Expand rehearsal coach" : "Minimize rehearsal coach"
          }
        >
          {minimized ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
        </button>
      </header>
      <div className="rehearsal-progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>
      {minimized ? null : (
        <div className="rehearsal-dock-body">
          <div className="rehearsal-cue-heading">
            <span>
              {formatDemoTime(scene.startSeconds)}–
              {formatDemoTime(scene.endSeconds)}
            </span>
            <h2>{scene.title}</h2>
          </div>
          <div className="rehearsal-narration">
            <Quote aria-hidden="true" size={16} />
            <p>{scene.narration}</p>
          </div>
          <div className="rehearsal-click-cue">
            <MousePointer2 aria-hidden="true" size={16} />
            <div>
              <strong>Operator clicks</strong>
              <span>{scene.clickInstruction}</span>
            </div>
          </div>
          <div className="rehearsal-safe-phrase">
            <ShieldCheck aria-hidden="true" size={14} />
            Safe phrase: “{scene.safePhrase}”
          </div>
          <details className="rehearsal-fallback">
            <summary>Fallback if the screen does not cooperate</summary>
            <p>{scene.fallbackAction}</p>
            <span>Say: “{scene.fallbackNarration}”</span>
          </details>
          <div className="rehearsal-dock-actions">
            <button
              className="button secondary"
              type="button"
              onClick={openScene}
              data-testid="rehearsal-open-scene"
            >
              <ExternalLink size={15} /> Open cue
            </button>
            <button
              className="button primary"
              type="button"
              onClick={next}
              disabled={sceneIndex === demoScenes.length - 1}
              data-testid="rehearsal-next"
            >
              Next cue <ArrowRight size={15} />
            </button>
          </div>
          <footer>
            <button
              type="button"
              onClick={previous}
              disabled={sceneIndex === 0}
            >
              <ArrowLeft size={14} /> Previous
            </button>
            <button type="button" onClick={running ? pause : resume}>
              {running ? <Pause size={14} /> : <Play size={14} />}
              {running ? "Pause timer" : "Resume timer"}
            </button>
            <button type="button" onClick={stop}>
              <CircleStop size={14} /> Exit
            </button>
          </footer>
        </div>
      )}
    </aside>
  );
}
