import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  authorizeNotify,
  notifyJson,
  notifyOptions,
  takePendingNotifications,
} from "@/lib/notifications";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return notifyOptions();
}

export async function GET(request: Request) {
  return deliver(request);
}

export async function POST(request: Request) {
  return deliver(request);
}

async function deliver(request: Request) {
  const denied = authorizeNotify(request);
  if (denied) return denied;

  const limited = rateLimit(`notify-get:${clientIp(request)}`, 300, 60 * 1000);
  if (!limited.ok) {
    return notifyJson({ error: "Too many requests. Try again shortly." }, 429);
  }

  const notifications = await takePendingNotifications();
  return notifyJson({ notifications });
}
