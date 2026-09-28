import { db } from "@workspace/db";
import { services, merchants, orders } from "@workspace/db";
import { and, asc, eq, inArray } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { resolveIdentifierType } from "../services/orderConfig";
import { fieldNameMatches, normalizeMerchantFields } from "./fieldSchema";
import { uniqueServiceSlug } from "../services/slug";

interface MerchantService {
  id?: string | number;
  service_id?: string | number;
  service?: string | number;
  uuid?: string | number;
  product_uuid?: string | number;
  productId?: string | number;
  name: string;
  price?: string | number;
  cost?: string | number;
  rate?: string | number;
  description?: unknown;
  desc?: unknown;
  details?: unknown;
  detail?: unknown;
  service_description?: unknown;
  product_description?: unknown;
  instructions?: unknown;
  note?: unknown;
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
  input_fields?: unknown;
  inputFields?: unknown;
  form_fields?: unknown;
  formFields?: unknown;
  order_box?: unknown;
  orderBox?: unknown;
  orderbox?: unknown;
  order_form?: unknown;
  orderForm?: unknown;
  order_fields?: unknown;
  orderFields?: unknown;
  order_box_fields?: unknown;
  orderBoxFields?: unknown;
  required_fields?: unknown;
  requiredFields?: unknown;
  requirements?: unknown;
  inputs?: unknown;
  parameters?: unknown;
  schema?: unknown;
  field_schema?: unknown;
  fieldSchema?: unknown;
}

type ExistingService = {
  id: number;
  apiServiceId: string | null;
  slug: string | null;
};

function merchantServiceId(service: MerchantService): string {
  return String(
    service.id ??
    service.service_id ??
    service.service ??
    service.uuid ??
    service.product_uuid ??
    service.productId ??
    "",
  ).trim();
}

/**
 * Provider APIs occasionally return the same product more than once. The
 * provider ID is the stable identity, so keep one copy before touching the
 * database. The last copy wins because it is usually the most complete item
 * in inconsistent provider responses.
 */
export function deduplicateMerchantServices(list: MerchantService[]): MerchantService[] {
  const unique = new Map<string, MerchantService>();

  for (const service of list) {
    const apiId = merchantServiceId(service);
    if (!apiId || !service.name?.trim()) continue;
    unique.set(apiId, service);
  }

  return Array.from(unique.values());
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

const MERCHANT_FIELD_KEYS = [
  "order_box",
  "orderBox",
  "orderbox",
  "order_form",
  "orderForm",
  "fields",
  "input_fields",
  "inputFields",
  "form_fields",
  "formFields",
  "order_fields",
  "orderFields",
  "order_box_fields",
  "orderBoxFields",
  "required_fields",
  "requiredFields",
  "requirements",
  "inputs",
  "parameters",
  "schema",
  "field_schema",
  "fieldSchema",
] as const;

function firstNonNullish(record: Record<string, unknown>, keys: readonly string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key];
  }
  return undefined;
}

export function merchantFieldSource(service: MerchantService): unknown {
  return firstNonNullish(service as unknown as Record<string, unknown>, MERCHANT_FIELD_KEYS);
}

function textValue(value: unknown): string | null {
  if (typeof value === "string" || typeof value === "number") {
    const text = String(value).trim();
    return text || null;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const record = value as Record<string, unknown>;
  for (const key of ["text", "content", "value", "description", "details"]) {
    const text = textValue(record[key]);
    if (text) return text;
  }
  return null;
}

export function extractMerchantDescription(service: MerchantService): string | null {
  return textValue(firstNonNullish(service as unknown as Record<string, unknown>, [
    "description",
    "desc",
    "details",
    "detail",
    "service_description",
    "product_description",
    "instructions",
    "note",
  ]));
}

function normalizeMerchantService(value: unknown, fallbackId?: string): MerchantService | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const record = value as Record<string, unknown>;
  const id = firstNonNullish(record, [
    "id",
    "service_id",
    "service",
    "uuid",
    "product_uuid",
    "productId",
  ]) ?? fallbackId;
  const name = textValue(firstNonNullish(record, [
    "name",
    "service_name",
    "product_name",
    "title",
  ]));
  if (id === undefined || id === null || !name) return null;

  return {
    ...record,
    id: String(id),
    name,
  } as MerchantService;
}

/**
 * Provider response envelopes vary between arrays, keyed maps, and nested
 * data.services/data.products objects. Normalize all of them before the sync
 * pipeline so adding a merchant does not require another UI-specific adapter.
 */
