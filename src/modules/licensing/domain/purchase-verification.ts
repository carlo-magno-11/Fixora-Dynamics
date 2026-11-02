export type PurchaseProvider = "etsy" | "gumroad" | "hotmart" | "manual";
export type PurchasePaymentStatus = "pending" | "approved" | "rejected";
export type PurchaseRefundStatus = "none" | "refunded" | "disputed" | "chargeback";

export interface PurchaseVerification {
  provider: PurchaseProvider;
  externalOrderId: string;
  productSku: string;
  paymentStatus: PurchasePaymentStatus;
  refundStatus: PurchaseRefundStatus;
  verifiedAt: string | null;
  verificationMethod: "provider_api" | "authenticated_webhook" | "manual_seller_review" | null;
}

export type PurchaseEligibility =
  | { eligible: true }
  | {
      eligible: false;
      reason:
        | "order_reference_missing"
        | "product_mismatch"
        | "payment_not_approved"
        | "purchase_not_verified"
        | "purchase_refunded"
        | "purchase_disputed"
        | "purchase_chargeback"
        | "unsupported_provider"
        | "verification_method_mismatch"
        | "purchase_data_invalid";
    };

const PROVIDER_METHODS: Record<PurchaseProvider, readonly NonNullable<PurchaseVerification["verificationMethod"]>[]> = {
  etsy: ["provider_api", "manual_seller_review"],
  gumroad: ["provider_api"],
  hotmart: ["authenticated_webhook"],
  manual: ["manual_seller_review"],
};

export function evaluatePurchaseEligibility(
  purchase: PurchaseVerification,
  expectedProductSku: string,
): PurchaseEligibility {
  if (typeof purchase.externalOrderId !== "string" || !purchase.externalOrderId.trim()) {
    return { eligible: false, reason: "order_reference_missing" };
  }

  if (
    typeof expectedProductSku !== "string" ||
    !expectedProductSku.trim() ||
    typeof purchase.productSku !== "string" ||
    purchase.productSku.trim() !== expectedProductSku.trim()
  ) {
    return { eligible: false, reason: "product_mismatch" };
  }

  if (!["etsy", "gumroad", "hotmart", "manual"].includes(purchase.provider)) {
    return { eligible: false, reason: "unsupported_provider" };
  }

  if (!["pending", "approved", "rejected"].includes(purchase.paymentStatus) ||
      !["none", "refunded", "disputed", "chargeback"].includes(purchase.refundStatus)) {
    return { eligible: false, reason: "purchase_data_invalid" };
  }

  if (purchase.refundStatus === "refunded") {
    return { eligible: false, reason: "purchase_refunded" };
  }
  if (purchase.refundStatus === "disputed") {
    return { eligible: false, reason: "purchase_disputed" };
  }
  if (purchase.refundStatus === "chargeback") {
    return { eligible: false, reason: "purchase_chargeback" };
  }
  if (purchase.paymentStatus !== "approved") {
    return { eligible: false, reason: "payment_not_approved" };
  }

  if (
    !purchase.verifiedAt ||
    !Number.isFinite(Date.parse(purchase.verifiedAt)) ||
    !purchase.verificationMethod
  ) {
    return { eligible: false, reason: "purchase_not_verified" };
  }

  if (!PROVIDER_METHODS[purchase.provider].includes(purchase.verificationMethod)) {
    return { eligible: false, reason: "verification_method_mismatch" };
  }

  return { eligible: true };
}
