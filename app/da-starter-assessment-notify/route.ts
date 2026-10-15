import { alertEvent, sendAssessmentAlert } from "@/lib/assessment-email";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  authorizeNotify,
  enqueueNotification,
  isJsonObject,
  notifyJson,
  notifyOptions,
  readNotifyPayload,
} from "@/lib/notifications";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return notifyOptions();
}

export async function POST(request: Request) {
  const denied = authorizeNotify(request);
  if (denied) return denied;

  const limited = rateLimit(`notify:${clientIp(request)}`, 120, 60 * 1000);
  if (!limited.ok) {
    return notifyJson({ error: "Too many notifications. Try again shortly." }, 429);
  }

  const parsed = await readNotifyPayload(request);
  if (parsed.error) return parsed.error;

  const saved = await enqueueNotification(parsed.payload);
  const payload = parsed.payload;
  if (!isJsonObject(payload)) return notifyJson({ ok: true, id: saved.id });

  const event = alertEvent(payload);
  if (!event) return notifyJson({ ok: true, id: saved.id });

  try {
    await sendAssessmentAlert(payload, event);
  } catch (error) {
    console.error("Assessment alert email failed.", error);
    return notifyJson(
      { ok: true, id: saved.id, emailSent: false },
      200,
    );
  }

  return notifyJson({ ok: true, id: saved.id, emailSent: true });
}
