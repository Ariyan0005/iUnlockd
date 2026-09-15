import { db } from "@workspace/db";
import { merchants } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { buildMerchantHeaders } from "./sync";

export interface MerchantOrderResult {
  apiOrderId?: string;
  status?: string;
  skipped: boolean;
}

export interface MerchantOrderStatus {
  apiOrderId: string;
  status: string;
  startCount?: number;
  remains?: number;
  error?: string;
}

async function getMerchantById(merchantId: number) {
  const [merchant] = await db.select().from(merchants).where(eq(merchants.id, merchantId)).limit(1);
  return merchant ?? null;
}

export async function submitMerchantOrder(params: {
  apiServiceId: string;
  identifier: string;
  additionalInfo?: string | null;
  merchantId?: number | null;
}): Promise<MerchantOrderResult> {
  let endpoint: string | undefined;
  let apiKey: string | undefined;
  let apiUser: string | undefined;
  let apiFormat = "rest";

  if (params.merchantId) {
    const merchant = await getMerchantById(params.merchantId);
    if (!merchant || !merchant.isActive) {
      logger.warn({ merchantId: params.merchantId }, "Merchant not found or inactive — skipping");
      return { skipped: true };
    }
    endpoint = merchant.apiEndpoint;
    apiKey = merchant.apiKey;
    apiUser = merchant.apiUser ?? undefined;
    apiFormat = merchant.apiFormat ?? "rest";
  } else {
    endpoint = process.env["MERCHANT_API_ENDPOINT"];
    apiKey = process.env["MERCHANT_API_KEY"];
    apiUser = process.env["MERCHANT_API_USER"];
  }

  if (!endpoint || !apiKey) return { skipped: true };

  const base = endpoint.replace(/\/$/, "");
  let res: Response;

  if (apiFormat === "dhru") {
    // GSM Africa: POST /api/reseller/v1/orders
    res = await fetch(`${base}/api/reseller/v1/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0",
      },
      body: JSON.stringify({
        product_uuid: params.apiServiceId,
        imei: params.identifier,
        ...(params.additionalInfo ? { additional_info: params.additionalInfo } : {}),
      }),
    });
  } else if (apiFormat === "form") {
    const bodyParams = new URLSearchParams({
      key: apiKey,
      action: "add",
      service: params.apiServiceId,
      link: params.identifier,
      quantity: "1",
    });
    if (apiUser && apiUser.trim()) bodyParams.set("username", apiUser.trim());
    if (params.additionalInfo) bodyParams.set("comments", params.additionalInfo);
    res = await fetch(base, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0",
      },
      body: bodyParams.toString(),
    });
  } else {
    const headers = buildMerchantHeaders(apiKey, apiUser);
    res = await fetch(`${base}/orders`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        service: params.apiServiceId,
        identifier: params.identifier,
        quantity: 1,
        ...(params.additionalInfo ? { comments: params.additionalInfo } : {}),
      }),
    });
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Merchant API ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = await res.json() as Record<string, unknown>;
  const apiOrderId = String(data["id"] ?? data["order_id"] ?? data["orderId"] ?? data["order"] ?? data["uuid"] ?? "");
  const status = String(data["status"] ?? "pending");
  logger.info({ apiOrderId, status }, "Merchant order forwarded");
  return { apiOrderId: apiOrderId || undefined, status, skipped: false };
}

// Check order status from merchant API
export async function checkMerchantOrderStatus(params: {
  apiOrderId: string;
  merchantId?: number | null;
}): Promise<MerchantOrderStatus> {
  let endpoint: string | undefined;
  let apiKey: string | undefined;
  let apiUser: string | undefined;
  let apiFormat = "rest";

  if (params.merchantId) {
    const merchant = await getMerchantById(params.merchantId);
    if (!merchant) return { apiOrderId: params.apiOrderId, status: "unknown", error: "Merchant not found" };
    endpoint = merchant.apiEndpoint;
    apiKey = merchant.apiKey;
    apiUser = merchant.apiUser ?? undefined;
    apiFormat = merchant.apiFormat ?? "rest";
  } else {
    endpoint = process.env["MERCHANT_API_ENDPOINT"];
    apiKey = process.env["MERCHANT_API_KEY"];
    apiUser = process.env["MERCHANT_API_USER"];
  }

  if (!endpoint || !apiKey) return { apiOrderId: params.apiOrderId, status: "unknown", error: "No credentials" };

  const base = endpoint.replace(/\/$/, "");
  let res: Response;

  try {
    if (apiFormat === "dhru") {
      res = await fetch(`${base}/api/reseller/v1/orders/${params.apiOrderId}`, {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0",
        },
      });
    } else if (apiFormat === "form") {
      const bodyParams = new URLSearchParams({ key: apiKey, action: "status", order: params.apiOrderId });
      if (apiUser && apiUser.trim()) bodyParams.set("username", apiUser.trim());
      res = await fetch(base, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" },
        body: bodyParams.toString(),
      });
    } else {
      const headers = buildMerchantHeaders(apiKey, apiUser);
      res = await fetch(`${base}/orders/${params.apiOrderId}`, { headers });
    }

    if (!res.ok) return { apiOrderId: params.apiOrderId, status: "unknown", error: `API ${res.status}` };

    const data = await res.json() as Record<string, unknown>;
    const status = String(data["status"] ?? data["order_status"] ?? "pending").toLowerCase();
    return {
      apiOrderId: params.apiOrderId,
      status,
      startCount: Number(data["start_count"] ?? 0),
      remains: Number(data["remains"] ?? 0),
    };
  } catch (err) {
    return { apiOrderId: params.apiOrderId, status: "unknown", error: String(err) };
  }
}
