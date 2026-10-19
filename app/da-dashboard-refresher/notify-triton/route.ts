import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  isJsonObject,
  notifyJson,
  notifyOptions,
  readNotifyPayload,
} from "@/lib/notifications";
import { parseJstTime, receiveTritonNotification } from "@/lib/triton";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return notifyOptions();
}

export async function POST(request: Request) {
  const limited = rateLimit(`triton-notify:${clientIp(request)}`, 120, 60 * 1000);
  if (!limited.ok) {
    return notifyJson({ error: "Too many notifications. Try again shortly." }, 429);
  }

  const parsed = await readNotifyPayload(request);
  if (parsed.error) return parsed.error;
  if (!isJsonObject(parsed.payload)) {
    return notifyJson({ error: "Notification must be a JSON object." }, 400);
  }

  const payload = parsed.payload as Record<string, unknown>;
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const time = parseJstTime(payload.time);
  if (!name || name.length > 200 || !time) {
    return notifyJson({ error: "name and time are required. time is JST." }, 400);
  }

  const saved = await receiveTritonNotification(name, time);
  if (!saved.stored) return notifyJson({ ok: true, stored: false });
  return notifyJson({ ok: true, stored: true, id: saved.id });
}
