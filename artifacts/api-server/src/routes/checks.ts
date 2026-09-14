import { Router } from "express";
import { db, checkProviders } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requestCheckProvider } from "../modules/checks/provider";

const router = Router();

router.post("/checks/:slug", async (req, res) => {
  const slug = String(req.params["slug"] ?? "").trim().toLowerCase();
  const identifier = String(req.body?.identifier ?? "").trim();

  if (!slug || !identifier || identifier.length > 100) {
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

    const { response, data } = await requestCheckProvider(provider, identifier);
    if (!response.ok) {
      res.status(502).json({ error: `Provider returned HTTP ${response.status}`, providerStatus: response.status });
      return;
    }

    res.json({ slug, provider: provider.name, identifier, data });
  } catch (err) {
    req.log.error({ err, slug }, "Public check provider request failed");
    res.status(502).json({ error: "Unable to reach the check provider" });
  }
});

export default router;