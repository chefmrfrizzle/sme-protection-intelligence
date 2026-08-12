import { getVerifiedIdentity } from "@/lib/supabase/server";

export async function GET() {
  const identity = await getVerifiedIdentity();
  return Response.json(
    identity
      ? { authenticated: true, email: identity.email }
      : { authenticated: false },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
