import { describe, expect, it } from "vitest";
import { evaluatePurchaseEligibility, type PurchaseVerification } from "./purchase-verification";

const verifiedPurchase: PurchaseVerification = {
  provider: "etsy",
  externalOrderId: "ORDER-2026-001",
  productSku: "FIXORA-ESSENTIALS-ANNUAL",
  paymentStatus: "approved",
  refundStatus: "none",
  verifiedAt: "2026-10-30T12:00:00.000Z",
  verificationMethod: "manual_seller_review",
};

describe("purchase verification policy", () => {
  it("accepts an approved, verified purchase of the expected product", () => {
    expect(evaluatePurchaseEligibility(verifiedPurchase, "FIXORA-ESSENTIALS-ANNUAL")).toEqual({ eligible: true });
  });

  it("rejects a missing order reference", () => {
    expect(evaluatePurchaseEligibility({ ...verifiedPurchase, externalOrderId: " " }, "FIXORA-ESSENTIALS-ANNUAL")).toMatchObject({
      eligible: false,
      reason: "order_reference_missing",
    });
  });

  it("rejects a different product SKU", () => {
    expect(evaluatePurchaseEligibility(verifiedPurchase, "FIXORA-RETAIL-KIT")).toMatchObject({
      eligible: false,
      reason: "product_mismatch",
    });
  });

  it("rejects pending or rejected payments", () => {
    expect(evaluatePurchaseEligibility({ ...verifiedPurchase, paymentStatus: "pending" }, "FIXORA-ESSENTIALS-ANNUAL")).toMatchObject({
      eligible: false,
      reason: "payment_not_approved",
    });
  });

  it.each(["refunded", "disputed", "chargeback"] as const)(
    "rejects purchases marked %s",
    (refundStatus) => {
      expect(evaluatePurchaseEligibility({ ...verifiedPurchase, refundStatus }, "FIXORA-ESSENTIALS-ANNUAL")).toMatchObject({
        eligible: false,
      });
    },
  );

  it("does not treat a screenshot or unverified reference as proof", () => {
    expect(evaluatePurchaseEligibility({
      ...verifiedPurchase,
      verifiedAt: null,
      verificationMethod: null,
    }, "FIXORA-ESSENTIALS-ANNUAL")).toMatchObject({
      eligible: false,
      reason: "purchase_not_verified",
    });
  });

  it("rejects unsupported commerce providers at runtime", () => {
    const invalid = { ...verifiedPurchase, provider: "unknown" } as unknown as PurchaseVerification;
    expect(evaluatePurchaseEligibility(invalid, "FIXORA-ESSENTIALS-ANNUAL")).toMatchObject({
      eligible: false,
      reason: "unsupported_provider",
    });
  });

  it("requires a verification method appropriate to the provider", () => {
    expect(evaluatePurchaseEligibility({
      ...verifiedPurchase,
      provider: "hotmart",
      verificationMethod: "manual_seller_review",
    }, "FIXORA-ESSENTIALS-ANNUAL")).toMatchObject({
      eligible: false,
      reason: "verification_method_mismatch",
    });
  });

  it("rejects empty product identifiers and malformed payment states", () => {
    expect(evaluatePurchaseEligibility(verifiedPurchase, " ")).toMatchObject({
      eligible: false,
      reason: "product_mismatch",
    });
    const invalid = { ...verifiedPurchase, paymentStatus: "paid" } as unknown as PurchaseVerification;
    expect(evaluatePurchaseEligibility(invalid, "FIXORA-ESSENTIALS-ANNUAL")).toMatchObject({
      eligible: false,
      reason: "purchase_data_invalid",
    });
  });

  it("rejects malformed verification timestamps", () => {
    expect(evaluatePurchaseEligibility({
      ...verifiedPurchase,
      verifiedAt: "not-a-date",
    }, "FIXORA-ESSENTIALS-ANNUAL")).toMatchObject({
      eligible: false,
      reason: "purchase_not_verified",
    });
  });
});
