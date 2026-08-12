import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  defaultHarnessPolicy,
  replayAgentRun,
  validateAgentOutput,
} from "@/agents/harness";
import { replayRuns } from "@/agents/replay";

describe("bounded agent harness", () => {
  it("cannot mutate the database or retry forever", () => {
    expect(defaultHarnessPolicy.canMutateDatabase).toBe(false);
    expect(defaultHarnessPolicy.maxRetries).toBeLessThanOrEqual(2);
    expect(defaultHarnessPolicy.requiresSourceGrounding).toBe(true);
  });

  it("records prompt/model/parser metadata for replay runs", () => {
    expect(replayRuns).toHaveLength(3);
    expect(replayAgentRun("Explanation", ["ev_policy_schedule"])).toMatchObject(
      {
        mode: "REPLAY",
        attempts: 1,
        sourceGrounded: true,
        status: "VALIDATED",
      },
    );
  });

  it("rejects an invalid structured agent output", () => {
    const schema = z.object({ fact: z.string(), sourceId: z.string().min(1) });
    expect(() => validateAgentOutput(schema, { fact: "invented" })).toThrow();
  });
});
