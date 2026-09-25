import { Router } from "express";
import { db } from "@workspace/db";
import { orders, services, users } from "@workspace/db";
import { eq, desc, or } from "drizzle-orm";
import { authenticate, type AuthRequest } from "../middleware/authenticate";
import { submitMerchantOrder } from "../modules/merchant/order";
import { resolveIdentifierType } from "../modules/services/orderConfig";
import type { ServiceOrderField } from "@workspace/db";

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
    const { serviceId, serviceSlug, identifier, additionalInfo, quantity, orderUsername, orderEmail, formFields } = req.body as {
      serviceId?: number; serviceSlug?: string; identifier?: string; additionalInfo?: string;
      quantity?: number; orderUsername?: string; orderEmail?: string;
      formFields?: Record<string, unknown>;
    };
    if (!serviceId && !serviceSlug?.trim()) {
      res.status(400).json({ error: "Service slug is required" });
      return;
    }

    const normalizedSlug = serviceSlug?.trim().toLowerCase();
    const legacyServiceId = normalizedSlug ? /^service-(\d+)$/.exec(normalizedSlug)?.[1] : undefined;
    const [service] = normalizedSlug
      ? await db.select().from(services).where(
          legacyServiceId
            ? or(eq(services.slug, normalizedSlug), eq(services.id, Number(legacyServiceId)))
            : eq(services.slug, normalizedSlug),
        ).limit(1)
      : await db.select().from(services).where(eq(services.id, serviceId!)).limit(1);
    if (!service || !service.isActive) { res.status(404).json({ error: "Service not found or inactive" }); return; }

    const identType = resolveIdentifierType(service);
    const schema = (service.orderFields ?? []) as ServiceOrderField[];
    const submittedFields: Record<string, string> = {};
    if (formFields && typeof formFields === "object" && !Array.isArray(formFields)) {
      for (const [key, value] of Object.entries(formFields)) {
        if (value !== undefined && value !== null) submittedFields[key] = String(value).trim();
      }
    }

    for (const field of schema) {
      const value = submittedFields[field.name] ?? "";
      if (field.required && !value) {
        res.status(400).json({ error: `${field.label || field.name} is required` }); return;
      }
      if (!value) continue;
      if (field.min !== undefined && value.length < field.min) {
        res.status(400).json({ error: `${field.label || field.name} must be at least ${field.min} characters` }); return;
      }
      if (field.max !== undefined && value.length > field.max) {
        res.status(400).json({ error: `${field.label || field.name} must be at most ${field.max} characters` }); return;
      }
      if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        res.status(400).json({ error: `Please enter a valid ${field.label || field.name}` }); return;
      }
      if (/^(imei)$/i.test(field.name) && !/^\d{15}$/.test(value.replace(/\s/g, ""))) {
        res.status(400).json({ error: `${field.label || field.name} must be exactly 15 digits` }); return;
      }
    }

    const dynamicIdentifierField = schema.find((field) => /\b(imei|serial|sn|email|username)\b/i.test(`${field.name} ${field.label}`));
    const resolvedIdentifier = identifier?.trim() ||
      (dynamicIdentifierField ? submittedFields[dynamicIdentifierField.name] : undefined);
    if (identType !== "none" && !resolvedIdentifier) {
      res.status(400).json({ error: `${service.fieldLabel ?? "Identifier"} is required` }); return;
    }
    if (service.requireUsername && !orderUsername?.trim()) {
      res.status(400).json({ error: "Username is required" }); return;
    }
    if (service.requireEmail && !orderEmail?.trim()) {
      res.status(400).json({ error: "Email is required" }); return;
    }
    if (service.requireEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(orderEmail!.trim())) {
      res.status(400).json({ error: "Please enter a valid email address" }); return;
    }

    const [user] = await db.select().from(users).where(eq(users.id, req.userId!)).limit(1);
    const balance = parseFloat(user.balance ?? "0");
    const price = parseFloat(service.price);
    const quantityField = schema.find((field) => /^quantity$/i.test(field.name));
    const dynamicQuantity = quantityField ? Number(submittedFields[quantityField.name]) : undefined;
    const qty = service.requireQuantity
      ? Math.max(1, quantity ?? dynamicQuantity ?? 1)
      : Math.max(1, dynamicQuantity ?? 1);
    const totalPrice = price * qty;

    if (balance < totalPrice) { res.status(400).json({ error: "Insufficient balance. Please add funds first." }); return; }

    const newBalance = (balance - totalPrice).toFixed(2);
    await db.update(users).set({ balance: newBalance }).where(eq(users.id, req.userId!));

    const [order] = await db.insert(orders).values({
      userId: req.userId!, serviceId: service.id,
      identifier: resolvedIdentifier ?? "-",
      additionalInfo: additionalInfo ?? null,
      quantity: qty,
      orderUsername: orderUsername?.trim() ?? submittedFields["username"] ?? null,
      orderEmail: orderEmail?.trim() ?? submittedFields["email"] ?? submittedFields["Email"] ?? null,
      formFields: Object.keys(submittedFields).length > 0 ? submittedFields : null,
      status: "pending",
      price: totalPrice.toFixed(2),
      apiOrderId: null,
    }).returning();

    if (service.apiServiceId) {
      try {
        const result = await submitMerchantOrder({
          apiServiceId: service.apiServiceId,
          identifier: resolvedIdentifier ?? "-",
          additionalInfo: additionalInfo ?? null,
          merchantId: service.merchantId ?? null,
          quantity: qty,
          referenceId: String(order.id),
          fields: submittedFields,
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
