import { describe, expect, it } from "vitest";
import {
  buildAssessment,
  protectionDiff,
  reduceExposure,
} from "@/domain/reconciliation/engine";
import { goldenScenarios } from "@/evals/golden-scenarios";

describe("deterministic reconciliation engine", () => {
  it("keeps the baseline aligned without a vague alert", () => {
    const assessment = buildAssessment();
    expect(assessment.alignment).toBe(100);
    expect(assessment.findings).toEqual([]);
    expect(
      assessment.domains.every((domain) => domain.state === "ALIGNED"),
    ).toBe(true);
  });

  it.each(goldenScenarios)("matches $name", (scenario) => {
    const assessment = buildAssessment(scenario.eventIds, scenario.options);
    expect(assessment.findings.map((finding) => finding.state)).toEqual(
      scenario.expectedFindingStates,
    );
    if (scenario.expectedFindingIds) {
      expect(assessment.findings.map((finding) => finding.id)).toEqual(
        scenario.expectedFindingIds,
      );
    }
  });

  it("reduces events chronologically and creates the exact Protection Diff", () => {
    const eventIds = [
      "event_new_geography",
      "event_asset_increase",
      "event_new_warehouse",
      "event_cloud_dependency",
      "event_supplier_concentration",
    ];
    const exposure = reduceExposure(eventIds);
    expect(exposure).toMatchObject({
      locationIds: ["loc_a", "loc_b"],
      assetValueSgd: 850_000,
      supplierConcentrationPct: 54,
      cloudDependencyCount: 3,
      territories: ["SG", "MY"],
    });
    expect(protectionDiff(eventIds)).toMatchObject({
      locations: { before: 1, after: 2 },
      assetValueSgd: { before: 500_000, after: 850_000 },
    });
  });

  it("records a replayable rule trace and challenge before surfacing a gap", () => {
    const [finding] = buildAssessment(["event_new_warehouse"]).findings;
    expect(finding.ruleTrace).toMatchObject({
      ruleId: "PROPERTY_NEW_LOCATION_001",
      ruleVersion: "1.2.0",
      passed: true,
      result: "POTENTIAL_GAP",
    });
    expect(finding.challenge.outcome).toBe("SURVIVES");
    expect(finding.challenge.searchedEvidenceIds).toContain("ev_endorsements");
    expect(finding.challenge.summary).toContain("not a coverage determination");
  });

  it("does not allow event order or duplicates to change the receipt", () => {
    const left = buildAssessment([
      "event_asset_increase",
      "event_new_warehouse",
    ]);
    const right = buildAssessment([
      "event_new_warehouse",
      "event_asset_increase",
      "event_asset_increase",
    ]);
    expect(left.receiptHash).toBe(right.receiptHash);
    expect(left.appliedEventIds).toEqual(right.appliedEventIds);
  });
});
