import type { CheckProvider } from "@workspace/db";

export type CheckProviderInput = {
  identifier: string;
};

export type ProviderRequestDiagnostics = {
  method: string;
  url: string;
  body?: string;
};

export type ProviderResponseDiagnostics = {
  status: number;
  statusText: string;
  contentType: string;
  server: string;
  cloudflareChallenge: boolean;
  durationMs: number;
  bodyPreview: string;
  parsedJson: boolean;
};

export type ProviderResponseIssue = {
  code: string;
  message: string;
  severity: "error" | "warning";
};

function redactValue(value: string): string {
  return value ? "[REDACTED]" : value;
}

function redactRequestUrl(
  rawUrl: string,
  provider: Pick<CheckProvider, "apiKeyParam">,
): string {
  const url = new URL(rawUrl);
  const sensitiveNames = new Set([
    provider.apiKeyParam?.trim().toLowerCase() || "key",
    "key",
    "api_key",
    "apikey",
    "api-key",
    "authorization",
  ]);

  for (const key of url.searchParams.keys()) {
    if (sensitiveNames.has(key.toLowerCase())) {
      url.searchParams.set(key, "[REDACTED]");
    }
  }
  return url.toString();
}

function redactRequestBody(
  body: string | undefined,
  provider: Pick<CheckProvider, "apiKeyParam">,
): string | undefined {
  if (!body) return undefined;

  const sensitiveNames = new Set([
    provider.apiKeyParam?.trim().toLowerCase() || "key",
    "key",
    "api_key",
    "apikey",
    "api-key",
    "authorization",
  ]);

  try {
    const parsed = JSON.parse(body) as Record<string, unknown>;
    for (const key of Object.keys(parsed)) {
      if (sensitiveNames.has(key.toLowerCase())) {
        parsed[key] = redactValue(String(parsed[key] ?? ""));
      }
    }
    return JSON.stringify(parsed);
  } catch {
    const params = new URLSearchParams(body);
    let changed = false;
    for (const key of params.keys()) {
      if (sensitiveNames.has(key.toLowerCase())) {
        params.set(key, "[REDACTED]");
        changed = true;
      }
    }
    return changed ? params.toString() : body;
  }
}

export function describeProviderRequest(
  provider: Pick<CheckProvider, "apiKeyParam">,
  request: { url: string; init: RequestInit },
): ProviderRequestDiagnostics {
  return {
    method: String(request.init.method ?? "GET").toUpperCase(),
    url: redactRequestUrl(request.url, provider),
    body: redactRequestBody(typeof request.init.body === "string" ? request.init.body : undefined, provider),
  };
}

export function diagnoseProviderResponse(
  provider: Pick<CheckProvider, "responseFormat">,
  response: Pick<Response, "ok" | "status" | "statusText" | "headers">,
  text: string,
  durationMs: number,
): { response: ProviderResponseDiagnostics; issues: ProviderResponseIssue[]; data: unknown } {
  const contentType = response.headers.get("content-type") ?? "";
  const bodyPreview = text.slice(0, 1200);
  const cloudflareChallenge =
    response.headers.get("cf-mitigated") === "challenge" ||
    /just a moment|challenge-platform|cf-chl-/i.test(text);
  let parsedJson = false;
  try {
    JSON.parse(text);
    parsedJson = true;
  } catch {
    parsedJson = false;
  }

  let data: unknown = text;
  if (parsedJson) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  const issues: ProviderResponseIssue[] = [];
  if (cloudflareChallenge) {
    issues.push({
      code: "CLOUDFLARE_CHALLENGE",
      severity: "error",
      message: "The provider returned a Cloudflare challenge instead of an API response. A server-side request cannot complete this browser challenge.",
    });
  }
  if (response.status === 401 || response.status === 403) {
    issues.push({
      code: "AUTH_REJECTED",
      severity: "error",
      message: `The provider rejected authentication with HTTP ${response.status}. Check the key, key location, and required permission.`,
    });
  } else if (response.status === 404) {
    issues.push({
      code: "ENDPOINT_NOT_FOUND",
      severity: "error",
      message: "The provider endpoint was not found. Verify the path and API version from the provider documentation.",
    });
  } else if (response.status >= 500) {
    issues.push({
      code: "PROVIDER_SERVER_ERROR",
      severity: "error",
      message: `The provider returned HTTP ${response.status}. This is an upstream failure, not a local validation error.`,
    });
  }
  if (response.ok && provider.responseFormat === "json" && !parsedJson) {
    issues.push({
      code: "NON_JSON_RESPONSE",
      severity: "error",
      message: `The provider returned HTTP ${response.status} but the body is not JSON (${contentType || "unknown content type"}). This usually means the endpoint is a web page, redirect target, or undocumented route.`,
    });
  }
  if (!text.trim()) {
    issues.push({
      code: "EMPTY_RESPONSE",
      severity: "error",
      message: "The provider returned an empty response body.",
    });
  }

  return {
    response: {
      status: response.status,
      statusText: response.statusText,
      contentType,
      server: response.headers.get("server") ?? "",
      cloudflareChallenge,
      durationMs,
      bodyPreview,
      parsedJson,
    },
    issues,
    data,
  };
}

