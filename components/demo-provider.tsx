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
import { demoEvents } from "@/demo/events";

const STORAGE_KEY = "product-demo-state-v2";

export type ExplanationLens = "simple" | "insurance" | "evidence";

export type ReviewRecord = {
  status: ReviewStatus;
  at: string;
  reviewer: string;
  role: "SME_USER" | "BROKER_RISK_ADVISOR" | "INSURER_REVIEWER";
  rationale?: string;
};

export type ReviewActivityRecord = {
  id: string;
  findingId?: string;
  message: string;
  visibility: "SHARED" | "PROFESSIONAL_ONLY";
  author: string;
  role: "SME_USER" | "BROKER_RISK_ADVISOR" | "INSURER_REVIEWER";
  occurredAt: string;
};

type StoredState = {
  eventIds: string[];
  reviews: Record<string, ReviewRecord>;
  activities: ReviewActivityRecord[];
  lens: ExplanationLens;
};

type DemoContextValue = {
  assessment: Assessment;
  eventIds: string[];
  reviews: Record<string, ReviewRecord>;
  activities: ReviewActivityRecord[];
  lens: ExplanationLens;
  applyEvent: (eventId: string) => void;
  toggleEvent: (eventId: string) => void;
  applyAll: () => void;
  reset: () => void;
  setLens: (lens: ExplanationLens) => void;
  updateReview: (findingId: string, status: ReviewStatus) => void;
  submitReview: (
    findingId: string,
    status: ReviewStatus,
    options?: {
      rationale?: string;
      role?: ReviewRecord["role"];
      reviewer?: string;
    },
  ) => Promise<boolean>;
  submitActivity: (
    findingId: string | undefined,
    message: string,
    visibility: ReviewActivityRecord["visibility"],
    role?: ReviewActivityRecord["role"],
  ) => Promise<boolean>;
  hasEvent: (eventId: string) => boolean;
  hydrated: boolean;
};

const DemoContext = createContext<DemoContextValue | null>(null);

function readStoredState(): StoredState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw)
      return { eventIds: [], reviews: {}, activities: [], lens: "simple" };
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    return {
      eventIds: Array.isArray(parsed.eventIds) ? parsed.eventIds : [],
      reviews:
        parsed.reviews && typeof parsed.reviews === "object"
          ? parsed.reviews
          : {},
      activities: Array.isArray(parsed.activities) ? parsed.activities : [],
      lens:
        parsed.lens === "insurance" || parsed.lens === "evidence"
          ? parsed.lens
          : "simple",
    };
  } catch {
    return { eventIds: [], reviews: {}, activities: [], lens: "simple" };
  }
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [eventIds, setEventIds] = useState<string[]>([]);
  const [reviews, setReviews] = useState<Record<string, ReviewRecord>>({});
  const [activities, setActivities] = useState<ReviewActivityRecord[]>([]);
  const [lens, setLensState] = useState<ExplanationLens>("simple");
  const [hydrated, setHydrated] = useState(false);
  const interactedBeforeHydration = useRef(false);

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      const stored = readStoredState();
      if (!interactedBeforeHydration.current) {
        setEventIds(stored.eventIds);
        setReviews(stored.reviews);
        setActivities(stored.activities);
        setLensState(stored.lens);
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(hydrationTimer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ eventIds, reviews, activities, lens }),
      );
    } catch {
      // The deterministic demo remains usable when browser storage is blocked.
    }
  }, [eventIds, reviews, activities, lens, hydrated]);

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
    fetch(`/api/review-activity?${params}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (!payload?.persisted || !Array.isArray(payload.activities)) return;
        setActivities((current) => {
          const known = new Set(current.map((activity) => activity.id));
          const saved = payload.activities.filter(
            (activity: ReviewActivityRecord) => !known.has(activity.id),
          );
          return [...current, ...saved];
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
    setActivities([]);
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
    async (
      findingId: string,
      status: ReviewStatus,
      options?: {
        rationale?: string;
        role?: ReviewRecord["role"];
        reviewer?: string;
      },
    ) => {
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
              displayName: options?.reviewer ?? "Demo SME user",
              role: options?.role ?? "SME_USER",
            },
            rationale: options?.rationale || undefined,
            idempotencyKey: `demo:${assessment.id}:${findingId}:${status}:${demoHash(options?.rationale ?? "no-rationale").slice(-10)}`,
          }),
        });
        if (!response.ok) return false;
        interactedBeforeHydration.current = true;
        setReviews((current) => ({
          ...current,
          [findingId]: {
            status,
            at: new Date().toISOString(),
            reviewer: options?.reviewer ?? "Demo SME user",
            role: options?.role ?? "SME_USER",
            rationale: options?.rationale,
          },
        }));
        return true;
      } catch {
        return false;
      }
    },
    [assessment.id, assessment.organizationId, eventIds],
  );

  const submitActivity = useCallback(
    async (
      findingId: string | undefined,
      message: string,
      visibility: ReviewActivityRecord["visibility"],
      role: ReviewActivityRecord["role"] = "BROKER_RISK_ADVISOR",
    ) => {
      try {
        const idempotencyKey = `comment:${assessment.id}:${demoHash({ findingId, message, visibility }).slice(-18)}`;
        const response = await fetch("/api/review-activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationId: assessment.organizationId,
            assessmentId: assessment.id,
            caseId: `case_${assessment.id}`,
            findingId,
            eventIds,
            activityType: "COMMENT_ADDED",
            visibility,
            message,
            author: {
              displayName: "Demo professional reviewer",
              role,
            },
            idempotencyKey,
          }),
        });
        if (!response.ok) return false;
        const receipt = await response.json();
        interactedBeforeHydration.current = true;
        setActivities((current) => {
          if (current.some((activity) => activity.id === receipt.activity.id)) {
            return current;
          }
          return [...current, receipt.activity];
        });
        return true;
      } catch {
        return false;
      }
    },
    [assessment.id, assessment.organizationId, eventIds],
  );

  const value = useMemo<DemoContextValue>(
    () => ({
      assessment,
      eventIds,
      reviews,
      activities,
      lens,
      applyEvent,
      toggleEvent,
      applyAll,
      reset,
      setLens,
      updateReview,
      submitReview,
      submitActivity,
      hasEvent: (eventId) => eventIds.includes(eventId),
      hydrated,
    }),
    [
      assessment,
      eventIds,
      reviews,
      activities,
      lens,
      applyEvent,
      toggleEvent,
      applyAll,
      reset,
      setLens,
      updateReview,
      submitReview,
      submitActivity,
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
