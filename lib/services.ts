export const SERVICE_IDS = [
  "upwork",
  "freelancer",
  "outlier",
  "handshake",
  "snorkel",
  "afterquery",
  "meridial",
  "mercor",
  "micro1",
  "alignerr",
  "bankCreate",
  "paypalCreate",
  "payoneerCreate",
  "documentEdit",
  "personalInfoLookup",
  "drugTest",
  "laptopHost",
  "paypalRemoveHold",
  "contactUs",
] as const;

export type ServiceId = (typeof SERVICE_IDS)[number];

export type ServiceDefinition = {
  id: ServiceId;
  label: string;
  shortLabel: string;
  hasSecureForm: boolean;
};

export const ACCOUNT_HELP: ServiceDefinition[] = [
  { id: "upwork", label: "Upwork", shortLabel: "Upwork", hasSecureForm: false },
  { id: "freelancer", label: "Freelancer", shortLabel: "Freelancer", hasSecureForm: false },
  { id: "outlier", label: "Outlier", shortLabel: "Outlier", hasSecureForm: false },
  { id: "handshake", label: "Handshake", shortLabel: "Handshake", hasSecureForm: false },
  { id: "snorkel", label: "Snorkel", shortLabel: "Snorkel", hasSecureForm: true },
  { id: "afterquery", label: "AfterQuery", shortLabel: "AfterQuery", hasSecureForm: false },
  { id: "meridial", label: "Meridial", shortLabel: "Meridial", hasSecureForm: false },
  { id: "mercor", label: "Mercor", shortLabel: "Mercor", hasSecureForm: false },
  { id: "micro1", label: "Micro1", shortLabel: "Micro1", hasSecureForm: false },
  { id: "alignerr", label: "Alignerr", shortLabel: "Alignerr", hasSecureForm: false },
];

export const OTHER_SERVICES: ServiceDefinition[] = [
  { id: "bankCreate", label: "Create Bank Account", shortLabel: "Bank", hasSecureForm: false },
  { id: "paypalCreate", label: "Create PayPal Account", shortLabel: "PayPal", hasSecureForm: false },
  { id: "payoneerCreate", label: "Create Payoneer Account", shortLabel: "Payoneer", hasSecureForm: false },
  { id: "documentEdit", label: "Edit Documents", shortLabel: "Docs", hasSecureForm: false },
  { id: "personalInfoLookup", label: "Personal Info Lookup", shortLabel: "Lookup", hasSecureForm: false },
  { id: "drugTest", label: "Drug Test", shortLabel: "Drug Test", hasSecureForm: false },
  { id: "laptopHost", label: "Laptop Host", shortLabel: "Laptop", hasSecureForm: false },
  { id: "paypalRemoveHold", label: "Remove PayPal Hold", shortLabel: "PayPal Hold", hasSecureForm: false },
];

export const COLLABORATION: ServiceDefinition[] = [
  { id: "contactUs", label: "Contact Us", shortLabel: "Contact", hasSecureForm: true },
];

export const ALL_SERVICES: ServiceDefinition[] = [
  ...ACCOUNT_HELP,
  ...OTHER_SERVICES,
  ...COLLABORATION,
];

export function isServiceId(value: string): value is ServiceId {
  return (SERVICE_IDS as readonly string[]).includes(value);
}

export const DEFAULT_FLAGS: Record<ServiceId, boolean> = {
  upwork: false,
  freelancer: false,
  outlier: false,
  handshake: false,
  snorkel: false,
  afterquery: false,
  meridial: false,
  mercor: false,
  micro1: false,
  alignerr: false,
  bankCreate: false,
  paypalCreate: false,
  payoneerCreate: false,
  documentEdit: false,
  personalInfoLookup: false,
  drugTest: false,
  laptopHost: false,
  paypalRemoveHold: false,
  contactUs: true,
};

export function normalizeFlags(
  flags: Partial<Record<ServiceId, boolean>> | null | undefined,
): Record<ServiceId, boolean> {
  const result = { ...DEFAULT_FLAGS };
  if (!flags) return result;
  for (const id of SERVICE_IDS) {
    if (typeof flags[id] === "boolean") {
      result[id] = flags[id] as boolean;
    }
  }
  return result;
}