export function buildCheckRequest(
  provider: Pick<
    CheckProvider,
    | "apiEndpoint"
    | "apiKey"
    | "apiUser"
    | "apiFormat"
    | "httpMethod"
    | "identifierParam"
    | "apiKeyLocation"
    | "apiKeyParam"
    | "responseFormat"
    | "responseFormatParam"
    | "staticQuery"
    | "staticBody"
  >,
  input: CheckProviderInput,
): { url: string; init: RequestInit } {
  const base = provider.apiEndpoint.trim();
  const method = (provider.httpMethod || "GET").toUpperCase();
  const format = provider.apiFormat || "rest";
  const param = provider.identifierParam?.trim() || "imei";
  const apiKeyLocation = provider.apiKeyLocation || "header";
  const apiKeyParam = provider.apiKeyParam?.trim() || "key";
  const responseFormat = provider.responseFormat?.trim() || "json";
  const responseFormatParam = provider.responseFormatParam?.trim() || "format";
  const headers: Record<string, string> = {
    Accept: "application/json",
    "User-Agent": "iUnlockd-check-client/1.0",
  };

  if (provider.apiUser?.trim()) {
    headers.Authorization = `Basic ${Buffer.from(`${provider.apiUser.trim()}:${provider.apiKey}`).toString("base64")}`;
  } else if (apiKeyLocation === "header") {
    if (apiKeyParam.toLowerCase() === "authorization") {
      headers.Authorization = `Bearer ${provider.apiKey}`;
    } else {
      headers[apiKeyParam] = provider.apiKey;
    }
  }

  const url = new URL(base);
  if (provider.staticQuery?.trim()) {
    try {
      const staticQuery = JSON.parse(provider.staticQuery) as unknown;
      if (staticQuery && typeof staticQuery === "object" && !Array.isArray(staticQuery)) {
        for (const [key, value] of Object.entries(staticQuery)) {
          if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
            url.searchParams.set(key, String(value));
          }
        }
      }
    } catch {
      throw new Error("Provider static query must be valid JSON");
    }
  }

  if (format === "form") {
    const bodyValues: Record<string, string> = {};
    if (provider.staticBody?.trim()) {
      try {
        const staticBody = JSON.parse(provider.staticBody) as unknown;
        if (staticBody && typeof staticBody === "object" && !Array.isArray(staticBody)) {
          for (const [key, value] of Object.entries(staticBody)) {
            if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
              bodyValues[key] = String(value);
            }
          }
        }
      } catch {
        throw new Error("Provider static body must be valid JSON");
      }
    }
    bodyValues[param] = input.identifier;
    const body = new URLSearchParams({
      ...bodyValues,
    });
    if (apiKeyLocation === "body") body.set(apiKeyParam, provider.apiKey);
    if (provider.apiUser?.trim()) body.set("username", provider.apiUser.trim());
    if (responseFormat) body.set(responseFormatParam, responseFormat);
    if (apiKeyLocation === "query") url.searchParams.set(apiKeyParam, provider.apiKey);
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    return { url: url.toString(), init: { method: "POST", headers, body: body.toString() } };
  }

  if (method === "POST") {
    headers["Content-Type"] = "application/json";
    const body: Record<string, string> = {};
    if (provider.staticBody?.trim()) {
      try {
        const staticBody = JSON.parse(provider.staticBody) as unknown;
        if (staticBody && typeof staticBody === "object" && !Array.isArray(staticBody)) {
          for (const [key, value] of Object.entries(staticBody)) {
            if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
              body[key] = String(value);
            }
          }
        }
      } catch {
        throw new Error("Provider static body must be valid JSON");
      }
    }
    body[param] = input.identifier;
    if (apiKeyLocation === "body") body[apiKeyParam] = provider.apiKey;
    if (responseFormat) body[responseFormatParam] = responseFormat;
    return {
      url: url.toString(),
      init: { method, headers, body: JSON.stringify(body) },
    };
  }

  url.searchParams.set(param, input.identifier);
  if (apiKeyLocation === "query") url.searchParams.set(apiKeyParam, provider.apiKey);
  if (responseFormat) url.searchParams.set(responseFormatParam, responseFormat);
  return { url: url.toString(), init: { method: "GET", headers } };
}

export async function requestCheckProvider(
  provider: Pick<
    CheckProvider,
    | "apiEndpoint"
    | "apiKey"
    | "apiUser"
    | "apiFormat"
    | "httpMethod"
    | "identifierParam"
    | "apiKeyLocation"
    | "apiKeyParam"
    | "responseFormat"
    | "responseFormatParam"
    | "staticQuery"
    | "staticBody"
  >,
  identifier: string,
) {
  const request = buildCheckRequest(provider, { identifier });
  const { url, init } = request;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  const startedAt = Date.now();

  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const text = await response.text();
    const inspected = diagnoseProviderResponse(provider, response, text, Date.now() - startedAt);
    return {
      response,
      data: inspected.data,
      text,
      durationMs: inspected.response.durationMs,
      request: describeProviderRequest(provider, request),
      responseDiagnostics: inspected.response,
      issues: inspected.issues,
    };
  } catch (error) {
    if (controller.signal.aborted) {
      throw Object.assign(new Error("Provider request timed out after 15 seconds"), { code: "PROVIDER_TIMEOUT" });
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}