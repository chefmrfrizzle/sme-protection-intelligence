import type { ExposureSnapshot, PolicySnapshot } from "@/domain/types";
import type { MaterializedFact } from "./ledger";

const exposureProperties = [
  "locationIds",
  "assetValueSgd",
  "supplierConcentrationPct",
  "cloudDependencyCount",
  "territories",
  "headcount",
] as const;
const policyProperties = [
  "scheduledLocationIds",
  "declaredAssetValueSgd",
  "cyberDependenciesEvidenced",
  "territoriesExplicitlyConfirmed",
  "territorialWordingPresent",
  "policyCurrent",
  "endorsementIncludesLocationB",
] as const;

function valueMap(facts: readonly MaterializedFact[], subjectId: string) {
  return new Map(
    facts
      .filter((fact) => fact.subjectId === subjectId)
      .map((fact) => [fact.property, fact.value]),
  );
}

export function snapshotsFromTemporalFacts(input: {
  facts: readonly MaterializedFact[];
  conflicts: readonly { subjectId: string; property: string }[];
  exposureSubjectId: string;
  policySubjectId: string;
}) {
  const materialConflict = input.conflicts.find(
    (conflict) =>
      (conflict.subjectId === input.exposureSubjectId &&
        exposureProperties.includes(
          conflict.property as (typeof exposureProperties)[number],
        )) ||
      (conflict.subjectId === input.policySubjectId &&
        policyProperties.includes(
          conflict.property as (typeof policyProperties)[number],
        )),
  );
  if (materialConflict) {
    return {
      ok: false as const,
      state: "EVIDENCE_CONFLICT" as const,
      missing: [],
      conflict: materialConflict,
    };
  }

  const exposure = valueMap(input.facts, input.exposureSubjectId);
  const policy = valueMap(input.facts, input.policySubjectId);
  const missing = [
    ...exposureProperties
      .filter((property) => !exposure.has(property))
      .map((property) => `exposure.${property}`),
    ...policyProperties
      .filter((property) => !policy.has(property))
      .map((property) => `policy.${property}`),
  ];
  if (missing.length) {
    return {
      ok: false as const,
      state: "EVIDENCE_INCOMPLETE" as const,
      missing,
    };
  }

  return {
    ok: true as const,
    exposure: {
      locationIds: exposure.get("locationIds") as string[],
      assetValueSgd: exposure.get("assetValueSgd") as number,
      supplierConcentrationPct: exposure.get(
        "supplierConcentrationPct",
      ) as number,
      cloudDependencyCount: exposure.get("cloudDependencyCount") as number,
      territories: exposure.get("territories") as string[],
      headcount: exposure.get("headcount") as number,
    } satisfies ExposureSnapshot,
    policy: {
      scheduledLocationIds: policy.get("scheduledLocationIds") as string[],
      declaredAssetValueSgd: policy.get("declaredAssetValueSgd") as number,
      cyberDependenciesEvidenced: policy.get(
        "cyberDependenciesEvidenced",
      ) as number,
      territoriesExplicitlyConfirmed: policy.get(
        "territoriesExplicitlyConfirmed",
      ) as string[],
      territorialWordingPresent: policy.get(
        "territorialWordingPresent",
      ) as boolean,
      policyCurrent: policy.get("policyCurrent") as boolean,
      endorsementIncludesLocationB: policy.get(
        "endorsementIncludesLocationB",
      ) as boolean,
    } satisfies PolicySnapshot,
  };
}
