import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { buildAssessment } from "@/domain/reconciliation/engine";
import { createAssessmentPdf, reportContentHash } from "@/domain/report/pdf";

describe("assessment report", () => {
  it("generates a multi-page, hashed PDF from structured state", async () => {
    const assessment = buildAssessment([
      "event_new_warehouse",
      "event_asset_increase",
      "event_supplier_concentration",
      "event_cloud_dependency",
      "event_new_geography",
    ]);
    const bytes = await createAssessmentPdf(assessment);
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
    expect(bytes.length).toBeGreaterThan(10_000);
    expect(reportContentHash(bytes)).toMatch(/^[a-f0-9]{64}$/);
    const loaded = await PDFDocument.load(bytes);
    expect(loaded.getPageCount()).toBeGreaterThanOrEqual(3);
    expect(loaded.getTitle()).toContain("SME Protection Alignment Report");
  });
});
