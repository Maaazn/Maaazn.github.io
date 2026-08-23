export interface GumroadPurchase {
  product_id: string;
  subscription_id?: string | null;
  license_key: string;
  refunded?: boolean;
  disputed?: boolean;
  chargebacked?: boolean;
  subscription_ended_at?: string | null;
  subscription_cancelled_at?: string | null;
  subscription_failed_at?: string | null;
}

interface GumroadLicenseResponse {
  success: boolean;
  purchase?: GumroadPurchase;
  message?: string;
}

export async function verifyLicense(productId: string, licenseKey: string): Promise<GumroadPurchase> {
  const payload = new URLSearchParams({
    product_id: productId,
    license_key: licenseKey.trim(),
    increment_uses_count: "false",
  });

  const response = await fetch("https://api.gumroad.com/v2/licenses/verify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: payload,
  });
  const result = (await response.json()) as GumroadLicenseResponse;
  if (!response.ok || !result.success || !result.purchase) {
    throw new Error(result.message || "تعذر التحقق من مفتاح الوصول.");
  }
  if (result.purchase.product_id !== productId) {
    throw new Error("هذا المفتاح لا يخص منتج KashifWeb Pro.");
  }
  return result.purchase;
}

export function accessState(purchase: GumroadPurchase): "active" | "ended" | "refunded" | "disputed" {
  if (purchase.refunded || purchase.chargebacked) return "refunded";
  if (purchase.disputed) return "disputed";
  if (purchase.subscription_ended_at || purchase.subscription_cancelled_at || purchase.subscription_failed_at) return "ended";
  return "active";
}
