import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { users, orders, services, cryptoDeposits, settings, merchants } from "@workspace/db";
import { eq, desc, sql, count, notInArray } from "drizzle-orm";
import { authenticate, requireAdmin, type AuthRequest } from "../middleware/authenticate";
import { syncMerchantProducts, buildMerchantHeaders } from "../modules/merchant/sync";
import { checkMerchantOrderStatus } from "../modules/merchant/order";

const router = Router();

router.post("/setup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }
    // Check if any admin already exists
    const [existingAdmin] = await db.select().from(users).where(eq(users.role, "admin")).limit(1);
    if (existingAdmin) {
      return res.status(400).json({ error: "Admin already setup. Endpoint locked." });
    }
    const hash = await bcrypt.hash(password, 10);
    const [newAdmin] = await db.insert(users).values({
      name,
      email,
      passwordHash: hash,
      role: "admin",
      balance: "0.00",
      isEmailVerified: true
    }).returning();
    res.status(201).json({ success: true, message: "Admin created successfully", adminId: newAdmin.id });
  } catch (err) {
    res.status(500).json({ error: "Failed to setup admin: " + String(err) });
  }
});

router.get("/stats", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const [totalUsers] = await db.select({ count: count() }).from(users);
    const [totalOrders] = await db.select({ count: count() }).from(orders);
    const [completedOrders] = await db.select({ count: count() }).from(orders).where(eq(orders.status, "completed"));
    const [pendingDeposits] = await db.select({ count: count() }).from(cryptoDeposits).where(eq(cryptoDeposits.status, "pending"));
    const revenue = await db.select({ total: sql<string>`coalesce(sum(price::numeric), 0)` }).from(orders).where(eq(orders.status, "completed"));
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [todayOrders] = await db.select({ count: count() }).from(orders).where(sql`created_at >= ${today}`);

    res.json({
      totalUsers: totalUsers.count,
      totalOrders: totalOrders.count,
      completedOrders: completedOrders.count,
      pendingDeposits: pendingDeposits.count,
      totalRevenue: revenue[0]?.total ?? "0",
      todayOrders: todayOrders.count,
    });
  } catch (err) {
    req.log.error({ err }, "Admin stats error");
    res.status(500).json({ error: "Failed to get stats" });
  }
});

router.get("/users", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const all = await db.select({
      id: users.id, name: users.name, email: users.email, balance: users.balance,
      role: users.role, isEmailVerified: users.isEmailVerified, createdAt: users.createdAt,
    }).from(users).orderBy(desc(users.createdAt));
    res.json(all);
  } catch (err) {
    req.log.error({ err }, "Admin get users error");
    res.status(500).json({ error: "Failed to get users" });
  }
});

router.patch("/users/:id/balance", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params["id"]);
    const { balance } = req.body as { balance: string };
    await db.update(users).set({ balance }).where(eq(users.id, id));
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    res.json(user);
  } catch (err) {
    req.log.error({ err }, "Admin update balance error");
    res.status(500).json({ error: "Failed to update balance" });
  }
});

router.post("/users/:id/adjust", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params["id"]);
    const { type, amount, note } = req.body as { type: "add" | "deduct"; amount: string; note?: string };
    if (!["add", "deduct"].includes(type)) {
      res.status(400).json({ error: "type must be 'add' or 'deduct'" });
      return;
    }
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
      res.status(400).json({ error: "Amount must be a positive number" });
      return;
    }
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    const current = parseFloat(user.balance ?? "0");
    const newBalance = type === "add" ? (current + value).toFixed(2) : Math.max(0, current - value).toFixed(2);
    await db.update(users).set({ balance: newBalance }).where(eq(users.id, id));
    const [updated] = await db.select({
      id: users.id, name: users.name, email: users.email, balance: users.balance,
      role: users.role, isEmailVerified: users.isEmailVerified, createdAt: users.createdAt,
    }).from(users).where(eq(users.id, id)).limit(1);
    req.log.info({ userId: id, type, amount, note, newBalance }, "Admin adjusted balance");
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Admin adjust balance error");
    res.status(500).json({ error: "Failed to adjust balance" });
  }
});

