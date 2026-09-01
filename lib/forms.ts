import "server-only";

import type { ServiceId } from "./services";

const SECURE_FORMS: Partial<Record<ServiceId, string>> = {
  contactUs:
    "https://docs.google.com/forms/d/e/1FAIpQLSdvyzrLkbldraHbsKKsL3Khm6wFz5rf3Ftnp4UAdYVnsjRfSQ/viewform",
  snorkel:
    "https://docs.google.com/forms/d/e/1FAIpQLSemhB-1xZhPb7BEQLRs9Nic02AwPdXr5FPXpf5bRK4Kef5caw/viewform",
};

export function getSecureFormUrl(id: ServiceId): string | null {
  return SECURE_FORMS[id] ?? null;
}
