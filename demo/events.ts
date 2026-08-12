import { CanonicalChangeEventSchema } from "@/domain/schemas";
import type { CanonicalChangeEvent } from "@/domain/types";
import { DEMO_ORGANIZATION_ID } from "./company";

const events: CanonicalChangeEvent[] = [
  {
    id: "event_new_warehouse",
    organizationId: DEMO_ORGANIZATION_ID,
    eventType: "LOCATION_ADDED",
    observedAt: "2026-07-01T02:00:00.000Z",
    source: { type: "document", name: "Lease and asset intake" },
    payload: {
      locationId: "loc_b",
      locationName: "Warehouse B",
      country: "SG",
    },
    evidenceReferences: ["ev_lease_b", "ev_asset_register"],
    simulated: false,
  },
  {
    id: "event_asset_increase",
    organizationId: DEMO_ORGANIZATION_ID,
    eventType: "ASSET_VALUE_CHANGED",
    observedAt: "2026-07-03T03:00:00.000Z",
    source: { type: "sandbox", name: "Asset register sandbox" },
    payload: { previousValueSgd: 500_000, currentValueSgd: 850_000 },
    evidenceReferences: ["ev_asset_register", "ev_property_schedule"],
    simulated: false,
  },
  {
    id: "event_supplier_concentration",
    organizationId: DEMO_ORGANIZATION_ID,
    eventType: "SUPPLIER_CONCENTRATION_CHANGED",
    observedAt: "2026-07-10T04:00:00.000Z",
    source: { type: "sandbox", name: "Supplier register sandbox" },
    payload: {
      previousPct: 22,
      currentPct: 54,
      supplier: "Hai Phong Precision Co",
    },
    evidenceReferences: ["ev_supplier_register", "ev_financial_summary"],
    simulated: false,
  },
  {
    id: "event_cloud_dependency",
    organizationId: DEMO_ORGANIZATION_ID,
    eventType: "CLOUD_DEPENDENCY_CHANGED",
    observedAt: "2026-07-14T05:00:00.000Z",
    source: { type: "sandbox", name: "Cloud inventory sandbox" },
    payload: {
      previousCriticalDependencies: 1,
      currentCriticalDependencies: 3,
    },
    evidenceReferences: ["ev_infrastructure", "ev_cyber_summary"],
    simulated: false,
  },
  {
    id: "event_new_geography",
    organizationId: DEMO_ORGANIZATION_ID,
    eventType: "OPERATING_GEOGRAPHY_ADDED",
    observedAt: "2026-07-20T06:00:00.000Z",
    source: {
      type: "human_attestation",
      name: "Synthetic management attestation",
    },
    payload: { country: "MY", activity: "Material installation and servicing" },
    evidenceReferences: ["ev_wording", "ev_policy_schedule"],
    simulated: false,
  },
];

export const demoEvents = CanonicalChangeEventSchema.array().parse(events);
export const demoEventById = new Map(
  demoEvents.map((event) => [event.id!, event]),
);

export const eventPresentation: Record<
  string,
  { title: string; detail: string; diff: string; affected: string }
> = {
  event_new_warehouse: {
    title: "New warehouse detected",
    detail: "Warehouse B commenced operations at 71 Pioneer Sector Walk.",
    diff: "1 location -> 2 locations",
    affected: "Property / Assets",
  },
  event_asset_increase: {
    title: "S$350k equipment added",
    detail: "Observed assets increased from S$500k to S$850k.",
    diff: "S$500k assets -> S$850k assets",
    affected: "Property / Assets",
  },
  event_supplier_concentration: {
    title: "Supplier concentration increased",
    detail: "A critical component supplier now represents 54% of supply.",
    diff: "22% dependency -> 54% dependency",
    affected: "Supply Chain / Business Continuity",
  },
  event_cloud_dependency: {
    title: "New cloud dependencies detected",
    detail: "Two additional mission-critical cloud services were recorded.",
    diff: "1 critical dependency -> 3 dependencies",
    affected: "Cyber / Business Continuity",
  },
  event_new_geography: {
    title: "New operating geography",
    detail: "Material installation and servicing activity began in Malaysia.",
    diff: "Singapore only -> Singapore + Malaysia",
    affected: "Business Continuity",
  },
};

export const findingIdByEventId: Record<string, string> = {
  event_new_warehouse: "finding_new_location",
  event_asset_increase: "finding_asset_value",
  event_supplier_concentration: "finding_supplier_concentration",
  event_cloud_dependency: "finding_cloud_dependency",
  event_new_geography: "finding_new_geography",
};
