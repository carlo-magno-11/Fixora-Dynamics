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
        | "purchase_chargeback";
    };

export function evaluatePurchaseEligibility(
  purchase: PurchaseVerification,
  expectedProductSku: string,
): PurchaseEligibility {
  if (!purchase.externalOrderId.trim()) {
    return { eligible: false, reason: "order_reference_missing" };
  }
  if (!expectedProductSku || purchase.productSku !== expectedProductSku) {
    return { eligible: false, reason: "product_mismatch" };
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
  return { eligible: true };
}
