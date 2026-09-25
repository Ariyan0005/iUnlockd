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
  quantity?: number;
  referenceId?: string;
  fields?: Record<string, string>;
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
    // Dhru Reseller API: POST /api/reseller/v1/order
    const dhruFields: Record<string, string | number> = {
      reference_id: params.referenceId ?? `local-${Date.now()}`,
      Quantity: params.quantity ?? 1,
      ...(params.fields ?? {}),
    };
    // Keep legacy IMEI services working when no dynamic schema was returned.
    if (params.identifier !== "-" && !Object.keys(dhruFields).some((key) => key.toLowerCase() === "imei")) {
      dhruFields["IMEI"] = params.identifier;
    }

    res = await fetch(`${base}/api/reseller/v1/order`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0",
      },
      body: JSON.stringify([{
        product_uuid: params.apiServiceId,
        fields: [dhruFields],
      }]),
    });
  } else if (apiFormat === "form") {
    const bodyParams = new URLSearchParams({
      key: apiKey,
      action: "add",
      service: params.apiServiceId,
      link: params.identifier,
      quantity: String(params.quantity ?? 1),
    });
    for (const [key, value] of Object.entries(params.fields ?? {})) bodyParams.set(key, value);
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
        quantity: params.quantity ?? 1,
        ...(params.fields ? { fields: params.fields } : {}),
        ...(params.additionalInfo ? { comments: params.additionalInfo } : {}),
      }),
    });
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Merchant API ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = await res.json() as Record<string, unknown>;
  const dataItems = Array.isArray(data["data"]) ? data["data"] as Array<Record<string, unknown>> : [];
  const firstItem = dataItems[0] ?? (data["data"] as Record<string, unknown> | undefined);
  const apiOrderId = String(
    firstItem?.["order_uuid"] ??
    firstItem?.["order_id"] ??
    data["id"] ??
    data["order_id"] ??
    data["orderId"] ??
    data["order"] ??
    data["uuid"] ??
    ""
  );
  const status = String(firstItem?.["status"] ?? data["status"] ?? "pending");
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
      res = await fetch(`${base}/api/reseller/v1/order?order_uuid=${encodeURIComponent(params.apiOrderId)}`, {
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
    const dataObj = data["data"] as Record<string, unknown> | undefined;
    const status = String(dataObj?.["status"] ?? data["status"] ?? data["order_status"] ?? "pending").toLowerCase();
    return {
      apiOrderId: params.apiOrderId,
      status,
      startCount: Number(data["start_count"] ?? 0),
      remains: Number(data["remains"] ?? 0),
      error: dataObj?.["replay"] ? String(dataObj["replay"]) : undefined,
    };
  } catch (err) {
    return { apiOrderId: params.apiOrderId, status: "unknown", error: String(err) };
  }
}
