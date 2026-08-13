import { z } from "zod";
import { receiptHash } from "@/domain/crypto/receipts";
import { stableStringify } from "@/domain/reconciliation/hash";

export const FactSourceSpanSchema = z.object({
  evidenceArtifactId: z.string().min(1),
  evidenceVersionId: z.string().min(1),
  evidenceSha256: z.string().regex(/^sha256-[a-f0-9]{64}$/),
  page: z.number().int().positive().optional(),
  section: z.string().min(1),
  startOffset: z.number().int().nonnegative(),
  endOffset: z.number().int().positive(),
  excerpt: z.string().min(1),
});

export const FactCandidateSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  subjectId: z.string().min(1),
  property: z.string().min(1),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
  unit: z.string().optional(),
  validFrom: z.string().datetime(),
  validTo: z.string().datetime().optional(),
  observedAt: z.string().datetime(),
  importedAt: z.string().datetime(),
  origin: z.enum(["AGENT", "PARSER", "HUMAN", "API"]),
  originRunId: z.string().min(1),
  sources: z.array(FactSourceSpanSchema).min(1),
});

export const MaterializedFactSchema = FactCandidateSchema.extend({
  materializedAt: z.string().datetime(),
  materializedBy: z.string().min(1),
  authority: z.enum(["HUMAN", "DETERMINISTIC_VALIDATOR"]),
  supersedesFactId: z.string().min(1).optional(),
  receiptHash: z.string().regex(/^sha256-[a-f0-9]{64}$/),
});

export type FactCandidate = z.infer<typeof FactCandidateSchema>;
export type MaterializedFact = z.infer<typeof MaterializedFactSchema>;

export class TemporalFactLedger {
  readonly #candidates: FactCandidate[] = [];
  readonly #facts: MaterializedFact[] = [];

  appendCandidate(candidate: FactCandidate) {
    const parsed = FactCandidateSchema.parse(candidate);
    const duplicate = this.#candidates.find(
      (existing) =>
        existing.organizationId === parsed.organizationId &&
        existing.originRunId === parsed.originRunId &&
        existing.subjectId === parsed.subjectId &&
        existing.property === parsed.property &&
        stableStringify(existing.value) === stableStringify(parsed.value),
    );
    if (duplicate) return duplicate;
    this.#candidates.push(parsed);
    return parsed;
  }

  materialize(input: {
    candidateId: string;
    materializedAt: string;
    materializedBy: string;
    authority: "HUMAN" | "DETERMINISTIC_VALIDATOR";
    supersedesFactId?: string;
  }) {
    const candidate = this.#candidates.find(
      (item) => item.id === input.candidateId,
    );
    if (!candidate) throw new Error("Fact candidate was not found.");
    if (
      input.supersedesFactId &&
      !this.#facts.some(
        (fact) =>
          fact.id === input.supersedesFactId &&
          fact.organizationId === candidate.organizationId,
      )
    ) {
      throw new Error("Superseded fact was not found in the tenant.");
    }
    const fact = MaterializedFactSchema.parse({
      ...candidate,
      ...input,
      receiptHash: receiptHash({ candidate, approval: input }),
    });
    this.#facts.push(fact);
    return fact;
  }

  snapshot(input: {
    organizationId: string;
    asOf: string;
    observedBy?: string;
  }) {
    const asOf = Date.parse(input.asOf);
    const observedBy = Date.parse(input.observedBy ?? input.asOf);
    const superseded = new Set(
      this.#facts
        .filter((fact) => fact.organizationId === input.organizationId)
        .map((fact) => fact.supersedesFactId)
        .filter((id): id is string => Boolean(id)),
    );
    const facts = this.#facts.filter(
      (fact) =>
        fact.organizationId === input.organizationId &&
        !superseded.has(fact.id) &&
        Date.parse(fact.validFrom) <= asOf &&
        (!fact.validTo || Date.parse(fact.validTo) > asOf) &&
        Date.parse(fact.observedAt) <= observedBy,
    );
    const conflicts = facts.flatMap((left, index) =>
      facts.slice(index + 1).flatMap((right) => {
        if (
          left.subjectId === right.subjectId &&
          left.property === right.property &&
          stableStringify(left.value) !== stableStringify(right.value)
        ) {
          return [
            {
              subjectId: left.subjectId,
              property: left.property,
              factIds: [left.id, right.id].sort(),
              state: "EVIDENCE_CONFLICT" as const,
            },
          ];
        }
        return [];
      }),
    );
    return { facts, conflicts };
  }

  facts() {
    return [...this.#facts];
  }
}
