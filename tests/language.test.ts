import { describe, expect, it } from "vitest";
import { ProtectionStateSchema } from "@/domain/schemas";
import {
  glossaryEntries,
  languageSources,
  protectionStateLanguage,
  stateLabel,
} from "@/domain/language/insurance-language";

describe("insurance language standard", () => {
  it("defines every explicit protection state", () => {
    for (const state of ProtectionStateSchema.options) {
      expect(protectionStateLanguage[state]).toMatchObject({
        term: expect.any(String),
        plain: expect.any(String),
        insurance: expect.any(String),
        presenter: expect.any(String),
        boundary: expect.any(String),
      });
      expect(stateLabel(state)).not.toMatch(/_/);
    }
  });

  it("gives every glossary term three perspectives and a boundary", () => {
    expect(glossaryEntries.length).toBeGreaterThan(25);
    expect(new Set(glossaryEntries.map((entry) => entry.id)).size).toBe(
      glossaryEntries.length,
    );
    for (const entry of glossaryEntries) {
      expect(entry.term.length).toBeGreaterThan(2);
      expect(entry.plain.length).toBeGreaterThan(20);
      expect(entry.insurance.length).toBeGreaterThan(20);
      expect(entry.presenter.length).toBeGreaterThan(20);
      expect(entry.boundary.length).toBeGreaterThan(20);
    }
  });

  it("uses secure authoritative source links", () => {
    for (const source of Object.values(languageSources)) {
      expect(source.url).toMatch(/^https:\/\//);
      expect(source.label.length).toBeGreaterThan(4);
    }
    for (const entry of glossaryEntries) {
      for (const sourceId of entry.sourceIds ?? []) {
        expect(languageSources[sourceId]).toBeDefined();
      }
    }
  });
});
