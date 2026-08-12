import { describe, expect, it } from "vitest";
import { demoRepositories } from "@/db/demo-repositories";
import { DEMO_ORGANIZATION_ID } from "@/demo/company";

describe("tenant-scoped demo repositories", () => {
  it("validates a review against the exact assessment snapshot", async () => {
    const assessment = await demoRepositories.assessments.getById(
      { organizationId: DEMO_ORGANIZATION_ID },
      "assessment_v2",
      ["event_new_warehouse"],
    );
    expect(assessment?.findings[0]?.id).toBe("finding_new_location");

    const receipt = await demoRepositories.reviews.append(
      { organizationId: DEMO_ORGANIZATION_ID },
      {
        organizationId: DEMO_ORGANIZATION_ID,
        assessmentId: "assessment_v2",
        findingId: "finding_new_location",
        eventIds: ["event_new_warehouse"],
        status: "REVIEWING",
        reviewer: { displayName: "Demo SME user", role: "SME_USER" },
        idempotencyKey: "test-review-location",
      },
      "2026-07-01T02:01:00.000Z",
    );

    expect(receipt).toMatchObject({
      accepted: true,
      persisted: false,
      storageMode: "DEMO_REPLAY",
      review: {
        organizationId: DEMO_ORGANIZATION_ID,
        status: "REVIEWING",
      },
      auditEvent: { eventType: "HUMAN_REVIEW_PERFORMED" },
    });
  });

  it("fails closed for a different tenant", async () => {
    await expect(
      demoRepositories.assessments.getById(
        { organizationId: "org_not_authorized" },
        "assessment_v2",
        ["event_new_warehouse"],
      ),
    ).rejects.toThrow(/tenant scope/i);
  });
});
