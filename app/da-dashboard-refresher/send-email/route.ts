import { sendClaimedTaskEmail } from "@/lib/assessment-email";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  isJsonObject,
  notifyJson,
  notifyOptions,
  readNotifyPayload,
} from "@/lib/notifications";
import { parseJstTime } from "@/lib/triton";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return notifyOptions();
}

export async function POST(request: Request) {
  const limited = rateLimit(`triton-email:${clientIp(request)}`, 60, 60 * 1000);
  if (!limited.ok) {
    return notifyJson({ error: "Too many requests. Try again shortly." }, 429);
  }

  const parsed = await readNotifyPayload(request);
  if (parsed.error) return parsed.error;
  if (!isJsonObject(parsed.payload)) {
    return notifyJson({ error: "Request must be a JSON object." }, 400);
  }

  const payload = parsed.payload as Record<string, unknown>;
  const name = text(payload.name);
  const projectName = text(payload.project_name);
  const rate = text(payload.rate);
  const claimedTime = typeof payload.claimed_time === "string" ? payload.claimed_time.trim() : "";
  if (!name || !projectName || !rate || !parseJstTime(claimedTime)) {
    return notifyJson(
      { error: "name, project_name, rate, and claimed_time are required. claimed_time is JST." },
      400,
    );
  }

  try {
    await sendClaimedTaskEmail({ name, projectName, rate, claimedTime });
  } catch (error) {
    console.error("Claimed task email failed.", error);
    return notifyJson({ ok: true, emailSent: false });
  }

  return notifyJson({ ok: true, emailSent: true });
}

function text(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}
