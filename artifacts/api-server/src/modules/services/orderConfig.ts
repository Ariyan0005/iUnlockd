export type ServiceOrderConfigInput = {
  name: string;
  category?: string | null;
  serviceType?: string | null;
  identifierType?: string | null;
  fieldLabel?: string | null;
};

const VALID_IDENTIFIER_TYPES = new Set(["imei", "sn", "email", "username", "none"]);
const DEVICE_ORDER_TERMS =
  /\b(imei|mdm|icloud|fmi|find my|bypass|carrier unlock|device unlock|blacklist|serial number|ipad|iphone|apple tv)\b/i;

/**
 * Older service rows defaulted identifierType to "imei". Server products are
 * mixed, so only keep that legacy value when the product clearly describes a
 * device identifier or explicitly labels the field that way.
 */
export function resolveIdentifierType(service: ServiceOrderConfigInput): string {
  const explicit = String(service.identifierType ?? "").trim().toLowerCase();
  if (!explicit || !VALID_IDENTIFIER_TYPES.has(explicit)) {
    return service.serviceType?.toLowerCase() === "imei" ? "imei" : "none";
  }
  if (explicit !== "imei" || service.serviceType?.toLowerCase() !== "server") {
    return explicit;
  }

  const searchableText = [
    service.name,
    service.category ?? "",
    service.fieldLabel ?? "",
  ].join(" ");

  return DEVICE_ORDER_TERMS.test(searchableText) ? "imei" : "none";
}