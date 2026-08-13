import { z } from "zod";
import { DEMO_ORGANIZATION_ID } from "@/demo/company";
import { replayDeadLetter } from "@/db/outbox";
import { getVerifiedIdentity } from "@/lib/supabase/server";

const ParamsSchema = z.object({ id: z.string().uuid() });

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const parsed = ParamsSchema.safeParse(await params);
  if (!parsed.success)
    return Response.json({ error: "Outbox event is invalid" }, { status: 400 });
  const identity = await getVerifiedIdentity();
  if (!identity)
    return Response.json(
      { error: "Authentication is required" },
      { status: 401 },
    );
  try {
    const result = await replayDeadLetter(
      { organizationId: DEMO_ORGANIZATION_ID, actorUserId: identity.userId },
      parsed.data.id,
    );
    if (!result)
      return Response.json(
        { error: "Dead letter is unavailable" },
        { status: 404 },
      );
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json(
      { error: "Organization action is not authorized" },
      { status: 403 },
    );
  }
}
