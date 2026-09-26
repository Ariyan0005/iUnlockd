export function getServicePath(serviceType: string, slug: string): string {
  const collection = serviceType.trim().toLowerCase() === "imei" ? "/imei-services" : "/services";
  return `${collection}/${encodeURIComponent(slug)}`;
}