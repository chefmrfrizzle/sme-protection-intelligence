import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { evidenceArtifacts } from "@/demo/evidence";
import { demoEvents } from "@/demo/events";
import { demoHash, stableStringify } from "@/domain/reconciliation/hash";
import { receiptHash } from "@/domain/crypto/receipts";
import { buildAssessment } from "@/domain/reconciliation/engine";
import { buildProtectionReviewCase } from "@/domain/integration/review-case";

describe("SHA-256 demo receipts", () => {
  it.each([
    null,
    "",
    "Singapore 新加坡 🇸🇬",
    "x".repeat(1000),
    { b: 2, a: [1, { z: true }] },
  ])("matches the independent Node SHA-256 implementation for %j", (value) => {
    const expected = createHash("sha256")
      .update(stableStringify(value))
      .digest("hex");
    expect(demoHash(value)).toBe(`sha256-${expected}`);
    expect(demoHash(value)).toBe(receiptHash(value));
  });

  it("ignores object insertion order and detects changed values and array order", () => {
    expect(demoHash({ b: 2, a: 1 })).toBe(demoHash({ a: 1, b: 2 }));
    expect(demoHash({ a: 1 })).not.toBe(demoHash({ a: 2 }));
    expect(demoHash([1, 2])).not.toBe(demoHash([2, 1]));
  });

  it("uses SHA-256 throughout assessment, audit and review-case receipts", () => {
    const baseline = buildAssessment([]);
    const changed = buildAssessment(demoEvents.map((event) => event.id!));
    const review = buildProtectionReviewCase(
      changed,
      demoEvents,
      evidenceArtifacts,
    );
    const hashes = [
      baseline.receiptHash,
      changed.receiptHash,
      review.receiptHash,
      ...baseline.auditEvents.map((event) => event.snapshotHash),
      ...changed.auditEvents.map((event) => event.snapshotHash),
    ];
    for (const hash of hashes) expect(hash).toMatch(/^sha256-[a-f0-9]{64}$/);
    expect(baseline.receiptHash).not.toBe(changed.receiptHash);
  });

  it("fingerprints actual synthetic content and detects an edited source excerpt", () => {
    for (const { sourceHash, ...record } of evidenceArtifacts) {
      expect(sourceHash).toBe(receiptHash(record));
      const edited = {
        ...record,
        pages: record.pages.map((page) => ({
          ...page,
          body: page.body + " changed",
        })),
      };
      expect(sourceHash).not.toBe(receiptHash(edited));
    }
  });
});
