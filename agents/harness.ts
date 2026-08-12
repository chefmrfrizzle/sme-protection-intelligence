import { z } from "zod";
import { AgentRunSchema } from "@/domain/schemas";
import type { AgentRun } from "@/domain/types";

export type HarnessPolicy = {
  maxRetries: 0 | 1 | 2;
  timeoutMs: number;
  permissions: readonly string[];
  canMutateDatabase: false;
  requiresSourceGrounding: true;
};

export const defaultHarnessPolicy: HarnessPolicy = {
  maxRetries: 2,
  timeoutMs: 20_000,
  permissions: ["read_supplied_evidence", "emit_structured_output"],
  canMutateDatabase: false,
  requiresSourceGrounding: true,
};

export function validateAgentOutput<T>(
  schema: z.ZodType<T>,
  output: unknown,
): T {
  return schema.parse(output);
}

export function replayAgentRun(
  agent: string,
  inputEvidenceIds: string[],
  status: AgentRun["status"] = "VALIDATED",
): AgentRun {
  return AgentRunSchema.parse({
    runId: `run_replay_${agent.toLowerCase().replaceAll(" ", "_")}`,
    agent,
    mode: "REPLAY",
    promptVersion: "prompt-2026.08.1",
    modelVersion: "validated-replay-fixture",
    parserVersion: "parser-1.3.0",
    inputEvidenceIds,
    startedAt: "2026-07-21T09:00:00.000Z",
    completedAt: "2026-07-21T09:02:00.000Z",
    attempts: 1,
    sourceGrounded: true,
    status,
  });
}