router.delete("/users/:id", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params["id"]);
    const adminId = (req as AuthRequest).userId;
    if (id === adminId) {
      res.status(400).json({ error: "You cannot delete your own account" });
      return;
    }
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    if (user.role === "admin") {
      res.status(400).json({ error: "Cannot delete admin accounts" });
      return;
    }
    await db.delete(users).where(eq(users.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Admin delete user error");
    res.status(500).json({ error: "Failed to delete user" });
  }
});

router.get("/orders", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const limit = Math.min(Number(req.query["limit"] ?? 300), 500);
    const rows = await db.select({
      id: orders.id, userId: orders.userId,
      userName: users.name, userEmail: users.email,
      serviceName: services.name,
      serviceType: services.serviceType,
      identifier: orders.identifier,
      status: orders.status, price: orders.price,
      result: orders.result, apiOrderId: orders.apiOrderId,
      createdAt: orders.createdAt,
    }).from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .leftJoin(services, eq(orders.serviceId, services.id))
      .orderBy(desc(orders.createdAt))
      .limit(limit);
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Admin get orders error");
    res.status(500).json({ error: "Failed to get orders" });
  }
});

router.patch("/orders/:id", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params["id"]);
    const { status, result } = req.body as { status?: string; result?: string };

    // Fetch existing order before update
    const [existing] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!existing) { res.status(404).json({ error: "Order not found" }); return; }

    const update: Record<string, unknown> = {};
    if (status) update["status"] = status;
    if (result !== undefined) update["result"] = result;

    await db.update(orders).set(update).where(eq(orders.id, id));

    // Auto-refund balance when cancelling/rejecting a non-already-cancelled order
    const REFUND_STATUSES = ["cancelled", "rejected", "canceled", "failed"];
    const WAS_REFUNDABLE = !REFUND_STATUSES.includes(existing.status ?? "");
    if (status && REFUND_STATUSES.includes(status) && WAS_REFUNDABLE) {
      const orderPrice = parseFloat(existing.price ?? "0");
      if (orderPrice > 0) {
        const [user] = await db.select().from(users).where(eq(users.id, existing.userId)).limit(1);
        if (user) {
          const newBalance = (parseFloat(user.balance ?? "0") + orderPrice).toFixed(2);
          await db.update(users).set({ balance: newBalance }).where(eq(users.id, existing.userId));
          req.log.info({ orderId: id, userId: existing.userId, refunded: orderPrice, newBalance }, "Order cancelled — balance refunded");
        }
      }
    }

    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    res.json(order);
  } catch (err) {
    req.log.error({ err }, "Admin update order error");
    res.status(500).json({ error: "Failed to update order" });
  }
});

router.get("/deposits", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const limit = Math.min(Number(req.query["limit"] ?? 300), 500);
    const rows = await db.select({
      id: cryptoDeposits.id, userId: cryptoDeposits.userId,
      userName: users.name, userEmail: users.email,
      amount: cryptoDeposits.amount, network: cryptoDeposits.network,
      method: cryptoDeposits.method, txHash: cryptoDeposits.txHash,
      status: cryptoDeposits.status, createdAt: cryptoDeposits.createdAt,
    }).from(cryptoDeposits)
      .leftJoin(users, eq(cryptoDeposits.userId, users.id))
      .orderBy(desc(cryptoDeposits.createdAt))
      .limit(limit);
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Admin get deposits error");
    res.status(500).json({ error: "Failed to get deposits" });
  }
});

