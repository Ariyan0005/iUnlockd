export function slugifyServiceName(name: string, fallback: string): string {
  const slug = String(name ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || `product-${fallback}`;
}

export function uniqueServiceSlug(
  name: string,
  fallback: string,
  reserved: Set<string>,
): string {
  const base = slugifyServiceName(name, fallback);
  if (!reserved.has(base)) return base;

  const fallbackSlug = `${base}-${slugifyServiceName(fallback, "service")}`;
  if (!reserved.has(fallbackSlug)) return fallbackSlug;

  let index = 2;
  while (reserved.has(`${base}-${index}`)) index += 1;
  return `${base}-${index}`;
}