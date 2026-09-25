import { and, asc, eq, isNull, or, sql } from "drizzle-orm";
import { db, services } from "@workspace/db";
import { uniqueServiceSlug } from "./slug";

let backfillPromise: Promise<number> | null = null;

export function backfillMissingServiceSlugs(): Promise<number> {
  if (!backfillPromise) {
    backfillPromise = db
      .transaction(async (tx) => {
        await tx.execute(sql`SELECT pg_advisory_xact_lock(813704291)`);

        const rows = await tx
          .select({ id: services.id, name: services.name, slug: services.slug })
          .from(services)
          .orderBy(asc(services.id));
        const reservedSlugs = new Set(
          rows
            .map((service) => service.slug?.trim().toLowerCase())
            .filter((slug): slug is string => Boolean(slug)),
        );
        let updatedCount = 0;

        for (const service of rows) {
          if (service.slug?.trim()) continue;

          const slug = uniqueServiceSlug(service.name, `service-${service.id}`, reservedSlugs);
          reservedSlugs.add(slug);

          const updated = await tx
            .update(services)
            .set({ slug })
            .where(
              and(
                eq(services.id, service.id),
                or(isNull(services.slug), sql`btrim(${services.slug}) = ''`),
              ),
            )
            .returning({ id: services.id });
          updatedCount += updated.length;
        }

        return updatedCount;
      })
      .catch((error: unknown) => {
        backfillPromise = null;
        throw error;
      });
  }

  return backfillPromise;
}