router.patch("/deposits/:id", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params["id"]);
    const { status } = req.body as { status: "approved" | "rejected" };
    if (!["approved", "rejected"].includes(status)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }

    const [deposit] = await db.select().from(cryptoDeposits).where(eq(cryptoDeposits.id, id)).limit(1);
    if (!deposit) { res.status(404).json({ error: "Deposit not found" }); return; }

    const newStatus = status === "approved" ? "completed" : "rejected";
    await db.update(cryptoDeposits).set({ status: newStatus }).where(eq(cryptoDeposits.id, id));

    if (status === "approved") {
      const [user] = await db.select().from(users).where(eq(users.id, deposit.userId)).limit(1);
      const newBalance = (parseFloat(user.balance ?? "0") + parseFloat(deposit.amount)).toFixed(2);
      await db.update(users).set({ balance: newBalance }).where(eq(users.id, deposit.userId));
    }

    const [updated] = await db.select().from(cryptoDeposits).where(eq(cryptoDeposits.id, id)).limit(1);
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Admin update deposit error");
    res.status(500).json({ error: "Failed to update deposit" });
  }
});

router.get("/services", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const all = await db.select().from(services).orderBy(desc(services.createdAt));
    res.json(all);
  } catch (err) {
    req.log.error({ err }, "Admin get services error");
    res.status(500).json({ error: "Failed to get services" });
  }
});

router.post("/services", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { name, category, price, description, deliveryTime, serviceType, merchantId } = req.body as {
      name: string; category: string; price: string;
      description?: string; deliveryTime?: string; serviceType?: string; merchantId?: number;
    };
    if (!name || !category || !price) {
      res.status(400).json({ error: "Name, category and price are required" });
      return;
    }
    const [service] = await db.insert(services).values({
      name, category,
      serviceType: serviceType ?? category,
      price, description: description ?? null,
      deliveryTime: deliveryTime ?? null,
      merchantId: merchantId ?? null,
    }).returning();
    res.status(201).json(service);
  } catch (err) {
    req.log.error({ err }, "Admin create service error");
    res.status(500).json({ error: "Failed to create service" });
  }
});

router.patch("/services/:id", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params["id"]);
    const { name, category, price, description, deliveryTime, isActive, serviceType, merchantId } = req.body as {
      name?: string; category?: string; price?: string; description?: string;
      deliveryTime?: string; isActive?: boolean; serviceType?: string; merchantId?: number | null;
    };
    const update: Record<string, unknown> = {};
    if (name !== undefined) update["name"] = name;
    if (category !== undefined) update["category"] = category;
    if (serviceType !== undefined) update["serviceType"] = serviceType;
    if (price !== undefined) update["price"] = price;
    if (description !== undefined) update["description"] = description;
    if (deliveryTime !== undefined) update["deliveryTime"] = deliveryTime;
    if (isActive !== undefined) update["isActive"] = isActive;
    if (merchantId !== undefined) update["merchantId"] = merchantId;

    await db.update(services).set(update).where(eq(services.id, id));
    const [service] = await db.select().from(services).where(eq(services.id, id)).limit(1);
    res.json(service);
  } catch (err) {
    req.log.error({ err }, "Admin update service error");
    res.status(500).json({ error: "Failed to update service" });
  }
});

// DELETE all services at once (bulk reset)
router.delete("/services", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const usedRows = await db.selectDistinct({ id: orders.serviceId }).from(orders);
    const usedIds = usedRows.map(r => r.id).filter((id): id is number => id !== null);
    if (usedIds.length === 0) {
      await db.delete(services);
    } else {
      await db.delete(services).where(notInArray(services.id, usedIds));
    }
    req.log.info("Admin deleted services (skipped " + usedIds.length + " with orders)");
    res.json({ success: true, message: usedIds.length > 0 ? `Deleted all services except ${usedIds.length} that have orders` : "All services deleted" });
  } catch (err) {
    req.log.error({ err }, "Admin bulk delete services error");
    res.status(500).json({ error: "Failed to delete all services" });
  }
});

