import { Router } from "express";
import bcrypt from "bcryptjs";
import speakeasy from "speakeasy";
import { db } from "@workspace/db";
import { users, emailTokens, pendingRegistrations } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import { signToken } from "../lib/auth";
import { sendVerificationEmail, sendPasswordResetEmail } from "../modules/email/email";

const router = Router();

async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = process.env['TURNSTILE_SECRET_KEY'] ?? '';
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token }),
    });
    const data = await res.json() as { success: boolean };
    return data.success === true;
  } catch { return false; }
}


function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

router.get("/check-email", async (req, res) => {
  try {
    const email = req.query["email"] as string;
    if (!email) { res.json({ available: false }); return; }
    const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    const now = new Date();
    const pending = await db.select().from(pendingRegistrations)
      .where(and(eq(pendingRegistrations.email, email.toLowerCase()), gt(pendingRegistrations.expiresAt, now)))
      .limit(1);
    res.json({ available: existing.length === 0 && pending.length === 0 });
  } catch (err) {
    res.status(500).json({ available: false });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, country, mobile } = req.body as {
      name: string; email: string; password: string; country?: string; mobile?: string;
    };

    const { turnstileToken: regToken } = req.body;
    if (process.env['TURNSTILE_SECRET_KEY'] && regToken) {
      const valid = await verifyTurnstile(regToken);
      if (!valid) { res.status(400).json({ error: 'Security check failed. Please try again.' }); return; }
    }
    if (!name || !email || !password) {
      res.status(400).json({ error: "Name, email and password are required" });
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      res.status(400).json({ error: "Invalid email address" });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }

    const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.delete(pendingRegistrations).where(eq(pendingRegistrations.email, email.toLowerCase()));
    await db.insert(pendingRegistrations).values({
      email: email.toLowerCase(),
      name,
      passwordHash,
      country: country ?? null,
      mobile: mobile ?? null,
      otp,
      expiresAt,
    });

    const emailSent = await sendVerificationEmail(email, name, otp);
    if (!emailSent) {
      req.log.warn({ otp }, "Email not sent — SMTP may not be configured");
    }

    res.status(201).json({
      message: "Registration successful. Please check your email for the verification code.",
    });
  } catch (err) {
    req.log.error({ err }, "Register error");
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    if (!user.isEmailVerified) {
      res.status(403).json({ error: "Please verify your email before logging in" });
      return;
    }
    if (user.totpEnabled && user.totpSecret) {
      const { totpToken } = req.body as { email: string; password: string; totpToken?: string };
      if (!totpToken) {
        res.json({ requireTotp: true });
        return;
      }
      const totpValid = speakeasy.totp.verify({
        secret: user.totpSecret,
        encoding: "base32",
        token: totpToken,
        window: 2,
      });
      if (!totpValid) {
        res.status(401).json({ error: "Invalid authenticator code. Try again." });
        return;
      }
    }
    const token = signToken({ userId: user.id, role: user.role });
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        balance: user.balance,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Login error");
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/verify-email", async (req, res) => {
  try {
    const { email, token } = req.body as { email: string; token: string };
    if (!email || !token) {
      res.status(400).json({ error: "Email and token are required" });
      return;
    }

    const now = new Date();

    const [pending] = await db.select().from(pendingRegistrations)
      .where(and(
        eq(pendingRegistrations.email, email.toLowerCase()),
        eq(pendingRegistrations.otp, token),
        gt(pendingRegistrations.expiresAt, now)
      ))
      .limit(1);

    if (pending) {
      const [user] = await db.insert(users).values({
        name: pending.name,
        email: pending.email,
        passwordHash: pending.passwordHash,
        country: pending.country,
        mobile: pending.mobile,
        isEmailVerified: true,
      }).returning();

      await db.delete(pendingRegistrations).where(eq(pendingRegistrations.email, email.toLowerCase()));

      const jwtToken = signToken({ userId: user.id, role: user.role });
      res.json({
        token: jwtToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          balance: user.balance,
          role: user.role,
          createdAt: user.createdAt,
        },
      });
      return;
    }

    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (!user) {
      res.status(400).json({ error: "Invalid or expired verification code" });
      return;
    }

    const [record] = await db.select().from(emailTokens)
      .where(and(eq(emailTokens.userId, user.id), eq(emailTokens.token, token), gt(emailTokens.expiresAt, now)))
      .limit(1);

    if (!record) {
      res.status(400).json({ error: "Invalid or expired verification code" });
      return;
    }

    await db.update(users).set({ isEmailVerified: true }).where(eq(users.id, user.id));
    await db.delete(emailTokens).where(eq(emailTokens.userId, user.id));

    const jwtToken = signToken({ userId: user.id, role: user.role });
    res.json({
      token: jwtToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        balance: user.balance,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Verify email error");
    res.status(500).json({ error: "Verification failed" });
  }
});

router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body as { email: string };
    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    const [pending] = await db.select().from(pendingRegistrations)
      .where(eq(pendingRegistrations.email, email.toLowerCase()))
      .limit(1);

    if (pending) {
      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await db.update(pendingRegistrations)
        .set({ otp, expiresAt })
        .where(eq(pendingRegistrations.email, email.toLowerCase()));
      const emailSent = await sendVerificationEmail(email, pending.name, otp);
      if (!emailSent) {
        req.log.warn({ otp }, "Resend email not sent — SMTP may not be configured");
      }
      res.json({ message: "Verification code sent." });
      return;
    }

    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (!user) {
      res.json({ message: "If this email is registered, a code has been sent." });
      return;
    }
    if (user.isEmailVerified) {
      res.status(400).json({ error: "Email already verified" });
      return;
    }

    await db.delete(emailTokens).where(eq(emailTokens.userId, user.id));
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await db.insert(emailTokens).values({ userId: user.id, token: otp, expiresAt });
    const emailSent = await sendVerificationEmail(email, user.name, otp);
    if (!emailSent) {
      req.log.warn({ userId: user.id, otp }, "Resend email not sent — SMTP may not be configured");
    }
    res.json({ message: "Verification code sent." });
  } catch (err) {
    req.log.error({ err }, "Resend verification error");
    res.status(500).json({ error: "Failed to resend code" });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body as { email: string };
    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (!user) {
      res.json({ message: "If this email is registered, a reset code has been sent." });
      return;
    }
    await db.delete(emailTokens).where(eq(emailTokens.userId, user.id));
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await db.insert(emailTokens).values({ userId: user.id, token: otp, expiresAt });
    await sendPasswordResetEmail(email, user.name, otp);
    res.json({ message: "If this email is registered, a reset code has been sent." });
  } catch (err) {
    req.log.error({ err }, "Forgot password error");
    res.status(500).json({ error: "Failed to send reset code" });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { email, token, newPassword } = req.body as { email: string; token: string; newPassword: string };
    if (!email || !token || !newPassword) {
      res.status(400).json({ error: "Email, token and new password are required" });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (!user) {
      res.status(400).json({ error: "Invalid or expired reset code" });
      return;
    }
    const now = new Date();
    const [record] = await db.select().from(emailTokens)
      .where(and(eq(emailTokens.userId, user.id), eq(emailTokens.token, token), gt(emailTokens.expiresAt, now)))
      .limit(1);
    if (!record) {
      res.status(400).json({ error: "Invalid or expired reset code" });
      return;
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ passwordHash, isEmailVerified: true }).where(eq(users.id, user.id));
    await db.delete(emailTokens).where(eq(emailTokens.userId, user.id));
    res.json({ message: "Password reset successful." });
  } catch (err) {
    req.log.error({ err }, "Reset password error");
    res.status(500).json({ error: "Password reset failed" });
  }
});

