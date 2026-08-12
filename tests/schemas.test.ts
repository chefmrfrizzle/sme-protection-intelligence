import { describe, expect, it } from "vitest";
import {
  AssessmentSchema,
  CanonicalChangeEventSchema,
  EvidenceArtifactSchema,
  ProtectionStateSchema,
} from "@/domain/schemas";
import { buildAssessment } from "@/domain/reconciliation/engine";
import { demoEvents } from "@/demo/events";
import { evidenceArtifacts } from "@/demo/evidence";

describe("domain schemas", () => {
  it("accepts only explicit protection states", () => {
    expect(ProtectionStateSchema.safeParse("POTENTIAL_GAP").success).toBe(true);
    expect(ProtectionStateSchema.safeParse("MAYBE_RED").success).toBe(false);
  });

  it("validates the complete synthetic corpus", () => {
    expect(
      EvidenceArtifactSchema.array().parse(evidenceArtifacts),
    ).toHaveLength(10);
    expect(CanonicalChangeEventSchema.array().parse(demoEvents)).toHaveLength(
      5,
    );
  });

  it("validates generated assessment snapshots", () => {
    const assessment = buildAssessment(demoEvents.map((event) => event.id!));
    expect(AssessmentSchema.parse(assessment)).toEqual(assessment);
  });

  it("rejects malformed ungrounded events", () => {
    const result = CanonicalChangeEventSchema.safeParse({
      organizationId: "org",
      eventType: "LOCATION_ADDED",
      observedAt: "yesterday",
      source: { type: "rumour", name: "unknown" },
      payload: {},
    });
    expect(result.success).toBe(false);
  });
});
