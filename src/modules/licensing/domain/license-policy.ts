export const LICENSE_TERM_YEARS = 1;
export const MAX_ACTIVE_DEVICES = 3;

export type LicenseStatus = "pending" | "active" | "suspended" | "revoked";
export type LicenseCapability =
  | "account.read"
  | "history.read"
  | "data.export"
  | "premium.tools"
  | "kits.access";

export interface LicenseRecord {
  status: LicenseStatus;
  activatedAt: string | null;
  expiresAt: string | null;
}

export type EffectiveLicenseState = "pending" | "active" | "expired" | "suspended" | "revoked";

function parseInstant(value: string, field: string): Date {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) {
    throw new RangeError(`La fecha ${field} no es válida.`);
  }
  return parsed;
}

export function calculateLicenseExpiry(activatedAt: string): string {
  const date = parseInstant(activatedAt, "de activación");
  const originalDay = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCFullYear(date.getUTCFullYear() + LICENSE_TERM_YEARS);
  const lastDayOfTargetMonth = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    0,
  )).getUTCDate();
  date.setUTCDate(Math.min(originalDay, lastDayOfTargetMonth));
  return date.toISOString();
}

export function getEffectiveLicenseState(
  license: LicenseRecord,
  now: string,
): EffectiveLicenseState {
  if (license.status === "revoked" || license.status === "suspended" || license.status === "pending") {
    return license.status;
  }
  if (!license.activatedAt || !license.expiresAt) {
    return "pending";
  }
  const activated = parseInstant(license.activatedAt, "de activación");
  const expiry = parseInstant(license.expiresAt, "de vencimiento");
  const current = parseInstant(now, "actual");
  if (expiry.getTime() <= activated.getTime()) {
    throw new RangeError("El vencimiento debe ser posterior a la activación.");
  }
  const expectedExpiry = Date.parse(calculateLicenseExpiry(license.activatedAt));
  if (expiry.getTime() !== expectedExpiry) {
    throw new RangeError("El vencimiento debe corresponder a un año calendario desde la activación.");
  }
  if (current.getTime() < activated.getTime()) {
    return "pending";
  }
  return current.getTime() < expiry.getTime() ? "active" : "expired";
}

export function getLicenseCapabilities(
  state: EffectiveLicenseState,
): readonly LicenseCapability[] {
  const retained: LicenseCapability[] = [
    "account.read",
    "history.read",
    "data.export",
  ];
  return state === "active"
    ? [...retained, "premium.tools", "kits.access"]
    : retained;
}

export function canActivateAnotherDevice(
  state: EffectiveLicenseState,
  activeDeviceCount: number,
): boolean {
  if (!Number.isInteger(activeDeviceCount) || activeDeviceCount < 0) {
    return false;
  }
  return state === "active" && activeDeviceCount < MAX_ACTIVE_DEVICES;
}

export type ActivationCodeState = "available" | "redeemed" | "revoked" | "expired";

export function canRedeemActivationCode(
  state: ActivationCodeState,
  alreadyHasVerifiedPurchase: boolean,
): boolean {
  return state === "available" && alreadyHasVerifiedPurchase;
}