const GOOGLE_CLIENT_ID = process.env["GOOGLE_CLIENT_ID"] ?? "";
const GOOGLE_CLIENT_SECRET = process.env["GOOGLE_CLIENT_SECRET"] ?? "";
const GOOGLE_REDIRECT_URI = process.env["GOOGLE_REDIRECT_URI"] ?? "https://iunlockd.com/api/auth/google/callback";

router.get("/google", (_req, res) => {
  if (!GOOGLE_CLIENT_ID) {
    res.status(503).send("Google login not configured");
    return;
  }
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

router.get("/google/callback", async (req, res) => {
  try {
    const code = req.query["code"] as string | undefined;
    if (!code) { res.redirect("/?google_error=missing_code"); return; }
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }).toString(),
    });
    const tokens = await tokenRes.json() as { access_token?: string; error?: string };
    if (!tokens.access_token) {
      req.log.error({ err: tokens.error }, "Google token exchange failed");
      res.redirect("/?google_error=token_failed");
      return;
    }
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await profileRes.json() as { email?: string; name?: string };
    if (!profile.email) { res.redirect("/?google_error=no_email"); return; }
    const email = profile.email.toLowerCase();
    let [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      const name = profile.name ?? email.split("@")[0];
      const randomPw = await bcrypt.hash(Math.random().toString(36) + String(Date.now()), 10);
      [user] = await db.insert(users).values({
        name, email, passwordHash: randomPw, isEmailVerified: true, role: "user",
      }).returning();
      req.log.info({ userId: user.id, email }, "New user via Google OAuth");
    } else if (!user.isEmailVerified) {
      await db.update(users).set({ isEmailVerified: true }).where(eq(users.id, user.id));
    }
    const token = signToken({ userId: user.id, role: user.role });
    req.log.info({ userId: user.id }, "Google OAuth login success");
    res.redirect(`/?google_token=${token}`);
  } catch (err) {
    req.log.error({ err }, "Google OAuth callback error");
    res.redirect("/?google_error=server_error");
  }
});

export default router;
