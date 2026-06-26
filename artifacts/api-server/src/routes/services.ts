import { Router } from "express";
import { db } from "@workspace/db";
import { services, merchants } from "@workspace/db";
import { eq, and, or, isNull } from "drizzle-orm";

const router = Router();

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
        apiServiceId: services.apiServiceId,
        merchantId: services.merchantId,
        merchantActive: merchants.isActive,
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

    res.json(rows.map(s => ({
      id: s.id,
      name: s.name,
      category: s.category,
      serviceType: s.serviceType,
      description: s.description,
      processingTime: s.deliveryTime,
      price: s.price,
      isActive: s.isActive,
      apiServiceId: s.apiServiceId,
    })));
  } catch (err) {
    req.log.error({ err }, "Get services error");
    res.status(500).json({ error: "Failed to get services" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid service ID" }); return; }

    const [service] = await db.select().from(services).where(eq(services.id, id)).limit(1);
    if (!service) { res.status(404).json({ error: "Service not found" }); return; }

    res.json({
      service: {
        id: service.id,
        name: service.name,
        category: service.category,
        serviceType: service.serviceType,
        description: service.description,
        processingTime: service.deliveryTime,
        price: service.price,
        isActive: service.isActive,
        apiServiceId: service.apiServiceId,
      }
    });
  } catch (err) {
    req.log.error({ err }, "Get service error");
    res.status(500).json({ error: "Failed to get service" });
  }
});

export default router;
