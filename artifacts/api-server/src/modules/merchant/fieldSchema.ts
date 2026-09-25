import type { ServiceOrderField } from "@workspace/db";

const INPUT_TYPES = new Set(["text", "email", "number", "textarea", "select"]);

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function asBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  return ["true", "1", "yes", "required"].includes(String(value ?? "").trim().toLowerCase());
}

function normalizeType(value: unknown): string {
  const type = String(value ?? "text").trim().toLowerCase();
  if (type === "tel" || type === "phone" || type === "string") return "text";
  if (type === "dropdown" || type === "choice") return "select";
  return INPUT_TYPES.has(type) ? type : "text";
}

function normalizeOptions(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const options = value
    .map((item) => typeof item === "object" && item !== null
      ? String((item as Record<string, unknown>)["value"] ?? (item as Record<string, unknown>)["label"] ?? "")
      : String(item ?? ""))
    .map((item) => item.trim())
    .filter(Boolean);
  return options.length > 0 ? options : undefined;
}

/**
 * Dhru exposes product-specific fields as:
 * [{ type, name, min, max, required }].
 * Keep the original name because Dhru expects that exact key in the order body.
 */
export function normalizeMerchantFields(raw: unknown): ServiceOrderField[] {
  const items: unknown[] =
    Array.isArray(raw)
      ? raw
      : raw && typeof raw === "object"
        ? Object.entries(raw as Record<string, unknown>).map(([name, value]) => {
            if (value && typeof value === "object" && !Array.isArray(value)) {
              return { ...(value as Record<string, unknown>), name };
            }
            return { name, required: value };
          })
        : typeof raw === "string"
          ? raw.split(/[,\n|]+/).map((name) => ({ name: name.trim(), label: name.trim(), required: true }))
          : [];

  return items.flatMap((item): ServiceOrderField[] => {
    if (typeof item !== "object" || item === null) return [];
    const value = item as Record<string, unknown>;
    const name = String(value["name"] ?? value["key"] ?? value["field"] ?? "").trim();
    if (!name) return [];

    const label = String(value["label"] ?? value["title"] ?? name).trim() || name;
    const min = asNumber(value["min"] ?? value["minLength"]);
    const max = asNumber(value["max"] ?? value["maxLength"]);
    const options = normalizeOptions(value["options"] ?? value["values"]);
    return [{
      name,
      label,
      type: normalizeType(value["type"] ?? value["input_type"]),
      required: asBoolean(value["required"]),
      ...(min === undefined ? {} : { min }),
      ...(max === undefined ? {} : { max }),
      ...(options ? { options } : {}),
    }];
  });
}

export function fieldNameMatches(field: ServiceOrderField, pattern: RegExp): boolean {
  return pattern.test(`${field.name} ${field.label}`);
}