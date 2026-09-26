import { useEffect, useState } from "react";
import { useSEO } from "@/lib/seo";
import { getServicePath } from "@/lib/serviceUrl";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Wrench, Clock, ArrowRight } from "lucide-react";

interface Service {
  slug: string;
  name: string;
  description: string;
  price: string;
  processingTime: string;
  serviceType: string;
  category: string;
  isActive: boolean;
}

export type ToolCatalogMode = "rent" | "activation";

const CATALOG_CONFIG = {
  rent: {
    title: "Tool Rent Services",
    seoTitle: "Tool Rent Services — iUnlockd",
    seoDescription:
      "Rent unlock-related tools for temporary access, technician jobs, and short-term device service workflows.",
    description:
      "Rent unlock-related tools when you need temporary access for a device job or technician workflow.",
    searchLabel: "Search tool rental services…",
    emptyLabel: "No tool rental services found",
    emptyDescription: "Rent-related tools will appear here when they are available.",
    errorLabel: "Failed to load tool rental services",
    apiType: "tool_rent",
  },
  activation: {
    title: "Tool Activation & Credits",
    seoTitle: "Tool Activation & Credits — iUnlockd",
    seoDescription:
      "Buy unlock-related tool activations, subscriptions, and credits through the iUnlockd service marketplace.",
    description:
      "Buy unlock-related tools, tool subscriptions, and credit packs for your technician workflow.",
    searchLabel: "Search tool activations, subscriptions, and credits…",
    emptyLabel: "No tool activation or credit services found",
    emptyDescription:
      "Tool activations, subscriptions, and credits will appear here when they are available.",
    errorLabel: "Failed to load tool activation services",
    apiType: "tool",
  },
} as const;

export function ToolCatalog({ mode }: { mode: ToolCatalogMode }) {
  const config = CATALOG_CONFIG[mode];
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [filtered, setFiltered] = useState<Service[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useSEO(config.seoTitle, config.seoDescription);

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`/api/services?type=${config.apiType}`)
      .then((response) => {
        if (!response.ok) throw new Error(config.errorLabel);
        return response.json();
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : data.services ?? [];
        setServices(list);
        setFiltered(list);
      })
      .catch(() => setError(config.errorLabel))
      .finally(() => setLoading(false));
  }, [config.apiType, config.errorLabel]);

  useEffect(() => {
    const query = search.toLowerCase();
    setFiltered(
      services.filter(
        (service) =>
          service.name.toLowerCase().includes(query) ||
          service.description?.toLowerCase().includes(query) ||
          service.category?.toLowerCase().includes(query),
      ),
    );
  }, [search, services]);

  const categories = [...new Set(filtered.map((service) => service.category).filter(Boolean))];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Wrench className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">{config.title}</h1>
        </div>
        <p className="text-muted-foreground">{config.description}</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          data-testid={`input-search-${mode}-services`}
          aria-label={config.searchLabel}
          placeholder={config.searchLabel}
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

      {error && <div className="py-16 text-center text-destructive">{error}</div>}

      {!loading && !error && filtered.length === 0 && (
        <div className="py-16 text-center text-muted-foreground">
          <Wrench className="mx-auto mb-3 h-12 w-12 opacity-30" />
          <p>{config.emptyLabel}{search ? ` for "${search}"` : "."}</p>
          <p className="mt-2 text-sm">{config.emptyDescription}</p>
        </div>
      )}

      {categories.map((category) => (
        <div key={category} className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold capitalize">{category}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered
              .filter((service) => service.category === category)
              .map((service) => (
                <ServiceCard
                  key={service.slug}
                  service={service}
                  onSelect={() => navigate(getServicePath(service.serviceType, service.slug))}
                />
              ))}
          </div>
        </div>
      ))}

      {!loading && !error && categories.length === 0 && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((service) => (
            <ServiceCard
              key={service.slug}
              service={service}
              onSelect={() => navigate(getServicePath(service.serviceType, service.slug))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ToolRent() {
  return <ToolCatalog mode="rent" />;
}

function ServiceCard({ service, onSelect }: { service: Service; onSelect: () => void }) {
  return (
    <Card
      className="group cursor-pointer border-border transition-all hover:border-primary/40 hover:shadow-md"
      onClick={onSelect}
    >
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold leading-snug transition-colors group-hover:text-primary">
            {service.name}
          </h3>
          {service.category && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              {service.category}
            </Badge>
          )}
        </div>
        {service.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{service.description}</p>
        )}
        <div className="mt-auto flex items-center justify-between border-t border-border pt-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {service.processingTime || "Varies"}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary">
              ${Number.parseFloat(service.price).toFixed(2)}
            </span>
            <ArrowRight className="h-3 w-3 text-muted-foreground transition-colors group-hover:text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}