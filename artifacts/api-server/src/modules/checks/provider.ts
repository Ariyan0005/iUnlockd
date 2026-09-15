import type { CheckProvider } from "@workspace/db";

export type CheckProviderInput = {
  identifier: string;
};

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
    const body = new URLSearchParams({
      [param]: input.identifier,
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
    const body: Record<string, string> = { [param]: input.identifier };
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
  >,
  identifier: string,
) {
  const { url, init } = buildCheckRequest(provider, { identifier });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const text = await response.text();
    let data: unknown = text;
    try {
      data = JSON.parse(text);
    } catch {
      // Keep non-JSON provider responses as text for the admin test result.
    }

    return { response, data };
  } finally {
    clearTimeout(timeout);
  }
}