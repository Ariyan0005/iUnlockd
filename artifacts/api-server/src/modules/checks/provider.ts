import type { CheckProvider } from "@workspace/db";

export type CheckProviderInput = {
  identifier: string;
};

export function buildCheckRequest(
  provider: Pick<CheckProvider, "apiEndpoint" | "apiKey" | "apiUser" | "apiFormat" | "httpMethod" | "identifierParam">,
  input: CheckProviderInput,
): { url: string; init: RequestInit } {
  const base = provider.apiEndpoint.trim();
  const method = (provider.httpMethod || "GET").toUpperCase();
  const format = provider.apiFormat || "rest";
  const param = provider.identifierParam?.trim() || "imei";
  const headers: Record<string, string> = {
    Accept: "application/json",
    "User-Agent": "iUnlockd-check-client/1.0",
  };

  if (provider.apiUser?.trim()) {
    headers.Authorization = `Basic ${Buffer.from(`${provider.apiUser.trim()}:${provider.apiKey}`).toString("base64")}`;
  } else {
    headers.Authorization = `Bearer ${provider.apiKey}`;
    headers["X-API-Key"] = provider.apiKey;
  }

  if (format === "form") {
    const body = new URLSearchParams({
      [param]: input.identifier,
      key: provider.apiKey,
    });
    if (provider.apiUser?.trim()) body.set("username", provider.apiUser.trim());
    delete headers.Authorization;
    delete headers["X-API-Key"];
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    return { url: base, init: { method: "POST", headers, body: body.toString() } };
  }

  if (method === "POST") {
    headers["Content-Type"] = "application/json";
    return {
      url: base,
      init: { method, headers, body: JSON.stringify({ [param]: input.identifier }) },
    };
  }

  const url = new URL(base);
  url.searchParams.set(param, input.identifier);
  return { url: url.toString(), init: { method: "GET", headers } };
}

export async function requestCheckProvider(
  provider: Pick<CheckProvider, "apiEndpoint" | "apiKey" | "apiUser" | "apiFormat" | "httpMethod" | "identifierParam">,
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