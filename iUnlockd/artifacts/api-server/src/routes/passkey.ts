import { Router } from "express";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type RegistrationResponseJSON,
  type AuthenticationResponseJSON,
} from "@simplewebauthn/server";
import { db } from "@workspace/db";
import { passkeys, users } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate, type AuthRequest } from "../middleware/authenticate";
import { signToken } from "../lib/auth";

const router = Router();

const RP_NAME = "iUnlockd";
const RP_ID = process.env["RP_ID"] ?? "iunlockd.com";
const ORIGIN = process.env["APP_ORIGIN"] ?? `https://${RP_ID}`;

const challenges = new Map<string, { value: string; expiresAt: number }>();

function storeChallenge(key: string, challenge: string): void {
  challenges.set(key, { value: challenge, expiresAt: Date.now() + 5 * 60 * 1000 });
  for (const [k, v] of challenges) if (v.expiresAt < Date.now()) challenges.delete(k);
}

function consumeChallenge(key: string): string | null {
  const entry = challenges.get(key);
  challenges.delete(key);
  if (!entry || entry.expiresAt < Date.now()) return null;
  return entry.value;
}

router.get("/registration-options", authenticate, async (req: AuthRequest, res) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, req.userId!)).limit(1);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    const existing = await db.select({ credentialId: passkeys.credentialId })
      .from(passkeys).where(eq(passkeys.userId, req.userId!));

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userName: user.email,
      userDisplayName: user.name ?? user.email,
      attestationType: "none",
      excludeCredentials: existing.map(pk => ({ id: pk.credentialId })),
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
      },
    });

    storeChallenge(`reg_${req.userId}`, options.challenge);
    res.json(options);
  } catch (err) {
    req.log.error({ err }, "Passkey registration-options error");
    res.status(500).json({ error: "Failed to generate options" });
  }
});

router.post("/register", authenticate, async (req: AuthRequest, res) => {
  try {
    const expectedChallenge = consumeChallenge(`reg_${req.userId}`);
    if (!expectedChallenge) { res.status(400).json({ error: "Challenge expired. Try again." }); return; }

    const { deviceName, ...body } = req.body as { deviceName?: string } & Record<string, unknown>;

    const verification = await verifyRegistrationResponse({
      response: body as unknown as RegistrationResponseJSON,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      requireUserVerification: false,
    });

    if (!verification.verified || !verification.registrationInfo) {
      res.status(400).json({ error: "Verification failed" }); return;
    }

    const { credential } = verification.registrationInfo;

    await db.insert(passkeys).values({
      userId: req.userId!,
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey).toString("base64url"),
      counter: credential.counter,
      deviceName: typeof deviceName === "string" && deviceName.trim() ? deviceName.trim() : null,
    });

    res.json({ message: "Passkey registered successfully" });
  } catch (err) {
    req.log.error({ err }, "Passkey register error");
    res.status(400).json({ error: String(err) });
  }
});

router.get("/authentication-options", async (_req, res) => {
  try {
    const sessionId = Math.random().toString(36).slice(2, 14);
    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      userVerification: "preferred",
      allowCredentials: [],
    });
    storeChallenge(`auth_${sessionId}`, options.challenge);
    res.json({ ...options, sessionId });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate options" });
  }
});

router.post("/authenticate", async (req, res) => {
  try {
    const { sessionId, ...body } = req.body as { sessionId: string } & Record<string, unknown>;
    if (!sessionId) { res.status(400).json({ error: "Missing sessionId" }); return; }

    const expectedChallenge = consumeChallenge(`auth_${sessionId}`);
    if (!expectedChallenge) { res.status(400).json({ error: "Challenge expired. Try again." }); return; }

    const credentialId = (body as { id?: string }).id;
    if (!credentialId) { res.status(400).json({ error: "Missing credential id" }); return; }

    const [storedPasskey] = await db.select().from(passkeys)
      .where(eq(passkeys.credentialId, credentialId)).limit(1);
    if (!storedPasskey) { res.status(404).json({ error: "Passkey not registered on this account" }); return; }

    const [user] = await db.select().from(users)
      .where(eq(users.id, storedPasskey.userId)).limit(1);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    const verification = await verifyAuthenticationResponse({
      response: body as unknown as AuthenticationResponseJSON,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      requireUserVerification: false,
      credential: {
        id: storedPasskey.credentialId,
        publicKey: new Uint8Array(Buffer.from(storedPasskey.publicKey, "base64url")),
        counter: storedPasskey.counter,
      },
    });

    if (!verification.verified) { res.status(401).json({ error: "Passkey verification failed" }); return; }

    await db.update(passkeys)
      .set({ counter: verification.authenticationInfo.newCounter })
      .where(eq(passkeys.credentialId, credentialId));

    const token = signToken({ userId: user.id, role: user.role });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, balance: user.balance, role: user.role, createdAt: user.createdAt },
    });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

router.get("/list", authenticate, async (req: AuthRequest, res) => {
  try {
    const list = await db.select({
      id: passkeys.id,
      credentialId: passkeys.credentialId,
      deviceName: passkeys.deviceName,
      createdAt: passkeys.createdAt,
    }).from(passkeys).where(eq(passkeys.userId, req.userId!));
    res.json(list);
  } catch (err) {
    req.log.error({ err }, "List passkeys error");
    res.status(500).json({ error: "Failed to list passkeys" });
  }
});

router.delete("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params["id"]);
    const [pk] = await db.select({ userId: passkeys.userId })
      .from(passkeys).where(eq(passkeys.id, id)).limit(1);
    if (!pk || pk.userId !== req.userId) { res.status(404).json({ error: "Passkey not found" }); return; }
    await db.delete(passkeys).where(eq(passkeys.id, id));
    res.json({ message: "Passkey removed" });
  } catch (err) {
    req.log.error({ err }, "Delete passkey error");
    res.status(500).json({ error: "Failed to remove passkey" });
  }
});

export default router;