router.delete("/services/:id", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params["id"]);
    const [orderCount] = await db.select({ count: count() }).from(orders).where(eq(orders.serviceId, id));
    if (orderCount.count > 0) {
      res.status(409).json({ error: `Cannot delete: this service has ${orderCount.count} order(s). Complete or cancel them first.` });
      return;
    }
    await db.delete(services).where(eq(services.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Admin delete service error");
    res.status(500).json({ error: "Failed to delete service" });
  }
});

router.get("/settings", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const rows = await db.select().from(settings);
    const result: Record<string, string> = {};
    for (const row of rows) {
      result[row.key] = row.value ?? "";
    }
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Get settings error");
    res.status(500).json({ error: "Failed to get settings" });
  }
});

router.patch("/settings/:key", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const key = req.params["key"] as string;
    const { value } = req.body as { value: string };
    await db.insert(settings).values({ key, value: String(value) })
      .onConflictDoUpdate({ target: settings.key, set: { value: String(value), updatedAt: new Date() } });
    req.log.info({ key, value }, "Admin updated setting");
    res.json({ key, value });
  } catch (err) {
    req.log.error({ err }, "Update setting error");
    res.status(500).json({ error: "Failed to update setting" });
  }
});

router.post("/change-password", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "Current password and new password (min 6 chars) are required" });
    }
    const adminId = req.userId!;
    const [admin] = await db.select().from(users).where(eq(users.id, adminId)).limit(1);
    if (!admin) return res.status(404).json({ error: "Admin not found" });
    const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!valid) return res.status(400).json({ error: "Current password is incorrect" });
    const hash = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ passwordHash: hash }).where(eq(users.id, adminId));
    req.log.info({ adminId }, "Admin password changed");
    return res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Change password error");
    return res.status(500).json({ error: "Failed to change password" });
  }
});

// ─── Merchant Management ──────────────────────────────────────────────────────

// GET all merchants
router.get("/merchants", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const all = await db.select({
      id: merchants.id,
      name: merchants.name,
      apiEndpoint: merchants.apiEndpoint,
      apiUser: merchants.apiUser,
      apiFormat: merchants.apiFormat,
      description: merchants.description,
      isActive: merchants.isActive,
      createdAt: merchants.createdAt,
      updatedAt: merchants.updatedAt,
      // NOTE: apiKey is intentionally omitted from list response for security
    }).from(merchants).orderBy(desc(merchants.createdAt));
    res.json(all);
  } catch (err) {
    req.log.error({ err }, "Admin get merchants error");
    res.status(500).json({ error: "Failed to get merchants" });
  }
});

// POST create new merchant
router.post("/merchants", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { name, apiEndpoint, apiKey, apiUser, apiFormat, description } = req.body as {
      name: string; apiEndpoint: string; apiKey: string;
      apiUser?: string; apiFormat?: string; description?: string;
    };
    if (!name || !apiEndpoint || !apiKey) {
      res.status(400).json({ error: "name, apiEndpoint, and apiKey are required" });
      return;
    }
    const [merchant] = await db.insert(merchants).values({
      name,
      apiEndpoint: apiEndpoint.trim().replace(/\/$/, ""),
      apiKey: apiKey.trim(),
      apiUser: apiUser?.trim() || null,
      apiFormat: ["form", "dhru"].includes(apiFormat ?? "") ? (apiFormat ?? "rest") : "rest",
      description: description || null,
      isActive: true,
    }).returning();
    req.log.info({ merchantId: merchant.id, name }, "Admin created merchant");
    res.status(201).json({ ...merchant, apiKey: undefined });
  } catch (err) {
    req.log.error({ err }, "Admin create merchant error");
    res.status(500).json({ error: "Failed to create merchant" });
  }
});