export function normalizeMerchantServiceList(raw: unknown): MerchantService[] {
  if (Array.isArray(raw)) {
    return raw.flatMap((item) => {
      const service = normalizeMerchantService(item);
      return service ? [service] : [];
    });
  }
  if (!raw || typeof raw !== "object") return [];

  const record = raw as Record<string, unknown>;
  const directService = normalizeMerchantService(record);
  if (directService) return [directService];

  for (const key of ["services", "products", "data"]) {
    const nested = record[key];
    if (nested !== undefined && nested !== null && nested !== raw) {
      const services = normalizeMerchantServiceList(nested);
      if (services.length > 0) return services;
    }
  }

  return Object.entries(record).flatMap(([fallbackId, value]) => {
    const service = normalizeMerchantService(value, fallbackId);
    return service ? [service] : [];
  });
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

export function detectIdentifierType(svc: MerchantService, serviceType: string): string {
  const fields = normalizeMerchantFields(merchantFieldSource(svc));
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
  return normalizeMerchantServiceList(raw);

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
  const list = deduplicateMerchantServices(
    await fetchMerchantServiceList(base, merchant.apiKey, merchant.apiUser, merchant.apiFormat ?? "rest"),
  );

  // Get existing services for this merchant to do upsert efficiently
  const existing = await db.select({
    id: services.id,
    apiServiceId: services.apiServiceId,
    slug: services.slug,
  })
    .from(services)
    .where(eq(services.merchantId, merchant.id))
    .orderBy(asc(services.id));
  const allSlugs = await db.select({ slug: services.slug }).from(services);
  const reservedSlugs = new Set(allSlugs.map((row) => row.slug).filter((slug): slug is string => Boolean(slug)));

  const existingMap = new Map<string, ExistingService>();
  const duplicateRows: ExistingService[] = [];
  for (const service of existing) {
    if (!service.apiServiceId) continue;
    if (existingMap.has(service.apiServiceId)) {
      duplicateRows.push(service);
    } else {
      existingMap.set(service.apiServiceId, service);
    }
  }

  const toInsert: typeof services.$inferInsert[] = [];
  const toUpdate: Array<{ id: number; data: Partial<typeof services.$inferInsert> }> = [];
  const incomingIds = new Set<string>();

  for (const svc of list) {
    const apiId = merchantServiceId(svc);
    incomingIds.add(apiId);

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
        id: existingService.id,
        data: {
          name: svc.name,
          ...(existingService.slug ? {} : { slug }),
          price,
          description: extractMerchantDescription(svc),
          deliveryTime,
          isActive,
          serviceType,
          category: serviceType,
          merchantId: merchant.id,
          // Clear stale provider fields when the next response omits them.
          // Merchant rows are provider-owned, so an old order box must not
          // survive a later product-schema change.
          orderFields,
          // Merchant products are provider-owned. Recompute the identifier on
          // every sync so an old default IMEI does not survive a provider
          // update that describes a different order flow.
          identifierType,
          fieldLabel: svc.fieldLabel ?? identifierField?.label ?? null,
          ...(svc.requireQuantity === undefined && !hasMerchantFields ? { requireQuantity: false } : { requireQuantity: svc.requireQuantity ?? quantityFromFields }),
          ...(svc.requireUsername === undefined && !hasMerchantFields ? { requireUsername: false } : { requireUsername: svc.requireUsername ?? usernameFromFields }),
          ...(svc.requireEmail === undefined && !hasMerchantFields ? { requireEmail: false } : { requireEmail: svc.requireEmail ?? emailFromFields }),
        },
      });
    } else {
      toInsert.push({
        name: svc.name, category: serviceType, serviceType, price,
        description: extractMerchantDescription(svc), isActive, apiServiceId: apiId, merchantId: merchant.id,
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

  // Remove products that disappeared upstream and duplicate rows created by
  // earlier syncs. Keep rows referenced by orders for audit history, but
  // deactivate them so they cannot appear in the marketplace.
  const rowsToReconcile = list.length > 0
    ? [
        ...duplicateRows,
        ...existing.filter((service) =>
          Boolean(service.apiServiceId) && !incomingIds.has(service.apiServiceId as string),
        ),
      ]
    : [];
  const reconcileIds = Array.from(new Set(rowsToReconcile.map((row) => row.id)));
  if (reconcileIds.length > 0) {
    const referenced = await db
      .select({ serviceId: orders.serviceId })
      .from(orders)
      .where(inArray(orders.serviceId, reconcileIds));
    const referencedIds = new Set(referenced.map((row) => row.serviceId));
    const removableIds = reconcileIds.filter((id) => !referencedIds.has(id));
    const protectedIds = reconcileIds.filter((id) => referencedIds.has(id));

    if (removableIds.length > 0) {
      await db.delete(services).where(inArray(services.id, removableIds));
    }
    if (protectedIds.length > 0) {
      await db
        .update(services)
        .set({ isActive: false })
        .where(inArray(services.id, protectedIds));
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
      toUpdate.slice(i, i + CONCURRENT).map(({ id, data }) =>
        db.update(services).set(data).where(
          and(eq(services.id, id), eq(services.merchantId, merchant.id)),
        )
      )
    );
  }

  return { synced: list.length, total: list.length };
}

export async function syncMerchantProducts(merchantId?: number): Promise<{
  synced: number;
  total: number;
  skipped?: boolean;
  error?: string;
  details?: Array<{ merchant: string; synced: number; total: number; error?: string }>;
}> {
  return syncMerchantProductsLocked(merchantId);
}

let syncInFlight: Promise<Awaited<ReturnType<typeof syncMerchantProductsUnlocked>>> | null = null;

async function syncMerchantProductsLocked(merchantId?: number): Promise<{
  synced: number;
  total: number;
  skipped?: boolean;
  error?: string;
  details?: Array<{ merchant: string; synced: number; total: number; error?: string }>;
}> {
  if (syncInFlight) return syncInFlight;

  syncInFlight = syncMerchantProductsUnlocked(merchantId);
  try {
    return await syncInFlight;
  } finally {
    syncInFlight = null;
  }
}

async function syncMerchantProductsUnlocked(merchantId?: number): Promise<{
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
