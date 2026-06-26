import { db } from "@workspace/db";
import { services, merchants } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../../lib/logger";

interface MerchantService {
  id?: string | number;
  service_id?: string | number;
  name: string;
  price?: string | number;
  cost?: string | number;
  rate?: string | number;
  description?: string;
  active?: boolean;
  status?: string;
  type?: string;
  category?: string;
}

function detectServiceType(svc: MerchantService): string {
  const name = (svc.name ?? "").toLowerCase();
  const cat = (svc.type ?? svc.category ?? "").toLowerCase();
  if (cat.includes("tool") || name.includes("tool")) return "tool";
  if (cat.includes("server") || name.includes("server")) return "server";
  return "imei";
}

export function buildMerchantHeaders(apiKey: string, apiUser?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json",
  };
  if (apiUser && apiUser.trim()) {
    const basicToken = Buffer.from(`${apiUser.trim()}:${apiKey}`).toString("base64");
    headers["Authorization"] = `Basic ${basicToken}`;
    headers["X-API-User"] = apiUser.trim();
    headers["X-Partner-ID"] = apiUser.trim();
    headers["X-Username"] = apiUser.trim();
  } else {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }
  headers["X-API-Key"] = apiKey;
  return headers;
}

export async function fetchMerchantServiceList(
  base: string,
  apiKey: string,
  apiUser: string | null,
  apiFormat: string,
): Promise<MerchantService[]> {
  let res: Response;

  if (apiFormat === "dhru") {
    res = await fetch(`${base}/api/reseller/v1/products`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0",
      },
    });
  } else if (apiFormat === "form") {
    const params = new URLSearchParams({ key: apiKey, action: "services" });
    if (apiUser && apiUser.trim()) params.set("username", apiUser.trim());
    res = await fetch(base, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0",
      },
      body: params.toString(),
    });
  } else {
    const headers = buildMerchantHeaders(apiKey, apiUser);
    res = await fetch(`${base}/services`, { headers });
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body.slice(0, 300)}`);
  }

  const raw = await res.json() as unknown;
  if (Array.isArray(raw)) return raw as MerchantService[];

  const obj = raw as Record<string, unknown>;

  // GSM Africa / Dhru Fusion: {status, data: {products: {uuid: {name,price,...}}}}
  const dataObj = obj["data"] as Record<string, unknown> | undefined;
  if (dataObj && dataObj["products"] && typeof dataObj["products"] === "object" && !Array.isArray(dataObj["products"])) {
    const productsMap = dataObj["products"] as Record<string, Record<string, unknown>>;
    return Object.entries(productsMap).map(([uuid, p]) => ({
      id: uuid,
      name: String(p["name"] ?? ""),
      price: p["price"] ?? p["cost"] ?? "0",
      description: p["description"] ? String(p["description"]) : undefined,
      type: p["type"] ? String(p["type"]) : undefined,
      active: true,
    }));
  }

  const list = obj["services"] ?? obj["products"] ?? obj["data"] ?? [];
  return Array.isArray(list) ? (list as MerchantService[]) : [];
}

async function syncSingleMerchant(merchant: {
  id: number;
  name: string;
  apiEndpoint: string;
  apiKey: string;
  apiUser: string | null;
  apiFormat: string;
}): Promise<{ synced: number; total: number }> {
  const base = merchant.apiEndpoint.replace(/\/$/, "");
  const list = await fetchMerchantServiceList(base, merchant.apiKey, merchant.apiUser, merchant.apiFormat ?? "rest");

  // Get existing services for this merchant to do upsert efficiently
  const existing = await db.select({ id: services.id, apiServiceId: services.apiServiceId })
    .from(services)
    .where(eq(services.merchantId, merchant.id));

  const existingMap = new Map(existing.map(s => [s.apiServiceId, s.id]));

  const toInsert: typeof services.$inferInsert[] = [];
  const toUpdate: Array<{ apiId: string; data: Partial<typeof services.$inferInsert> }> = [];

  for (const svc of list) {
    const apiId = String(svc.id ?? svc.service_id ?? "").trim();
    if (!apiId || !svc.name) continue;

    const priceRaw = parseFloat(String(svc.price ?? svc.cost ?? svc.rate ?? "0"));
    const price = isNaN(priceRaw) ? "0.00" : priceRaw.toFixed(2);
    const isActive =
      svc.active !== false &&
      svc.status !== "inactive" &&
      svc.status !== "disabled" &&
      svc.status !== "0";
    const serviceType = detectServiceType(svc);

    if (existingMap.has(apiId)) {
      toUpdate.push({
        apiId,
        data: { name: svc.name, price, description: svc.description ?? null, isActive, serviceType, category: serviceType, merchantId: merchant.id },
      });
    } else {
      toInsert.push({
        name: svc.name, category: serviceType, serviceType, price,
        description: svc.description ?? null, isActive, apiServiceId: apiId, merchantId: merchant.id,
      });
    }
  }

  // Batch insert new services (chunks of 100)
  const CHUNK = 100;
  for (let i = 0; i < toInsert.length; i += CHUNK) {
    await db.insert(services).values(toInsert.slice(i, i + CHUNK));
  }

  // Parallel update existing services (chunks of 50 concurrent)
  const CONCURRENT = 50;
  for (let i = 0; i < toUpdate.length; i += CONCURRENT) {
    await Promise.all(
      toUpdate.slice(i, i + CONCURRENT).map(({ apiId, data }) =>
        db.update(services).set(data).where(eq(services.apiServiceId, apiId))
      )
    );
  }

  return { synced: toInsert.length + toUpdate.length, total: list.length };
}

export async function syncMerchantProducts(merchantId?: number): Promise<{
  synced: number;
  total: number;
  skipped?: boolean;
  error?: string;
  details?: Array<{ merchant: string; synced: number; total: number; error?: string }>;
}> {
  const allMerchants = await db.select().from(merchants).where(
    merchantId ? eq(merchants.id, merchantId) : eq(merchants.isActive, true)
  );

  if (allMerchants.length === 0) {
    const endpoint = process.env["MERCHANT_API_ENDPOINT"];
    const apiKey = process.env["MERCHANT_API_KEY"];
    if (!endpoint || !apiKey) return { synced: 0, total: 0, skipped: true };
    logger.warn("No merchants in DB — falling back to env vars (legacy mode)");
    const apiUser = process.env["MERCHANT_API_USER"] ?? null;
    const result = await syncSingleMerchant({ id: 0, name: "Legacy Merchant", apiEndpoint: endpoint, apiKey, apiUser, apiFormat: "rest" });
    return { ...result };
  }

  let totalSynced = 0;
  let totalItems = 0;
  const details: Array<{ merchant: string; synced: number; total: number; error?: string }> = [];

  for (const merchant of allMerchants) {
    try {
      const result = await syncSingleMerchant({ ...merchant, apiFormat: merchant.apiFormat ?? "rest" });
      totalSynced += result.synced;
      totalItems += result.total;
      details.push({ merchant: merchant.name, synced: result.synced, total: result.total });
      logger.info({ merchant: merchant.name, ...result }, "Merchant sync complete");
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      details.push({ merchant: merchant.name, synced: 0, total: 0, error: errMsg });
      logger.error({ merchant: merchant.name, err }, "Merchant sync failed");
    }
  }

  return { synced: totalSynced, total: totalItems, details };
}