// PATCH update merchant (including active/inactive toggle)
router.patch("/merchants/:id", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params["id"]);
    const { name, apiEndpoint, apiKey, apiUser, apiFormat, description, isActive } = req.body as {
      name?: string; apiEndpoint?: string; apiKey?: string;
      apiUser?: string; apiFormat?: string; description?: string; isActive?: boolean;
    };
    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) update["name"] = name;
    if (apiEndpoint !== undefined) update["apiEndpoint"] = apiEndpoint.trim().replace(/\/$/, "");
    if (apiKey !== undefined) update["apiKey"] = apiKey.trim();
    if (apiUser !== undefined) update["apiUser"] = apiUser.trim() || null;
    if (apiFormat !== undefined) update["apiFormat"] = ["form", "dhru"].includes(apiFormat) ? apiFormat : "rest";
    if (description !== undefined) update["description"] = description || null;
    if (isActive !== undefined) update["isActive"] = isActive;

    await db.update(merchants).set(update).where(eq(merchants.id, id));
    const [merchant] = await db.select({
      id: merchants.id, name: merchants.name, apiEndpoint: merchants.apiEndpoint,
      apiUser: merchants.apiUser, apiFormat: merchants.apiFormat, description: merchants.description,
      isActive: merchants.isActive, createdAt: merchants.createdAt, updatedAt: merchants.updatedAt,
    }).from(merchants).where(eq(merchants.id, id)).limit(1);

    if (!merchant) { res.status(404).json({ error: "Merchant not found" }); return; }
    req.log.info({ merchantId: id, isActive: merchant.isActive }, "Admin updated merchant");
    res.json(merchant);
  } catch (err) {
    req.log.error({ err }, "Admin update merchant error");
    res.status(500).json({ error: "Failed to update merchant" });
  }
});

// POST test merchant API connection
router.post("/merchants/:id/test", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params["id"]);
    const [merchant] = await db.select().from(merchants).where(eq(merchants.id, id)).limit(1);
    if (!merchant) { res.status(404).json({ error: "Merchant not found" }); return; }

    const base = merchant.apiEndpoint.replace(/\/$/, "");
    const apiFormat = merchant.apiFormat ?? "rest";

    let httpStatus = 0;
    let serviceCount = 0;
    let ok = false;
    let errorMsg = "";
    let testedEndpoint = apiFormat === "form" ? base : apiFormat === "dhru" ? `${base}/api/reseller/v1/products` : `${base}/services`;

    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 10000);
      let testRes: Response;
      try {
        if (apiFormat === "dhru") {
          testedEndpoint = `${base}/api/reseller/v1/products`;
          testRes = await fetch(testedEndpoint, {
            method: "GET",
            headers: { "Authorization": `Bearer ${merchant.apiKey}`, "Accept": "application/json", "User-Agent": "Mozilla/5.0" },
            signal: ctrl.signal,
          });
        } else if (apiFormat === "form") {
          const params = new URLSearchParams({ key: merchant.apiKey, action: "services" });
          if (merchant.apiUser?.trim()) params.set("username", merchant.apiUser.trim());
          testRes = await fetch(base, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json", "User-Agent": "Mozilla/5.0" },
            body: params.toString(),
            signal: ctrl.signal,
          });
        } else {
          const headers = apiFormat === "dhru"
            ? { "Authorization": `Bearer ${merchant.apiKey}`, "Accept": "application/json" }
            : buildMerchantHeaders(merchant.apiKey, merchant.apiUser);
          testRes = await fetch(`${base}/services`, { headers, signal: ctrl.signal });
        }
      } finally {
        clearTimeout(timer);
      }
      httpStatus = testRes.status;
      const responseBody = await testRes.text().catch(() => "");

      if (testRes.ok) {
        try {
          const parsed = JSON.parse(responseBody) as unknown;
          const p = parsed as Record<string, unknown>;
          // GSM Africa: {data: {products: {uuid: {...}}}}
          const dataObj = p["data"] as Record<string, unknown> | undefined;
          if (dataObj && dataObj["products"] && typeof dataObj["products"] === "object" && !Array.isArray(dataObj["products"])) {
            serviceCount = Object.keys(dataObj["products"] as object).length;
          } else {
            const list = Array.isArray(parsed) ? parsed
              : (p["services"] ?? p["products"] ?? p["data"] ?? []);
            serviceCount = Array.isArray(list) ? list.length : 0;
          }
          ok = true;
        } catch {
          if (responseBody.includes('<html') || responseBody.includes('cloudflare') || responseBody.includes('gorizontal')) {
            ok = false;
            errorMsg = 'Cloudflare challenge blocked — IP not whitelisted at Cloudflare level (HTTP ' + String(httpStatus) + ')';
          } else {
            ok = true;
            serviceCount = 0;
          }
        }
      } else {
        errorMsg = `HTTP ${httpStatus}: ${responseBody.slice(0, 200)}`;
      }
    } catch (fetchErr) {
      errorMsg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
      if (errorMsg.includes("ENOTFOUND") || errorMsg.includes("ECONNREFUSED")) {
        errorMsg = `Cannot reach ${base} — check URL`;
      } else if (errorMsg.includes("TimeoutError") || errorMsg.includes("abort")) {
        errorMsg = "Connection timed out after 10s — check URL";
      }
    }

    const authMode = apiFormat === "dhru" ? `Dhru Fusion (POST action=product, user: ${merchant.apiUser})` : apiFormat === "form"
      ? "Form/SMM Panel (POST + key in body)"
      : merchant.apiUser ? `Basic Auth (user: ${merchant.apiUser})` : "Bearer Token";
    req.log.info({ merchantId: id, ok, httpStatus, serviceCount, apiFormat }, "Merchant connection test");

    res.json({
      ok,
      merchantId: id,
      name: merchant.name,
      endpoint: testedEndpoint,
      authMode,
      apiFormat,
      httpStatus: httpStatus || undefined,
      serviceCount: ok ? serviceCount : undefined,
      error: errorMsg || undefined,
      message: ok
        ? `✓ Connected! Found ${serviceCount} services. Format: ${apiFormat}`
        : `✗ Failed: ${errorMsg}`,
    });
  } catch (err) {
    req.log.error({ err }, "Merchant test error");
    res.status(500).json({ error: "Test failed: " + String(err instanceof Error ? err.message : err) });
  }
});

