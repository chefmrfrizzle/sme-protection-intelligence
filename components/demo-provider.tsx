"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { buildAssessment } from "@/domain/reconciliation/engine";
import { demoHash } from "@/domain/reconciliation/hash";
import type { Assessment, ReviewStatus } from "@/domain/types";
import { demoEvents } from "@/demo/events";

const STORAGE_KEY = "product-demo-state-v2";

export type ReviewRecord = {
  status: ReviewStatus;
  at: string;
  reviewer: "Demo SME user";
  role: "SME_USER";
};

type StoredState = {
  eventIds: string[];
  reviews: Record<string, ReviewRecord>;
};

type DemoContextValue = {
  assessment: Assessment;
  eventIds: string[];
  reviews: Record<string, ReviewRecord>;
  applyEvent: (eventId: string) => void;
  applyAll: () => void;
  reset: () => void;
  updateReview: (findingId: string, status: ReviewStatus) => void;
  hasEvent: (eventId: string) => boolean;
  hydrated: boolean;
};

const DemoContext = createContext<DemoContextValue | null>(null);

function readStoredState(): StoredState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { eventIds: [], reviews: {} };
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    return {
      eventIds: Array.isArray(parsed.eventIds) ? parsed.eventIds : [],
      reviews:
        parsed.reviews && typeof parsed.reviews === "object"
          ? parsed.reviews
          : {},
    };
  } catch {
    return { eventIds: [], reviews: {} };
  }
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [eventIds, setEventIds] = useState<string[]>([]);
  const [reviews, setReviews] = useState<Record<string, ReviewRecord>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const stored = readStoredState();
      setEventIds(stored.eventIds);
      setReviews(stored.reviews);
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ eventIds, reviews }),
    );
  }, [eventIds, reviews, hydrated]);

  const applyEvent = useCallback((eventId: string) => {
    setEventIds((current) =>
      current.includes(eventId) ? current : [...current, eventId],
    );
  }, []);

  const applyAll = useCallback(() => {
    setEventIds(demoEvents.map((event) => event.id!));
  }, []);

  const reset = useCallback(() => {
    setEventIds([]);
    setReviews({});
  }, []);

  const updateReview = useCallback(
    (findingId: string, status: ReviewStatus) => {
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

  const value = useMemo<DemoContextValue>(
    () => ({
      assessment,
      eventIds,
      reviews,
      applyEvent,
      applyAll,
      reset,
      updateReview,
      hasEvent: (eventId) => eventIds.includes(eventId),
      hydrated,
    }),
    [
      assessment,
      eventIds,
      reviews,
      applyEvent,
      applyAll,
      reset,
      updateReview,
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
