import { db } from "@workspace/db";
import { services, merchants } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { resolveIdentifierType } from "../services/orderConfig";
import { fieldNameMatches, normalizeMerchantFields } from "./fieldSchema";
import { uniqueServiceSlug } from "../services/slug";
import type { ServiceOrderField } from "@workspace/db";

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
  identifierType?: string;
  fieldLabel?: string;
  requireQuantity?: boolean;
  requireUsername?: boolean;
  requireEmail?: boolean;
  fields?: unknown;
  order_fields?: unknown;
  orderFields?: unknown;
  required_fields?: unknown;
  requiredFields?: unknown;
  requirements?: unknown;
  inputs?: unknown;
  parameters?: unknown;
}

const DELIVERY_TIME_KEYS = [
  "deliveryTime",
  "delivery_time",
  "processingTime",
  "processing_time",
  "turnaroundTime",
  "turnaround_time",
  "time",
  "duration",
  "eta",
] as const;

function extractDeliveryTime(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;

  for (const key of DELIVERY_TIME_KEYS) {
    const candidate = record[key];
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
    if (typeof candidate === "number" && Number.isFinite(candidate)) return String(candidate);
  }

  return null;
}

function merchantFieldSource(service: MerchantService): unknown {
  return service.fields ??
    service.order_fields ??
    service.orderFields ??
    service.required_fields ??
    service.requiredFields ??
    service.requirements ??
    service.inputs ??
    service.parameters;
}

function detectServiceType(svc: MerchantService): string {
  const name = (svc.name ?? "").toLowerCase();
  const cat = (svc.type ?? svc.category ?? "").toLowerCase();
  if (cat.includes("tool") || name.includes("tool")) return "tool";
  if (
    cat.includes("gift") ||
    cat.includes("voucher") ||
    name.includes("gift card") ||
    name.includes("voucher")
  ) return "gift_card";
  if (
    cat.includes("game") ||
    cat.includes("topup") ||
    cat.includes("top-up") ||
    name.includes("game top") ||
    name.includes("game recharge")
  ) return "game";
  if (cat.includes("server") || name.includes("server")) return "server";
  if (
    cat.includes("imei") ||
    name.includes("imei") ||
    name.includes("mdm") ||
    name.includes("icloud") ||
    name.includes("bypass") ||
    name.includes("carrier unlock")
  ) return "imei";
  return "other";
}

function detectIdentifierType(svc: MerchantService, serviceType: string): string {
  const fields = normalizeMerchantFields(svc.fields);
  if (fields.some((field) => fieldNameMatches(field, /\bimei\b/i))) return "imei";
  if (fields.some((field) => fieldNameMatches(field, /\b(serial|sn)\b/i))) return "sn";
  if (fields.some((field) => fieldNameMatches(field, /\bemail\b/i))) return "email";
  if (fields.some((field) => fieldNameMatches(field, /\busername\b/i))) return "username";
  // When the provider supplied a product schema, that schema is authoritative.
  // Do not reintroduce the legacy IMEI default for products whose input is
  // something else (for example account, username, or a license key).
  if (merchantFieldSource(svc) !== undefined) return "none";
  return resolveIdentifierType({
    name: svc.name,
    category: svc.category,
    serviceType,
    identifierType: svc.identifierType,
    fieldLabel: svc.fieldLabel,
  });
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
      price: String(p["price"] ?? p["cost"] ?? "0"),
      description: p["description"] ? String(p["description"]) : undefined,
      type: p["type"] ? String(p["type"]) : undefined,
      deliveryTime: extractDeliveryTime(p),
        fields: p["fields"] ??
          p["order_fields"] ??
          p["orderFields"] ??
          p["required_fields"] ??
          p["requiredFields"] ??
          p["requirements"] ??
          p["inputs"] ??
          p["parameters"],
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
  const existing = await db.select({
    id: services.id,
    apiServiceId: services.apiServiceId,
    slug: services.slug,
  })
    .from(services)
    .where(eq(services.merchantId, merchant.id));
  const allSlugs = await db.select({ slug: services.slug }).from(services);
  const reservedSlugs = new Set(allSlugs.map((row) => row.slug).filter((slug): slug is string => Boolean(slug)));

  const existingMap = new Map(existing.map((service) => [service.apiServiceId, service]));

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
    const deliveryTime = extractDeliveryTime(svc);
    const identifierType = detectIdentifierType(svc, serviceType);
    const rawFields = merchantFieldSource(svc);
    const orderFields = normalizeMerchantFields(rawFields);
    const hasMerchantFields = rawFields !== undefined;
    const quantityFromFields = orderFields.some((field) => fieldNameMatches(field, /^quantity$/i));
    const usernameFromFields = orderFields.some((field) => fieldNameMatches(field, /^username$/i));
    const emailFromFields = orderFields.some((field) => fieldNameMatches(field, /^email$/i));
    const identifierField = orderFields.find((field) =>
      fieldNameMatches(field, /\b(imei|serial|sn|email|username)\b/i)
    );

    const existingService = existingMap.get(apiId);
    const slug = existingService?.slug ??
      uniqueServiceSlug(svc.name, apiId, reservedSlugs);
    reservedSlugs.add(slug);

    if (existingService) {
      toUpdate.push({
        apiId,
        data: {
          name: svc.name,
          ...(existingService.slug ? {} : { slug }),
          price,
          description: svc.description ?? null,
          deliveryTime,
          isActive,
          serviceType,
          category: serviceType,
          merchantId: merchant.id,
          ...(hasMerchantFields ? { orderFields } : {}),
          ...(hasMerchantFields || svc.identifierType !== undefined
            ? { identifierType, fieldLabel: svc.fieldLabel ?? identifierField?.label ?? null }
            : {}),
          ...(svc.requireQuantity === undefined && !hasMerchantFields ? {} : { requireQuantity: svc.requireQuantity ?? quantityFromFields }),
          ...(svc.requireUsername === undefined && !hasMerchantFields ? {} : { requireUsername: svc.requireUsername ?? usernameFromFields }),
          ...(svc.requireEmail === undefined && !hasMerchantFields ? {} : { requireEmail: svc.requireEmail ?? emailFromFields }),
        },
      });
    } else {
      toInsert.push({
        name: svc.name, category: serviceType, serviceType, price,
        description: svc.description ?? null, isActive, apiServiceId: apiId, merchantId: merchant.id,
        deliveryTime,
        slug,
        identifierType,
        fieldLabel: svc.fieldLabel ?? identifierField?.label ?? null,
        requireQuantity: svc.requireQuantity ?? quantityFromFields,
        requireUsername: svc.requireUsername ?? usernameFromFields,
        requireEmail: svc.requireEmail ?? emailFromFields,
        orderFields,
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
