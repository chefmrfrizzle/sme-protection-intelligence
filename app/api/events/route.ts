import { CanonicalChangeEventSchema } from "@/domain/schemas";
import { demoCompany } from "@/demo/company";

const affectedDomains = {
  LOCATION_ADDED: ["PROPERTY_ASSETS"],
  ASSET_VALUE_CHANGED: ["PROPERTY_ASSETS"],
  SUPPLIER_CONCENTRATION_CHANGED: ["SUPPLY_CHAIN", "BUSINESS_CONTINUITY"],
  CLOUD_DEPENDENCY_CHANGED: ["CYBER", "BUSINESS_CONTINUITY"],
  OPERATING_GEOGRAPHY_ADDED: ["BUSINESS_CONTINUITY"],
  ENDORSEMENT_RECEIVED: ["PROPERTY_ASSETS"],
} as const;

export async function POST(request: Request) {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return Response.json(
      { error: "Request body must be valid JSON" },
      { status: 400 },
    );
  }
  const result = CanonicalChangeEventSchema.safeParse(input);
  if (!result.success) {
    return Response.json(
      {
        error: "Canonical event validation failed",
        issues: result.error.issues,
      },
      { status: 422 },
    );
  }
  if (result.data.organizationId !== demoCompany.id) {
    return Response.json(
      { error: "Unknown synthetic demo tenant" },
      { status: 404 },
    );
  }
  return Response.json({
    accepted: true,
    persisted: false,
    demoMode: true,
    message:
      "Event validated. The public demo endpoint returns a preview and does not persist external input.",
    normalizedEvent: {
      ...result.data,
      id: result.data.id ?? `preview_${result.data.eventType.toLowerCase()}`,
    },
    affectedDomains: affectedDomains[result.data.eventType],
  });
}
