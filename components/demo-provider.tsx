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
import { buildAssessment } from "@/domain/reconciliation/engine";
import { demoHash } from "@/domain/reconciliation/hash";
import type { Assessment, ReviewStatus } from "@/domain/types";
import type { OrganizationRole } from "@/domain/authorization";
import { demoEvents } from "@/demo/events";

const STORAGE_KEY = "product-demo-state-v2";

export type ExplanationLens = "simple" | "insurance" | "evidence";

export type ReviewRecord = {
  status: ReviewStatus;
  at: string;
  reviewer: string;
  role: OrganizationRole;
};

type StoredState = {
  eventIds: string[];
  reviews: Record<string, ReviewRecord>;
  lens: ExplanationLens;
};

type DemoContextValue = {
  assessment: Assessment;
  eventIds: string[];
  reviews: Record<string, ReviewRecord>;
  lens: ExplanationLens;
  applyEvent: (eventId: string) => void;
  toggleEvent: (eventId: string) => void;
  applyAll: () => void;
  reset: () => void;
  setLens: (lens: ExplanationLens) => void;
  updateReview: (findingId: string, status: ReviewStatus) => void;
  submitReview: (findingId: string, status: ReviewStatus) => Promise<boolean>;
  hasEvent: (eventId: string) => boolean;
  hydrated: boolean;
};

const DemoContext = createContext<DemoContextValue | null>(null);

function readStoredState(): StoredState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { eventIds: [], reviews: {}, lens: "simple" };
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    return {
      eventIds: Array.isArray(parsed.eventIds) ? parsed.eventIds : [],
      reviews:
        parsed.reviews && typeof parsed.reviews === "object"
          ? parsed.reviews
          : {},
      lens:
        parsed.lens === "insurance" || parsed.lens === "evidence"
          ? parsed.lens
          : "simple",
    };
  } catch {
    return { eventIds: [], reviews: {}, lens: "simple" };
  }
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [eventIds, setEventIds] = useState<string[]>([]);
  const [reviews, setReviews] = useState<Record<string, ReviewRecord>>({});
  const [lens, setLensState] = useState<ExplanationLens>("simple");
  const [hydrated, setHydrated] = useState(false);
  const interactedBeforeHydration = useRef(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const stored = readStoredState();
      if (!interactedBeforeHydration.current) {
        setEventIds(stored.eventIds);
        setReviews(stored.reviews);
        setLensState(stored.lens);
      }
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ eventIds, reviews, lens }),
      );
    } catch {
      // The deterministic demo remains usable when browser storage is blocked.
    }
  }, [eventIds, reviews, lens, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const assessmentId = `assessment_v${eventIds.length + 1}`;
    const controller = new AbortController();
    const params = new URLSearchParams({
      assessmentId,
      events: eventIds.join(","),
    });
    fetch(`/api/reviews?${params}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (!payload?.persisted || !Array.isArray(payload.reviews)) return;
        setReviews((current) => {
          const saved = Object.fromEntries(
            payload.reviews.map(
              (review: {
                findingId: string;
                status: ReviewStatus;
                occurredAt: string;
                reviewer: string;
                role: ReviewRecord["role"];
              }) => [
                review.findingId,
                {
                  status: review.status,
                  at: review.occurredAt,
                  reviewer: review.reviewer,
                  role: review.role,
                },
              ],
            ),
          );
          return { ...current, ...saved };
        });
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [eventIds, hydrated]);

  const applyEvent = useCallback((eventId: string) => {
    interactedBeforeHydration.current = true;
    setEventIds((current) =>
      current.includes(eventId) ? current : [...current, eventId],
    );
  }, []);

  const toggleEvent = useCallback((eventId: string) => {
    interactedBeforeHydration.current = true;
    setEventIds((current) =>
      current.includes(eventId)
        ? current.filter((id) => id !== eventId)
        : [...current, eventId],
    );
  }, []);

  const applyAll = useCallback(() => {
    interactedBeforeHydration.current = true;
    setEventIds(demoEvents.map((event) => event.id!));
  }, []);

  const reset = useCallback(() => {
    interactedBeforeHydration.current = true;
    setEventIds([]);
    setReviews({});
  }, []);

  const setLens = useCallback((nextLens: ExplanationLens) => {
    interactedBeforeHydration.current = true;
    setLensState(nextLens);
  }, []);

  const updateReview = useCallback(
    (findingId: string, status: ReviewStatus) => {
      interactedBeforeHydration.current = true;
      setReviews((current) => ({
        ...current,
        [findingId]: {
          status,
          at: new Date().toISOString(),
          reviewer: "Demo SME user",
          role: "SME_USER",
        },
      }));
    },
    [],
  );

  const assessment = useMemo(() => {
    const base = buildAssessment(eventIds);
    const findings = base.findings.map((finding) => ({
      ...finding,
      reviewStatus: reviews[finding.id]?.status ?? finding.reviewStatus,
    }));
    const reviewAuditEvents = Object.entries(reviews)
      .filter(([findingId]) =>
        findings.some((finding) => finding.id === findingId),
      )
      .map(([findingId, review]) => ({
        id: `audit_review_${findingId}_${review.status.toLowerCase()}`,
        organizationId: base.organizationId,
        eventType: "HUMAN_REVIEW_PERFORMED",
        actor: `${review.reviewer} (${review.role})`,
        occurredAt: review.at,
        summary: `${findingId} moved to ${review.status}.`,
        snapshotHash: demoHash({ findingId, ...review }),
      }));
    return {
      ...base,
      findings,
      auditEvents: [...base.auditEvents, ...reviewAuditEvents],
    };
  }, [eventIds, reviews]);

  const submitReview = useCallback(
    async (findingId: string, status: ReviewStatus) => {
      try {
        const response = await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationId: assessment.organizationId,
            assessmentId: assessment.id,
            findingId,
            eventIds,
            status,
            reviewer: {
              displayName: "Demo SME user",
              role: "SME_USER",
            },
            idempotencyKey: `demo:${assessment.id}:${findingId}:${status}`,
          }),
        });
        if (!response.ok) return false;
        updateReview(findingId, status);
        return true;
      } catch {
        return false;
      }
    },
    [assessment.id, assessment.organizationId, eventIds, updateReview],
  );

  const value = useMemo<DemoContextValue>(
    () => ({
      assessment,
      eventIds,
      reviews,
      lens,
      applyEvent,
      toggleEvent,
      applyAll,
      reset,
      setLens,
      updateReview,
      submitReview,
      hasEvent: (eventId) => eventIds.includes(eventId),
      hydrated,
    }),
    [
      assessment,
      eventIds,
      reviews,
      lens,
      applyEvent,
      toggleEvent,
      applyAll,
      reset,
      setLens,
      updateReview,
      submitReview,
      hydrated,
    ],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error("useDemo must be used inside DemoProvider");
  return context;
}
