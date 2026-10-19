import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  isJsonObject,
  notifyJson,
  notifyOptions,
  readNotifyPayload,
} from "@/lib/notifications";
import { readTritonNotification } from "@/lib/triton";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return notifyOptions();
}

export async function POST(request: Request) {
  return deliver(request);
}

export async function GET(request: Request) {
  return deliver(request);
}

async function deliver(request: Request) {
  const limited = rateLimit(`triton-get:${clientIp(request)}`, 600, 60 * 1000);
  if (!limited.ok) {
    return notifyJson({ error: "Too many requests. Try again shortly." }, 429);
  }

  const parsed = await readNotifyPayload(request);
  if (parsed.error) return parsed.error;
  if (!isJsonObject(parsed.payload)) {
    return notifyJson({ error: "Request must be a JSON object." }, 400);
  }

  const result = await readTritonNotification(parsed.payload as Record<string, unknown>);
  if ("error" in result) return notifyJson({ error: result.error }, 400);
  return notifyJson(result.body);
}
