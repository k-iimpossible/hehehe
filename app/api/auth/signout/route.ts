import { destroySession } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/http";

export async function POST(request: Request) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;
  await destroySession();
  return Response.json({ ok: true });
}
