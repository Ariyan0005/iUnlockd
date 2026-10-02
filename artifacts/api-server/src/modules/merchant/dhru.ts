import { XMLParser, XMLValidator } from "fast-xml-parser";

export class DhruProductsError extends Error {
  constructor(message: string, readonly httpStatus?: number) {
    super(message);
    this.name = "DhruProductsError";
  }
}


export interface DhruProductsResult {
  httpStatus: number;
  products: Record<string, unknown>[];
}

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  trimValues: true,
  parseTagValue: true,
  parseAttributeValue: true,
  removeNSPrefix: true,
});

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function normalizedTagName(value: string): string {
  return value.replace(/^@_/, "").replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function textValue(value: unknown): string | undefined {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    const text = String(value).trim();
    return text || undefined;
  }
  const record = asRecord(value);
  if (record && "#text" in record) return textValue(record["#text"]);
  return undefined;
}

function readTag(record: Record<string, unknown>, aliases: string[]): unknown {
  const normalizedAliases = new Set(aliases.map(normalizedTagName));
  for (const [key, value] of Object.entries(record)) {
    if (normalizedAliases.has(normalizedTagName(key)) && value !== undefined && value !== null) {
      return value;
    }
  }
  return undefined;
}

function canonicalizeProduct(value: unknown): Record<string, unknown> | null {
  const record = asRecord(value);
  if (!record) return null;

  const id = textValue(readTag(record, [
    "id", "service_id", "product_id", "uuid", "product_uuid",
  ]));
  const name = textValue(readTag(record, [
    "name", "service_name", "product_name", "service_title", "product_title", "title",
  ]));
  if (!id || !name) return null;

  const product: Record<string, unknown> = { ...record, id, name };
  const aliases: Array<[string, string[]]> = [
    ["price", ["price", "rate", "cost", "amount", "credit", "usd"]],
    ["description", ["description", "desc", "details", "info", "service_description", "product_description"]],
    ["category", ["category", "group"]],
    ["type", ["type", "service_type", "product_type"]],
    ["fields", [
      "fields", "input_fields", "order_box", "order_form",
      "order_fields", "order_box_fields", "required_fields", "requirements",
      "inputs", "parameters", "schema", "field_schema",
    ]],
  ];

  for (const [canonicalName, fieldAliases] of aliases) {
    const field = readTag(record, fieldAliases);
    if (field !== undefined) product[canonicalName] = field;
  }

  return product;
}

function collectProducts(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.flatMap(collectProducts);

  const record = asRecord(value);
  if (!record) return [];

  const product = canonicalizeProduct(record);
  if (product) return [product];

  return Object.values(record).flatMap(collectProducts);
}

function responseStatus(parsed: unknown): string | undefined {
  const record = asRecord(parsed);
  if (!record) return undefined;

  const root = Object.values(record).find((value) => asRecord(value)) ?? parsed;
  const rootRecord = asRecord(root);
  if (!rootRecord) return undefined;

  return textValue(readTag(rootRecord, ["status", "response_status"]));
}

function findMessage(value: unknown): string | undefined {
  const record = asRecord(value);
  if (!record) return textValue(value);

  const directMessage = readTag(record, ["message", "error_message", "description"]);
  if (directMessage !== undefined) {
    const message = findMessage(directMessage);
    if (message) return message;
  }

  for (const child of Object.values(record)) {
    const message = findMessage(child);
    if (message) return message;
  }

  return undefined;
}

function responseError(parsed: unknown): string | undefined {
  const document = asRecord(parsed);
  if (!document) return undefined;

  const rootEntry = Object.entries(document).find(([key]) => !key.startsWith("?"));
  const root = asRecord(rootEntry?.[1]) ?? document;
  const error = normalizedTagName(rootEntry?.[0] ?? "") === "error"
    ? rootEntry?.[1]
    : readTag(root, ["error", "errors"]);
  if (error === undefined) return undefined;

  return findMessage(error) ?? "Provider returned an unspecified error";
}

function rootTagName(parsed: unknown): string | undefined {
  const record = asRecord(parsed);
  if (!record) return undefined;
  const tagName = Object.keys(record).find((key) => !key.startsWith("?"));
  return tagName ? normalizedTagName(tagName) : undefined;
}

export function parseDhruProducts(xml: string): Record<string, unknown>[] {
  const validation = XMLValidator.validate(xml);
  if (validation !== true) {
    throw new DhruProductsError("Dhru returned malformed XML");
  }

  let parsed: unknown;
  try {
    parsed = xmlParser.parse(xml) as unknown;
  } catch {
    throw new DhruProductsError("Dhru returned malformed XML");
  }

  if (rootTagName(parsed) === "html") {
    throw new DhruProductsError("Dhru returned HTML instead of XML");
  }

  const providerError = responseError(parsed);
  if (providerError) {
    throw new DhruProductsError(`Dhru rejected the product request: ${providerError}`);
  }

  const status = responseStatus(parsed)?.toLowerCase();
  if (status && !["4", "success", "ok", "true"].includes(status)) {
    throw new DhruProductsError(`Dhru rejected the product request (status ${status})`);
  }

  return collectProducts(parsed);
}

export async function requestDhruProducts(
  base: string,
  apiKey: string,
  apiUser: string | null,
  signal?: AbortSignal,
): Promise<DhruProductsResult> {
  const endpoint = `${base.replace(/\/+$/, "")}/api/index.php`;
  const body = new URLSearchParams({
    apiaccesskey: apiKey,
    username: apiUser ?? "",
    action: "imeiservicelist",
  });

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/xml, text/xml",
    },
    body: body.toString(),
    signal,
  });
  const responseBody = await response.text();

  if (!response.ok) {
    throw new DhruProductsError(`Dhru request failed with HTTP ${response.status}`, response.status);
  }

  try {
    return {
      httpStatus: response.status,
      products: parseDhruProducts(responseBody),
    };
  } catch (error) {
    if (error instanceof DhruProductsError) {
      throw new DhruProductsError(error.message, response.status);
    }
    throw new DhruProductsError("Unable to parse Dhru product response", response.status);
  }
}