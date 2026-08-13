import { describe, expect, it } from "vitest";
import {
  DEMO_DURATION_SECONDS,
  demoScenes,
  formatDemoTime,
  sceneAtElapsed,
} from "@/domain/rehearsal/demo-script";

describe("three-minute demo script", () => {
  it("is contiguous and ends at exactly three minutes", () => {
    expect(demoScenes[0].startSeconds).toBe(0);
    expect(demoScenes.at(-1)?.endSeconds).toBe(DEMO_DURATION_SECONDS);

    demoScenes.forEach((scene, index) => {
      expect(scene.endSeconds).toBeGreaterThan(scene.startSeconds);
      if (index > 0) {
        expect(scene.startSeconds).toBe(demoScenes[index - 1].endSeconds);
      }
    });
  });

  it("rehearses the required flow in order", () => {
    expect(demoScenes.map((scene) => scene.id)).toEqual([
      "opening-reset",
      "baseline",
      "warehouse-change",
      "warehouse-finding",
      "evidence",
      "challenge",
      "abstention",
      "professional-review",
      "pdf-report",
      "audit-close",
    ]);
  });

  it("gives every scene narration, an exact click, and a fallback", () => {
    for (const scene of demoScenes) {
      expect(scene.narration.length).toBeGreaterThan(40);
      expect(scene.clickInstruction).toMatch(
        /Click|click|point|scroll|Apply|Open/,
      );
      expect(scene.fallbackAction).toMatch(/If /);
      expect(scene.fallbackNarration.length).toBeGreaterThan(30);
      expect(scene.safePhrase.length).toBeGreaterThan(5);
    }
  });

  it("avoids unsafe insurance conclusions in the narration", () => {
    const narration = demoScenes.map((scene) => scene.narration).join(" ");
    expect(narration).not.toMatch(/definitely (covered|uninsured)/i);
    expect(narration).not.toMatch(
      /coverage (exists|does not exist|is excluded)/i,
    );
    expect(narration).not.toMatch(
      /claim (will|won't|will not) be (paid|accepted)/i,
    );
  });

  it("selects scenes and formats timestamps deterministically", () => {
    expect(sceneAtElapsed(0).id).toBe("opening-reset");
    expect(sceneAtElapsed(84).id).toBe("evidence");
    expect(sceneAtElapsed(179).id).toBe("audit-close");
    expect(formatDemoTime(0)).toBe("0:00");
    expect(formatDemoTime(180)).toBe("3:00");
  });
});
