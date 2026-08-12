import { describe, expect, it } from "vitest";
import { buildAssessment } from "@/domain/reconciliation/engine";
import { buildProfessionalReviewWorkspace } from "@/domain/professional-review/workspace";
import { ProfessionalReviewWorkspaceSchema } from "@/domain/professional-review/schemas";

describe("professional review workspace", () => {
  it("builds a validated queue from the deterministic assessment", () => {
    const assessment = buildAssessment([
      "event_new_warehouse",
      "event_cloud_dependency",
    ]);
    const workspace = buildProfessionalReviewWorkspace(assessment);

    expect(() =>
      ProfessionalReviewWorkspaceSchema.parse(workspace),
    ).not.toThrow();
    expect(workspace.renewal.daysRemaining).toBe(142);
    expect(
      workspace.queue.find((item) => item.findingId === "finding_new_location"),
    ).toMatchObject({
      priority: "HIGH",
      evidenceReadiness: "COMPLETE",
    });
    expect(
      workspace.queue.find(
        (item) => item.findingId === "finding_cloud_dependency",
      ),
    ).toMatchObject({
      priority: "STANDARD",
      evidenceReadiness: "INCOMPLETE",
    });
  });

  it("retains evidence links across insurance context and before/after data", () => {
    const workspace = buildProfessionalReviewWorkspace(
      buildAssessment(["event_new_warehouse"]),
    );

    expect(workspace.exposureDifferences[0]).toMatchObject({
      before: "1 location",
      after: "2 locations",
      materialityRuleId: "PROPERTY_NEW_LOCATION_001",
    });
    expect(
      workspace.contexts.property.every((item) => item.evidenceIds.length > 0),
    ).toBe(true);
    expect(
      workspace.activities.every((activity) => activity.eventHash.length >= 8),
    ).toBe(true);
  });

  it("marks future connectors as unavailable and non-authoritative", () => {
    const workspace = buildProfessionalReviewWorkspace(
      buildAssessment(["event_new_warehouse"]),
    );
    const zurichConnectors = workspace.connectors.filter(
      (connector) => connector.provider === "Zurich eXchange",
    );

    expect(zurichConnectors.length).toBeGreaterThan(0);
    expect(
      zurichConnectors.every(
        (connector) => connector.status === "ACCESS_REQUIRED",
      ),
    ).toBe(true);
    expect(
      zurichConnectors.some((connector) =>
        connector.safetyBoundary.includes("does not submit"),
      ),
    ).toBe(true);
  });
});
