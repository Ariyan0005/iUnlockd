import { Router } from "express";
import bcrypt from "bcryptjs";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { db } from "@workspace/db";
import { users } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate, type AuthRequest } from "../middleware/authenticate";
import { createManualDeposit } from "../modules/payments/manual/manual";

const router = Router();

router.get("/profile", authenticate, async (req: AuthRequest, res) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, req.userId!)).limit(1);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      balance: user.balance,
      role: user.role,
      totpEnabled: user.totpEnabled,
      createdAt: user.createdAt,
    });
  } catch (err) {
    req.log.error({ err }, "Get profile error");
    res.status(500).json({ error: "Failed to get profile" });
  }
});

router.patch("/profile", authenticate, async (req: AuthRequest, res) => {
  try {
    const { name } = req.body as { name?: string };
    if (!name?.trim()) { res.status(400).json({ error: "Name is required" }); return; }

    await db.update(users).set({ name: name.trim() }).where(eq(users.id, req.userId!));
    const [user] = await db.select().from(users).where(eq(users.id, req.userId!)).limit(1);
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      balance: user.balance,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (err) {
    req.log.error({ err }, "Update profile error");
    res.status(500).json({ error: "Failed to update profile" });
  }
});

router.post("/change-password", authenticate, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: "Current and new password are required" });
      return;
    }
    if (newPassword.length < 8) {
      res.status(400).json({ error: "New password must be at least 8 characters" });
      return;
    }

    const [user] = await db.select().from(users).where(eq(users.id, req.userId!)).limit(1);
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      res.status(400).json({ error: "Current password is incorrect" });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ passwordHash }).where(eq(users.id, req.userId!));
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    req.log.error({ err }, "Change password error");
    res.status(500).json({ error: "Failed to change password" });
  }
});

router.post("/manual-deposit", authenticate, async (req: AuthRequest, res) => {
  try {
    const { amount } = req.body as { amount: number };
    const result = await createManualDeposit(req.userId!, amount);
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to create deposit record";
    req.log.error({ err }, "Manual deposit error");
    res.status(400).json({ error: msg });
  }
});

router.post("/2fa/setup", authenticate, async (req: AuthRequest, res) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, req.userId!)).limit(1);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    const secret = speakeasy.generateSecret({
      name: `iUnlockd (${user.email})`,
      length: 20,
    });
    await db.update(users).set({ totpSecret: secret.base32 }).where(eq(users.id, req.userId!));
    const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url!);
    res.json({ secret: secret.base32, qrDataUrl });
  } catch (err) {
    req.log.error({ err }, "2FA setup error");
    res.status(500).json({ error: "Failed to generate 2FA secret" });
  }
});

router.post("/2fa/enable", authenticate, async (req: AuthRequest, res) => {
  try {
    const { token } = req.body as { token: string };
    if (!token) { res.status(400).json({ error: "Token is required" }); return; }
    const [user] = await db.select().from(users).where(eq(users.id, req.userId!)).limit(1);
    if (!user?.totpSecret) { res.status(400).json({ error: "Run 2FA setup first" }); return; }
    const valid = speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: "base32",
      token,
      window: 2,
    });
    if (!valid) { res.status(400).json({ error: "Invalid code. Check your app and try again." }); return; }
    await db.update(users).set({ totpEnabled: true }).where(eq(users.id, req.userId!));
    res.json({ message: "2FA enabled successfully" });
  } catch (err) {
    req.log.error({ err }, "2FA enable error");
    res.status(500).json({ error: "Failed to enable 2FA" });
  }
});

router.post("/2fa/disable", authenticate, async (req: AuthRequest, res) => {
  try {
    const { token } = req.body as { token: string };
    if (!token) { res.status(400).json({ error: "Token is required" }); return; }
    const [user] = await db.select().from(users).where(eq(users.id, req.userId!)).limit(1);
    if (!user?.totpEnabled || !user.totpSecret) { res.status(400).json({ error: "2FA is not enabled" }); return; }
    const valid = speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: "base32",
      token,
      window: 2,
    });
    if (!valid) { res.status(400).json({ error: "Invalid code. Check your app and try again." }); return; }
    await db.update(users).set({ totpEnabled: false, totpSecret: null }).where(eq(users.id, req.userId!));
    res.json({ message: "2FA disabled successfully" });
  } catch (err) {
    req.log.error({ err }, "2FA disable error");
    res.status(500).json({ error: "Failed to disable 2FA" });
  }
});

export default router;