// POST toggle merchant active/inactive (one-click convenience endpoint)
router.post("/merchants/:id/toggle", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params["id"]);
    const [current] = await db.select({ isActive: merchants.isActive })
      .from(merchants).where(eq(merchants.id, id)).limit(1);
    if (!current) { res.status(404).json({ error: "Merchant not found" }); return; }

    const newIsActive = !current.isActive;
    await db.update(merchants).set({ isActive: newIsActive, updatedAt: new Date() }).where(eq(merchants.id, id));
    const [merchant] = await db.select({
      id: merchants.id, name: merchants.name, apiEndpoint: merchants.apiEndpoint,
      apiUser: merchants.apiUser, description: merchants.description,
      isActive: merchants.isActive, createdAt: merchants.createdAt, updatedAt: merchants.updatedAt,
    }).from(merchants).where(eq(merchants.id, id)).limit(1);

    req.log.info({ merchantId: id, isActive: newIsActive }, "Admin toggled merchant");
    res.json({ ...merchant, toggled: true });
  } catch (err) {
    req.log.error({ err }, "Admin toggle merchant error");
    res.status(500).json({ error: "Failed to toggle merchant" });
  }
});

// DELETE remove merchant
router.delete("/merchants/:id", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params["id"]);
    await db.delete(merchants).where(eq(merchants.id, id));
    req.log.info({ merchantId: id }, "Admin deleted merchant");
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Admin delete merchant error");
    res.status(500).json({ error: "Failed to delete merchant" });
  }
});

