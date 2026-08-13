import type { RuleDefinition } from "../types";

export const RULESET_VERSION = "2026.08.1";
export const CONFIGURATION_VERSION = "demo-config-2026.08.1";

export const rules = {
  newLocation: {
    id: "PROPERTY_NEW_LOCATION_001",
    version: "1.2.0",
    domain: "PROPERTY_ASSETS",
    description:
      "New active location is absent from supplied current location evidence.",
    thresholds: { requireExactScheduledLocationMatch: true },
  },
  assetIncrease: {
    id: "PROPERTY_ASSET_VALUE_002",
    version: "1.1.0",
    domain: "PROPERTY_ASSETS",
    description:
      "Observed asset value materially exceeds supplied declared value.",
    thresholds: { relativeIncreasePct: 20, absoluteIncreaseSgd: 100_000 },
  },
  supplierConcentration: {
    id: "SUPPLY_CONCENTRATION_001",
    version: "1.0.0",
    domain: "SUPPLY_CHAIN",
    description:
      "Critical supplier concentration exceeds the materiality threshold.",
    thresholds: { concentrationPct: 40, increasePercentagePoints: 15 },
  },
  cloudDependency: {
    id: "CYBER_CLOUD_DEPENDENCY_001",
    version: "1.0.0",
    domain: "CYBER",
    description:
      "Critical cloud dependencies increased and current evidence is incomplete.",
    thresholds: { minimumNewCriticalDependencies: 1 },
  },
  newTerritory: {
    id: "TERRITORY_CHANGE_001",
    version: "1.0.0",
    domain: "BUSINESS_CONTINUITY",
    description:
      "Material activity entered a territory requiring wording interpretation.",
    thresholds: { requireExplicitTerritoryConfirmation: true },
  },
} satisfies Record<string, RuleDefinition>;
