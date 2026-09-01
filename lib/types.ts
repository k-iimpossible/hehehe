import type { ServiceId } from "./services";

export type PublicUser = {
  id: string;
  accountId: string;
  telegramId: string;
  role: "USER" | "SUPER_ADMIN";
  flags: Record<ServiceId, boolean>;
};
