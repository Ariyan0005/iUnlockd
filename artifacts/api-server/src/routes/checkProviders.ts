import { Router } from "express";
import { db, checkProviders } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { authenticate, requireAdmin, type AuthRequest } from "../middleware/authenticate";
import { requestCheckProvider } from "../modules/checks/provider";

const router = Router();

const providerFields = {
  id: checkProviders.id,
  slug: checkProviders.slug,
  name: checkProviders.name,
  apiEndpoint: checkProviders.apiEndpoint,
  apiUser: checkProviders.apiUser,
  apiFormat: checkProviders.apiFormat,
  httpMethod: checkProviders.httpMethod,
  identifierParam: checkProviders.identifierParam,
    apiKeyLocation: checkProviders.apiKeyLocation,
    apiKeyParam: checkProviders.apiKeyParam,
    responseFormat: checkProviders.responseFormat,
    responseFormatParam: checkProviders.responseFormatParam,
    staticQuery: checkProviders.staticQuery,
  staticBody: checkProviders.staticBody,
  description: checkProviders.description,
  isActive: checkProviders.isActive,
  createdAt: checkProviders.createdAt,
  updatedAt: checkProviders.updatedAt,
};

router.get("/check-providers", authenticate, requireAdmin, async (_req: AuthRequest, res) => {
  try {
    const rows = await db.select(providerFields).from(checkProviders).orderBy(desc(checkProviders.createdAt));
    res.json(rows.map((row) => ({ ...row, apiKeySet: true })));
  } catch (err) {
    res.status(500).json({ error: "Failed to get check providers" });
  }
});

router.post("/check-providers", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const {
      slug, name, apiEndpoint, apiKey, apiUser, apiFormat, httpMethod, identifierParam, description, isActive,
      apiKeyLocation, apiKeyParam, responseFormat, responseFormatParam, staticQuery, staticBody,
    } = req.body as Record<string, unknown>;

    if (!slug || !name || !apiEndpoint || !apiKey) {
      res.status(400).json({ error: "slug, name, apiEndpoint, and apiKey are required" });
      return;
    }

    const [created] = await db.insert(checkProviders).values({
      slug: String(slug).trim().toLowerCase(),
      name: String(name).trim(),
      apiEndpoint: String(apiEndpoint).trim(),
      apiKey: String(apiKey).trim(),
      apiUser: apiUser ? String(apiUser).trim() : null,
      apiFormat: ["rest", "form", "json"].includes(String(apiFormat)) ? String(apiFormat) : "rest",
      httpMethod: String(httpMethod).toUpperCase() === "POST" ? "POST" : "GET",
      identifierParam: String(identifierParam || "imei").trim(),
      apiKeyLocation: ["header", "query", "body"].includes(String(apiKeyLocation)) ? String(apiKeyLocation) : "header",
      apiKeyParam: String(apiKeyParam || "key").trim(),
      responseFormat: responseFormat === undefined || responseFormat === null ? "json" : String(responseFormat).trim(),
      responseFormatParam: responseFormatParam === undefined || responseFormatParam === null ? "format" : String(responseFormatParam).trim(),
      staticQuery: staticQuery ? String(staticQuery).trim() : null,
      staticBody: staticBody ? String(staticBody).trim() : null,
      description: description ? String(description).trim() : null,
      isActive: Boolean(isActive),
    }).returning(providerFields);

    res.status(201).json({ ...created, apiKeySet: true });
  } catch (err) {
    req.log.error({ err }, "Admin create check provider error");
    res.status(500).json({ error: "Failed to create check provider" });
  }
});

router.patch("/check-providers/:id", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params["id"]);
    const body = req.body as Record<string, unknown>;
    const update: Record<string, unknown> = { updatedAt: new Date() };

    for (const key of ["name", "apiEndpoint", "apiUser", "identifierParam", "apiKeyParam", "responseFormat", "responseFormatParam"]) {
      if (body[key] !== undefined) update[key] = String(body[key] ?? "").trim();
    }
    for (const key of ["staticQuery", "staticBody", "description"]) {
      if (body[key] !== undefined) update[key] = body[key] ? String(body[key]).trim() : null;
    }
    if (body.slug !== undefined) update.slug = String(body.slug).trim().toLowerCase();
    if (body.apiKey) update.apiKey = String(body.apiKey).trim();
    if (body.apiFormat !== undefined && ["rest", "form", "json"].includes(String(body.apiFormat))) update.apiFormat = String(body.apiFormat);
    if (body.httpMethod !== undefined) update.httpMethod = String(body.httpMethod).toUpperCase() === "POST" ? "POST" : "GET";
    if (body.apiKeyLocation !== undefined && ["header", "query", "body"].includes(String(body.apiKeyLocation))) {
      update.apiKeyLocation = String(body.apiKeyLocation);
    }
    if (body.isActive !== undefined) update.isActive = Boolean(body.isActive);

    const [updated] = await db.update(checkProviders).set(update).where(eq(checkProviders.id, id)).returning(providerFields);
    if (!updated) {
      res.status(404).json({ error: "Check provider not found" });
      return;
    }
    res.json({ ...updated, apiKeySet: true });
  } catch (err) {
    req.log.error({ err }, "Admin update check provider error");
    res.status(500).json({ error: "Failed to update check provider" });
  }
});

router.post("/check-providers/:id/test", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params["id"]);
    const identifier = String(req.body?.identifier ?? "").trim();
    if (!identifier) {
      res.status(400).json({ error: "Enter a sample identifier to test the provider" });
      return;
    }
    const [provider] = await db.select().from(checkProviders).where(eq(checkProviders.id, id)).limit(1);
    if (!provider) {
      res.status(404).json({ error: "Check provider not found" });
      return;
    }

    const result = await requestCheckProvider(provider, identifier);
    const hasBlockingIssue = result.issues.some((issue) => issue.severity === "error");
    res.status(result.response.ok && !hasBlockingIssue ? 200 : 502).json({
      ok: result.response.ok && !hasBlockingIssue,
      httpStatus: result.response.status,
      provider: provider.name,
      request: result.request,
      response: result.responseDiagnostics,
      issues: result.issues,
      preview: typeof result.data === "string" ? result.data.slice(0, 1200) : result.data,
    });
  } catch (err) {
    req.log.error({ err }, "Admin test check provider error");
    const error = err as { code?: string; message?: string };
    res.status(502).json({
      ok: false,
      error: error.code === "PROVIDER_TIMEOUT"
        ? "Provider request timed out after 15 seconds."
        : "Provider test failed before a response was received.",
      code: error.code ?? "PROVIDER_REQUEST_FAILED",
      detail: error.message ?? "Unknown provider request error",
    });
  }
});

router.delete("/check-providers/:id", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params["id"]);
    await db.delete(checkProviders).where(eq(checkProviders.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Admin delete check provider error");
    res.status(500).json({ error: "Failed to delete check provider" });
  }
});

export default router;