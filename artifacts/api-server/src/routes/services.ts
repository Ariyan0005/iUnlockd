import { Router } from "express";
import { db } from "@workspace/db";
import { services, merchants } from "@workspace/db";
import { eq, and, or, isNull } from "drizzle-orm";
import { resolveIdentifierType } from "../modules/services/orderConfig";

const router = Router();

function publicService(service: {
  id: number;
  slug: string | null;
  name: string;
  category: string;
  serviceType: string;
  description: string | null;
  deliveryTime: string | null;
  price: string;
  isActive: boolean;
  identifierType: string;
  fieldLabel: string | null;
  requireQuantity: boolean;
  requireUsername: boolean;
  requireEmail: boolean;
  orderFields: unknown;
}) {
  return {
    slug: service.slug ?? `service-${service.id}`,
    name: service.name,
    category: service.category,
    serviceType: service.serviceType,
    description: service.description,
    processingTime: service.deliveryTime,
    price: service.price,
    isActive: service.isActive,
    identifierType: resolveIdentifierType(service),
    fieldLabel: service.fieldLabel,
    requireQuantity: service.requireQuantity,
    requireUsername: service.requireUsername,
    requireEmail: service.requireEmail,
    orderFields: service.orderFields ?? [],
  };
}

router.get("/", async (req, res) => {
  try {
    const type = req.query["type"] as string | undefined;

    // Only show services where: service is active AND (no merchant OR merchant is active)
    const rows = await db
      .select({
        id: services.id,
        name: services.name,
        category: services.category,
        serviceType: services.serviceType,
        description: services.description,
        deliveryTime: services.deliveryTime,
        price: services.price,
        isActive: services.isActive,
        slug: services.slug,
        identifierType: services.identifierType,
        fieldLabel: services.fieldLabel,
        requireQuantity: services.requireQuantity,
        requireUsername: services.requireUsername,
        requireEmail: services.requireEmail,
         orderFields: services.orderFields,
      })
      .from(services)
      .leftJoin(merchants, eq(services.merchantId, merchants.id))
      .where(
        type
          ? and(
              eq(services.isActive, true),
              eq(services.serviceType, type),
              or(isNull(services.merchantId), eq(merchants.isActive, true))
            )
          : and(
              eq(services.isActive, true),
              or(isNull(services.merchantId), eq(merchants.isActive, true))
            )
      );

    res.json(rows.map(publicService));
  } catch (err) {
    req.log.error({ err }, "Get services error");
    res.status(500).json({ error: "Failed to get services" });
  }
});

router.get("/slug/:slug", async (req, res) => {
  try {
    const slug = String(req.params["slug"] ?? "").trim().toLowerCase();
    if (!slug) { res.status(400).json({ error: "Invalid service slug" }); return; }

    const [row] = await db
      .select({
        id: services.id,
        slug: services.slug,
        name: services.name,
        category: services.category,
        serviceType: services.serviceType,
        description: services.description,
        deliveryTime: services.deliveryTime,
        price: services.price,
        isActive: services.isActive,
        identifierType: services.identifierType,
        fieldLabel: services.fieldLabel,
        requireQuantity: services.requireQuantity,
        requireUsername: services.requireUsername,
        requireEmail: services.requireEmail,
        orderFields: services.orderFields,
        merchantActive: merchants.isActive,
        merchantId: services.merchantId,
      })
      .from(services)
      .leftJoin(merchants, eq(services.merchantId, merchants.id))
      .where(
        (() => {
          const legacyId = /^service-(\d+)$/.exec(slug)?.[1];
          return legacyId
            ? or(eq(services.slug, slug), eq(services.id, Number(legacyId)))
            : eq(services.slug, slug);
        })(),
      )
      .limit(1);

    if (!row || !row.isActive || (row.merchantId !== null && row.merchantActive !== true)) {
      res.status(404).json({ error: "Service not found" });
      return;
    }
    res.json({ service: publicService(row) });
  } catch (err) {
    req.log.error({ err }, "Get service by slug error");
    res.status(500).json({ error: "Failed to get service" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid service ID" }); return; }

    const [service] = await db.select().from(services).where(eq(services.id, id)).limit(1);
    if (!service) { res.status(404).json({ error: "Service not found" }); return; }

    res.json({ service: publicService(service) });
  } catch (err) {
    req.log.error({ err }, "Get service error");
    res.status(500).json({ error: "Failed to get service" });
  }
});

export default router;
