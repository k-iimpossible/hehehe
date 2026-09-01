import { getCurrentUser, userHasService } from "@/lib/auth";
import { getSecureFormUrl } from "@/lib/forms";
import { jsonError } from "@/lib/http";
import { ALL_SERVICES, isServiceId } from "@/lib/services";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Please sign in first.", 401);

  const { id } = await context.params;
  if (!isServiceId(id)) {
    return jsonError("Unknown service.", 404);
  }

  if (!userHasService(user, id)) {
    return jsonError("This service is not enabled for your account.", 403);
  }

  const service = ALL_SERVICES.find((item) => item.id === id);
  const url = getSecureFormUrl(id);

  return Response.json({
    ok: true,
    id,
    label: service?.label ?? id,
    url,
  });
}
