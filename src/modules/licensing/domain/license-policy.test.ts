import { describe, expect, it } from "vitest";
import {
  calculateLicenseExpiry,
  canActivateAnotherDevice,
  canRedeemActivationCode,
  getEffectiveLicenseState,
  getLicenseCapabilities,
  MAX_ACTIVE_DEVICES,
} from "./license-policy";

describe("Fixora license duration policy", () => {
  it("calculates one calendar year from first activation by default", () => {
    expect(calculateLicenseExpiry("2026-10-30T12:00:00.000Z")).toBe("2027-10-30T12:00:00.000Z");
  });

  it("clamps leap-day annual activation to the last valid day in February", () => {
    expect(calculateLicenseExpiry("2024-02-29T08:15:00.000Z")).toBe("2025-02-28T08:15:00.000Z");
  });

  it("calculates exactly 30 days as 720 hours from activation", () => {
    expect(calculateLicenseExpiry("2026-11-03T12:00:00.000Z", {
      unit: "days",
      value: 30,
    })).toBe("2026-12-03T12:00:00.000Z");
  });

  it("preserves UTC time and handles day terms across leap day", () => {
    expect(calculateLicenseExpiry("2024-02-28T08:15:00.000Z", {
      unit: "days",
      value: 2,
    })).toBe("2024-03-01T08:15:00.000Z");
  });

  it("supports calendar month terms without treating them as fixed days", () => {
    expect(calculateLicenseExpiry("2026-01-31T10:00:00.000Z", {
      unit: "months",
      value: 1,
    })).toBe("2026-02-28T10:00:00.000Z");
  });

  it("rejects invalid activation dates", () => {
    expect(() => calculateLicenseExpiry("not-a-date")).toThrow(RangeError);
  });

  it("rejects zero, negative, fractional and out-of-range terms", () => {
    expect(() => calculateLicenseExpiry("2026-11-03T12:00:00.000Z", { unit: "days", value: 0 })).toThrow(RangeError);
    expect(() => calculateLicenseExpiry("2026-11-03T12:00:00.000Z", { unit: "days", value: -1 })).toThrow(RangeError);
    expect(() => calculateLicenseExpiry("2026-11-03T12:00:00.000Z", { unit: "days", value: 1.5 })).toThrow(RangeError);
    expect(() => calculateLicenseExpiry("2026-11-03T12:00:00.000Z", { unit: "days", value: 3651 })).toThrow(RangeError);
    expect(() => calculateLicenseExpiry("2026-11-03T12:00:00.000Z", { unit: "months", value: 61 })).toThrow(RangeError);
  });

  it("keeps annual licenses active immediately before expiry and expires at the boundary", () => {
    const license = {
      status: "active" as const,
      activatedAt: "2026-10-30T12:00:00.000Z",
      expiresAt: "2027-10-30T12:00:00.000Z",
    };
    expect(getEffectiveLicenseState(license, "2027-10-30T11:59:59.999Z")).toBe("active");
    expect(getEffectiveLicenseState(license, "2027-10-30T12:00:00.000Z")).toBe("expired");
  });

  it("keeps 30-day licenses active immediately before expiry and expires at the boundary", () => {
    const license = {
      status: "active" as const,
      activatedAt: "2026-11-03T12:00:00.000Z",
      expiresAt: "2026-12-03T12:00:00.000Z",
      term: { unit: "days" as const, value: 30 },
    };
    expect(getEffectiveLicenseState(license, "2026-12-03T11:59:59.999Z")).toBe("active");
    expect(getEffectiveLicenseState(license, "2026-12-03T12:00:00.000Z")).toBe("expired");
  });

  it("rejects a 30-day license whose stored expiry is inconsistent", () => {
    expect(() => getEffectiveLicenseState({
      status: "active",
      activatedAt: "2026-11-03T12:00:00.000Z",
      expiresAt: "2026-12-04T12:00:00.000Z",
      term: { unit: "days", value: 30 },
    }, "2026-11-20T12:00:00.000Z")).toThrow("El vencimiento no corresponde a la duración del producto.");
  });

  it("keeps a pending license pending even if dates are accidentally populated", () => {
    expect(getEffectiveLicenseState({
      status: "pending",
      activatedAt: "2026-10-30T12:00:00.000Z",
      expiresAt: "2027-10-30T12:00:00.000Z",
    }, "2026-11-01T12:00:00.000Z")).toBe("pending");
  });

  it("does not grant an active license before its activation timestamp", () => {
    const state = getEffectiveLicenseState({
      status: "active",
      activatedAt: "2027-01-01T00:00:00.000Z",
      expiresAt: "2028-01-01T00:00:00.000Z",
    }, "2026-12-31T23:59:59.999Z");
    expect(state).toBe("pending");
    expect(getLicenseCapabilities(state)).not.toContain("premium.tools");
  });

  it("rejects a license whose expiry is not after activation", () => {
    expect(() => getEffectiveLicenseState({
      status: "active",
      activatedAt: "2027-01-01T00:00:00.000Z",
      expiresAt: "2026-12-31T23:59:59.000Z",
    }, "2026-10-30T12:00:00.000Z")).toThrow(RangeError);
  });

  it("preserves account, history and export capabilities after expiry", () => {
    const capabilities = getLicenseCapabilities("expired");
    expect(capabilities).toContain("account.read");
    expect(capabilities).toContain("history.read");
    expect(capabilities).toContain("data.export");
    expect(capabilities).not.toContain("premium.tools");
    expect(capabilities).not.toContain("kits.access");
  });

  it("does not grant premium access to suspended or revoked licenses", () => {
    expect(getLicenseCapabilities("suspended")).not.toContain("premium.tools");
    expect(getLicenseCapabilities("revoked")).not.toContain("premium.tools");
  });

  it("allows no more than three active devices per license", () => {
    expect(MAX_ACTIVE_DEVICES).toBe(3);
    expect(canActivateAnotherDevice("active", 2)).toBe(true);
    expect(canActivateAnotherDevice("active", 3)).toBe(false);
    expect(canActivateAnotherDevice("expired", 0)).toBe(false);
  });

  it("rejects invalid active-device counts", () => {
    expect(canActivateAnotherDevice("active", -1)).toBe(false);
    expect(canActivateAnotherDevice("active", 1.5)).toBe(false);
  });

  it("requires an available code and verified purchase to redeem", () => {
    expect(canRedeemActivationCode("available", true)).toBe(true);
    expect(canRedeemActivationCode("available", false)).toBe(false);
    expect(canRedeemActivationCode("redeemed", true)).toBe(false);
    expect(canRedeemActivationCode("revoked", true)).toBe(false);
    expect(canRedeemActivationCode("expired", true)).toBe(false);
  });
});
