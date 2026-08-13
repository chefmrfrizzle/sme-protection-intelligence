"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  DEMO_DURATION_SECONDS,
  demoScenes,
  sceneIndexAtElapsed,
} from "@/domain/rehearsal/demo-script";

const REHEARSAL_STORAGE_KEY = "product-rehearsal-state-v1";

type RehearsalContextValue = {
  active: boolean;
  running: boolean;
  elapsedSeconds: number;
  sceneIndex: number;
  start: (running?: boolean) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  previous: () => void;
  jumpTo: (index: number) => void;
};

const RehearsalContext = createContext<RehearsalContextValue | null>(null);

export function RehearsalProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);
  const [running, setRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const elapsedRef = useRef(0);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const raw = window.sessionStorage.getItem(REHEARSAL_STORAGE_KEY);
        if (raw) {
          const stored = JSON.parse(raw) as {
            active?: boolean;
            running?: boolean;
            elapsedSeconds?: number;
          };
          const storedElapsed = Math.max(
            0,
            Math.min(DEMO_DURATION_SECONDS, stored.elapsedSeconds ?? 0),
          );
          elapsedRef.current = storedElapsed;
          setActive(Boolean(stored.active));
          setRunning(Boolean(stored.running));
          setElapsedSeconds(storedElapsed);
        }
      } catch {
        // Rehearsal remains usable when session storage is unavailable.
      }
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.sessionStorage.setItem(
        REHEARSAL_STORAGE_KEY,
        JSON.stringify({ active, running, elapsedSeconds }),
      );
    } catch {
      // Rehearsal remains usable when session storage is unavailable.
    }
  }, [active, elapsedSeconds, hydrated, running]);

  useEffect(() => {
    if (!active || !running) return;
    const timer = window.setInterval(() => {
      const nextElapsed = Math.min(
        DEMO_DURATION_SECONDS,
        elapsedRef.current + 1,
      );
      elapsedRef.current = nextElapsed;
      setElapsedSeconds(nextElapsed);
      if (nextElapsed >= DEMO_DURATION_SECONDS) {
        setRunning(false);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [active, running]);

  const start = useCallback((shouldRun = true) => {
    elapsedRef.current = 0;
    setElapsedSeconds(0);
    setActive(true);
    setRunning(shouldRun);
  }, []);

  const stop = useCallback(() => {
    elapsedRef.current = 0;
    setActive(false);
    setRunning(false);
    setElapsedSeconds(0);
  }, []);

  const pause = useCallback(() => setRunning(false), []);
  const resume = useCallback(() => {
    setActive(true);
    setRunning(true);
  }, []);

  const jumpTo = useCallback((index: number) => {
    const scene =
      demoScenes[Math.max(0, Math.min(demoScenes.length - 1, index))];
    setActive(true);
    elapsedRef.current = scene.startSeconds;
    setElapsedSeconds(scene.startSeconds);
  }, []);

  const sceneIndex = sceneIndexAtElapsed(elapsedSeconds);
  const next = useCallback(
    () => jumpTo(Math.min(demoScenes.length - 1, sceneIndex + 1)),
    [jumpTo, sceneIndex],
  );
  const previous = useCallback(
    () => jumpTo(Math.max(0, sceneIndex - 1)),
    [jumpTo, sceneIndex],
  );

  const value = useMemo<RehearsalContextValue>(
    () => ({
      active,
      running,
      elapsedSeconds,
      sceneIndex,
      start,
      stop,
      pause,
      resume,
      next,
      previous,
      jumpTo,
    }),
    [
      active,
      elapsedSeconds,
      jumpTo,
      next,
      pause,
      previous,
      resume,
      running,
      sceneIndex,
      start,
      stop,
    ],
  );

  return (
    <RehearsalContext.Provider value={value}>
      {children}
    </RehearsalContext.Provider>
  );
}

export function useRehearsal() {
  const context = useContext(RehearsalContext);
  if (!context) {
    throw new Error("useRehearsal must be used inside RehearsalProvider");
  }
  return context;
}
