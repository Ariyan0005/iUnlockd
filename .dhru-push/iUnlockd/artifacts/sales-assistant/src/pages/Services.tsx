import { useEffect, useMemo, useState } from "react";
import { useSEO } from "@/lib/seo";
import { getServicePath } from "@/lib/serviceUrl";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Package, Clock, ArrowRight } from "lucide-react";

interface Service {
  slug: string;
  name: string;
  description?: string | null;
  price: string;
  processingTime?: string | null;
  serviceType: string;
  category: string;
}

export default function Services() {
  useSEO(
    "Unlock Services & Digital Products | iUnlockd",
    "Browse all active IMEI, server, remote, and digital services available from iUnlockd.",
  );
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/services")
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load services");
        return response.json();
      })
      .then((data) => setServices(Array.isArray(data) ? data : data.services ?? []))
      .catch(() => setError("Failed to load services"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return services;
    return services.filter((service) =>
      [service.name, service.description, service.category, service.serviceType]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query)),
    );
  }, [search, services]);

  const grouped = useMemo(() => {
    const groups = new Map<string, Service[]>();
    for (const service of filtered) {
      const category = service.category || service.serviceType || "other";
      groups.set(category, [...(groups.get(category) ?? []), service]);
    }
    return Array.from(groups.entries());
  }, [filtered]);

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Unlock Services &amp; Products</h1>
        </div>
        <p className="text-muted-foreground">
          Browse every active service and digital product currently available from iUnlockd.
        </p>
      </header>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search services and products…"
          className="pl-9"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading services">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-44 animate-pulse rounded-xl border border-border bg-muted/60" />
          ))}
        </div>
      )}

      {error && <div className="text-center py-16 text-destructive">{error}</div>}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No services or products found{search ? ` for "${search}"` : ""}.</p>
        </div>
      )}

      {!loading && !error && grouped.map(([category, items]) => (
        <section key={category} className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold capitalize">{category.replaceAll("_", " ")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((service) => (
              <Card
                key={service.slug}
                className="border-border hover:border-primary/40 cursor-pointer transition-all hover:shadow-md group"
                onClick={() => navigate(getServicePath(service.serviceType, service.slug))}
              >
                <CardContent className="p-5 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors">
                      {service.name}
                    </h3>
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {category.replaceAll("_", " ")}
                    </Badge>
                  </div>
                  {service.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{service.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-border">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {service.processingTime ?? "Varies"}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary">
                        ${parseFloat(service.price).toFixed(2)}
                      </span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}