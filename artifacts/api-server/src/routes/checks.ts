import { Router } from "express";
import { db, checkProviders } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requestCheckProvider } from "../modules/checks/provider";

const router = Router();

const IMEI_PAGE_SLUGS = new Set([
  "imei-checker",
  "iphone-imei-check",
  "iphone-carrier-check",
  "samsung-imei-check",
  "google-pixel-imei-check",
  "imei-blacklist-check",
]);

function isValidIdentifier(slug: string, identifier: string) {
  if (!IMEI_PAGE_SLUGS.has(slug)) return identifier.length <= 100;
  return /^\d{14,15}$/.test(identifier);
}

router.post("/checks/:slug", async (req, res) => {
  const slug = String(req.params["slug"] ?? "").trim().toLowerCase();
  const identifier = String(req.body?.identifier ?? "").trim();

  if (!slug || !identifier || !isValidIdentifier(slug, identifier)) {
    res.status(400).json({ error: "A valid check slug and identifier are required" });
    return;
  }

  try {
    const [provider] = await db
      .select()
      .from(checkProviders)
      .where(eq(checkProviders.slug, slug))
      .limit(1);

    if (!provider || !provider.isActive) {
      res.status(503).json({ error: "This check is not connected yet", code: "PROVIDER_NOT_CONFIGURED" });
      return;
    }

    const result = await requestCheckProvider(provider, identifier);
    const hasBlockingIssue = result.issues.some((issue) => issue.severity === "error");
    if (!result.response.ok || hasBlockingIssue) {
      res.status(502).json({
        error: result.issues[0]?.message ?? `Provider returned HTTP ${result.response.status}`,
        code: result.issues[0]?.code ?? "PROVIDER_REQUEST_FAILED",
        providerStatus: result.response.status,
        providerResponse: result.responseDiagnostics,
      });
      return;
    }

    res.json({ slug, provider: provider.name, identifier, data: result.data });
  } catch (err) {
    req.log.error({ err, slug }, "Public check provider request failed");
    res.status(502).json({ error: "Unable to reach the check provider" });
  }
});

export default router;