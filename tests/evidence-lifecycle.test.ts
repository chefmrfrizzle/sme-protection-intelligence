import { describe, expect, it } from "vitest";
import {
  deterministicSyntheticScanner,
  erasureDecision,
  quarantineAndScan,
  validateEvidenceContent,
} from "@/domain/evidence/lifecycle";

const pdf = new TextEncoder().encode("%PDF-1.7\nSynthetic evidence only");

describe("evidence lifecycle", () => {
  it("hashes and approves a matching synthetic file through quarantine", async () => {
    const result = await quarantineAndScan({
      bytes: pdf,
      declaredMime: "application/pdf",
      scanner: deterministicSyntheticScanner,
    });
    expect(result.state).toBe("APPROVED_FOR_PROCESSING");
    expect(result.sha256).toMatch(/^sha256-[a-f0-9]{64}$/);
  });

  it("rejects MIME confusion and oversized files", () => {
    expect(
      validateEvidenceContent({ bytes: pdf, declaredMime: "text/plain" }).state,
    ).toBe("REJECTED_TYPE_MISMATCH");
    expect(
      validateEvidenceContent({
        bytes: pdf,
        declaredMime: "application/pdf",
        maxBytes: 4,
      }).state,
    ).toBe("REJECTED_OVERSIZE");
  });

  it("keeps the standard safe scanner test signature out of processing", async () => {
    const result = await quarantineAndScan({
      bytes: new TextEncoder().encode(
        "EICAR-STANDARD-ANTIVIRUS-TEST-FILE synthetic scanner test",
      ),
      declaredMime: "text/plain",
      scanner: deterministicSyntheticScanner,
    });
    expect(result.state).toBe("REJECTED_MALWARE");
  });

  it("blocks erasure during retention or legal hold and emits a tombstone otherwise", () => {
    const now = new Date("2026-08-13T14:00:00.000Z");
    expect(erasureDecision({ legalHold: true, now })).toMatchObject({
      allowed: false,
      reason: "LEGAL_HOLD",
    });
    expect(
      erasureDecision({
        legalHold: false,
        retentionUntil: "2026-09-01T00:00:00.000Z",
        now,
      }),
    ).toMatchObject({ allowed: false, reason: "RETENTION_ACTIVE" });
    expect(erasureDecision({ legalHold: false, now })).toMatchObject({
      allowed: true,
      tombstoneReceipt: expect.stringMatching(/^sha256-/),
    });
  });
});
