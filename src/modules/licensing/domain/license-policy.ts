export const LICENSE_TERM_YEARS = 1;
export const MAX_ACTIVE_DEVICES = 3;
export const DEFAULT_LICENSE_TERM = { unit: "months", value: 12 } as const;

export type LicenseTerm =
  | { unit: "days"; value: number }
  | { unit: "months"; value: number };

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
  term?: LicenseTerm;
}

export type EffectiveLicenseState = "pending" | "active" | "expired" | "suspended" | "revoked";

function parseInstant(value: string, field: string): Date {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) {
    throw new RangeError(`La fecha ${field} no es válida.`);
  }
  return parsed;
}

function validateTerm(term: LicenseTerm): void {
  if (!Number.isInteger(term.value)) {
    throw new RangeError("La duración de la licencia debe ser un entero.");
  }
  if (term.unit === "days" && (term.value < 1 || term.value > 3650)) {
    throw new RangeError("La duración en días debe estar entre 1 y 3650.");
  }
  if (term.unit === "months" && (term.value < 1 || term.value > 60)) {
    throw new RangeError("La duración en meses debe estar entre 1 y 60.");
  }
}

export function calculateLicenseExpiry(
  activatedAt: string,
  term: LicenseTerm = DEFAULT_LICENSE_TERM,
): string {
  const date = parseInstant(activatedAt, "de activación");
  validateTerm(term);

  if (term.unit === "days") {
    const expiry = date.getTime() + term.value * 86_400_000;
    if (!Number.isFinite(expiry) || !Number.isFinite(new Date(expiry).getTime())) {
      throw new RangeError("La fecha de vencimiento está fuera del rango permitido.");
    }
    return new Date(expiry).toISOString();
  }

  const originalDay = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + term.value);
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
  const expectedExpiry = Date.parse(calculateLicenseExpiry(license.activatedAt, license.term));
  if (expiry.getTime() !== expectedExpiry) {
    throw new RangeError("El vencimiento no corresponde a la duración del producto.");
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