// POST sync products from one or all active merchants
router.post("/services/sync", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { merchantId } = req.body as { merchantId?: number };
    const result = await syncMerchantProducts(merchantId);
    if (result.skipped) {
      return res.status(400).json({
        error: "No active merchants configured. Add a merchant first from Admin → Merchants.",
      });
    }
    req.log.info({ synced: result.synced, total: result.total }, "Admin triggered merchant sync");
    return res.json({
      message: `Synced ${result.synced} of ${result.total} services`,
      synced: result.synced,
      total: result.total,
      details: result.details,
    });
  } catch (err) {
    req.log.error({ err }, "Admin services sync error");
    return res.status(500).json({ error: String(err instanceof Error ? err.message : err) });
  }
});



// GET all orders (admin)
router.get("/orders", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const limit = Number(req.query["limit"] ?? 200);
    const rows = await db.select({
      id: orders.id,
      userId: orders.userId,
      serviceId: orders.serviceId,
      serviceName: services.name,
      serviceType: services.serviceType,
      identifier: orders.identifier,
      quantity: orders.quantity,
      status: orders.status,
      price: orders.price,
      result: orders.result,
      apiOrderId: orders.apiOrderId,
      createdAt: orders.createdAt,
      userEmail: users.email,
      userName: users.name,
    })
    .from(orders)
    .leftJoin(services, eq(orders.serviceId, services.id))
    .leftJoin(users, eq(orders.userId, users.id))
    .orderBy(desc(orders.createdAt))
    .limit(limit);
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Admin get orders error");
    res.status(500).json({ error: "Failed to get orders" });
  }
});


// POST check order status from merchant API
router.post("/orders/:id/check-status", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params["id"]);
    const [order] = await db.select({
      id: orders.id, apiOrderId: orders.apiOrderId, status: orders.status,
      merchantId: services.merchantId, serviceId: orders.serviceId,
    })
    .from(orders)
    .leftJoin(services, eq(orders.serviceId, services.id))
    .where(eq(orders.id, id))
    .limit(1);

    if (!order) { res.status(404).json({ error: "Order not found" }); return; }
    if (!order.apiOrderId) { res.status(400).json({ error: "No API order ID — not forwarded to merchant" }); return; }

    const statusResult = await checkMerchantOrderStatus({
      apiOrderId: order.apiOrderId,
      merchantId: order.merchantId ?? null,
    });

    // Auto update status in DB
    const mappedStatus = statusResult.status === "completed" || statusResult.status === "complete"
      ? "completed"
      : statusResult.status === "cancelled" || statusResult.status === "canceled" || statusResult.status === "refunded"
        ? "cancelled"
        : statusResult.status === "processing" || statusResult.status === "in progress"
          ? "processing"
          : order.status;

    if (mappedStatus !== order.status) {
      await db.update(orders).set({ status: mappedStatus }).where(eq(orders.id, id));
    }

    res.json({ ...statusResult, dbStatus: mappedStatus });
  } catch (err) {
    req.log.error({ err }, "Admin check order status error");
    res.status(500).json({ error: String(err instanceof Error ? err.message : err) });
  }
});

// POST refund order — refund balance to user
router.post("/orders/:id/refund", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params["id"]);
    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!order) { res.status(404).json({ error: "Order not found" }); return; }
    if (order.status === "refunded") { res.status(400).json({ error: "Order already refunded" }); return; }

    const refundAmount = parseFloat(order.price ?? "0");
    if (refundAmount <= 0) { res.status(400).json({ error: "No refund amount" }); return; }

    // Add balance back to user
    const [user] = await db.select().from(users).where(eq(users.id, order.userId)).limit(1);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    const newBalance = (parseFloat(user.balance ?? "0") + refundAmount).toFixed(2);
    await db.update(users).set({ balance: newBalance }).where(eq(users.id, order.userId));
    await db.update(orders).set({ status: "refunded", result: "Refunded by admin" }).where(eq(orders.id, id));

    req.log.info({ orderId: id, refundAmount, userId: order.userId }, "Order refunded by admin");
    res.json({ success: true, refunded: refundAmount, newBalance });
  } catch (err) {
    req.log.error({ err }, "Admin refund order error");
    res.status(500).json({ error: "Failed to refund order" });
  }
});

export default router;
