import assert from "node:assert/strict";
import { buildCheckRequest } from "./provider";

const deviceDecodedProvider = {
  apiEndpoint: "https://devicedecoded.com/api/v1/checks",
  apiKey: "test-key",
  apiUser: null,
  apiFormat: "json",
  httpMethod: "POST",
  identifierParam: "imei",
  apiKeyLocation: "header",
  apiKeyParam: "X-API-Key",
  responseFormat: "",
  responseFormatParam: "format",
  staticQuery: null,
  staticBody: null,
} as const;

const request = buildCheckRequest(deviceDecodedProvider, { identifier: "353324095315963" });
const body = JSON.parse(String(request.init.body)) as Record<string, unknown>;

assert.equal(request.url, "https://devicedecoded.com/api/v1/checks");
assert.equal(request.init.method, "POST");
assert.equal(body.imei, "353324095315963");
assert.equal(body.format, undefined);
assert.equal((request.init.headers as Record<string, string>)["X-API-Key"], "test-key");