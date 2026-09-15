import { Router } from "express";
import { db } from "@workspace/db";
import { orders, services, users } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { authenticate, type AuthRequest } from "../middleware/authenticate";
import { submitMerchantOrder } from "../modules/merchant/order";

const router = Router();

router.get("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const limit = Number(req.query["limit"] ?? 200);
    const type = req.query["type"] as string | undefined;
    const rows = await db.select({
        id: orders.id, serviceId: orders.serviceId,
        serviceName: services.name, serviceType: services.serviceType,
        identifier: orders.identifier, additionalInfo: orders.additionalInfo,
        quantity: orders.quantity, orderUsername: orders.orderUsername, orderEmail: orders.orderEmail,
        status: orders.status, price: orders.price, result: orders.result,
        apiOrderId: orders.apiOrderId, createdAt: orders.createdAt,
      })
      .from(orders)
      .leftJoin(services, eq(orders.serviceId, services.id))
      .where(eq(orders.userId, req.userId!))
      .orderBy(desc(orders.createdAt))
      .limit(limit);
    res.json(type ? rows.filter((r) => r.serviceType === type) : rows);
  } catch (err) {
    req.log.error({ err }, "Get orders error");
    res.status(500).json({ error: "Failed to get orders" });
  }
});

router.post("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const { serviceId, identifier, additionalInfo, quantity, orderUsername, orderEmail } = req.body as {
      serviceId: number; identifier?: string; additionalInfo?: string;
      quantity?: number; orderUsername?: string; orderEmail?: string;
    };
    if (!serviceId) { res.status(400).json({ error: "Service ID is required" }); return; }

    const [service] = await db.select().from(services).where(eq(services.id, serviceId)).limit(1);
    if (!service || !service.isActive) { res.status(404).json({ error: "Service not found or inactive" }); return; }

    const identType = service.identifierType ?? "imei";
    if (identType !== "none" && !identifier?.trim()) {
      res.status(400).json({ error: `${service.fieldLabel ?? "Identifier"} is required` }); return;
    }

    const [user] = await db.select().from(users).where(eq(users.id, req.userId!)).limit(1);
    const balance = parseFloat(user.balance ?? "0");
    const price = parseFloat(service.price);
    const qty = Math.max(1, quantity ?? 1);
    const totalPrice = price * qty;

    if (balance < totalPrice) { res.status(400).json({ error: "Insufficient balance. Please add funds first." }); return; }

    const newBalance = (balance - totalPrice).toFixed(2);
    await db.update(users).set({ balance: newBalance }).where(eq(users.id, req.userId!));

    const [order] = await db.insert(orders).values({
      userId: req.userId!, serviceId,
      identifier: identifier?.trim() ?? "-",
      additionalInfo: additionalInfo ?? null,
      quantity: qty,
      orderUsername: orderUsername?.trim() ?? null,
      orderEmail: orderEmail?.trim() ?? null,
      status: "pending",
      price: totalPrice.toFixed(2),
      apiOrderId: null,
    }).returning();

    if (service.apiServiceId) {
      try {
        const result = await submitMerchantOrder({
          apiServiceId: service.apiServiceId,
          identifier: identifier?.trim() ?? "-",
          additionalInfo: additionalInfo ?? null,
          merchantId: service.merchantId ?? null,
        });
        if (!result.skipped && result.apiOrderId) {
          await db.update(orders).set({ apiOrderId: result.apiOrderId }).where(eq(orders.id, order.id));
          order.apiOrderId = result.apiOrderId;
        }
      } catch (merchantErr) {
        req.log.warn({ err: merchantErr }, "Merchant order forwarding failed");
      }
    }
    res.status(201).json({ order });
  } catch (err) {
    req.log.error({ err }, "Create order error");
    res.status(500).json({ error: "Failed to create order" });
  }
});

export default router;
