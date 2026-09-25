import { useCallback, useEffect, useMemo, useState } from "react";
import { useSEO } from "@/lib/seo";
import { getServicePath } from "@/lib/serviceUrl";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Layers3,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Wrench,
  X,
} from "lucide-react";

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

function formatPrice(price: string) {
  const amount = Number.parseFloat(price);
  return Number.isFinite(amount) ? `$${amount.toFixed(2)}` : "View pricing";
}

export type ToolCatalogMode = "rent" | "activation";

const CATALOG_CONFIG = {
  rent: {
    title: "Tool Rent Services",
    seoTitle: "Tool Rent Services — iUnlockd",
    seoDescription: "Browse live tool rental services available through the iUnlockd service catalog.",
    eyebrow: "Temporary technician access",
    description: "Browse live tool rental services for short-term technician workflows and device jobs.",
    searchPlaceholder: "Search tool rentals or categories",
    emptyTitle: "No rent services listed yet",
    emptyDescription: "Rent-related services will appear here when they are available.",
    emptySearchDescription: "No rental results for",
    apiType: "tool_rent",
  },
  activation: {
    title: "Tool Activation & Credits",
    seoTitle: "Tool Activation & Credits — iUnlockd",
    seoDescription: "Access technician tool activations and credits through the iUnlockd service catalog.",
    eyebrow: "Technician access",
    description: "Put the right tool capability on your desk. Browse live activations and credit access for technician and reseller workflows.",
    searchPlaceholder: "Search activations, credits, or categories",
    emptyTitle: "No tool access listed yet",
    emptyDescription: "Live activations and credits will appear here when they are available.",
    emptySearchDescription: "No results for",
    apiType: "tool",
  },
} as const;

export function ToolCatalog({ mode }: { mode: ToolCatalogMode }) {
  const config = CATALOG_CONFIG[mode];
  useSEO(
    config.seoTitle,
    config.seoDescription
  );
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadServices = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/services?type=${config.apiType}`);
      if (!response.ok) throw new Error("Unable to load tool access");
      const data = await response.json();
      const list = Array.isArray(data) ? data : data.services ?? [];
      setServices(list);
    } catch {
      setError("Tool access is temporarily unavailable. Try loading the catalog again.");
    } finally {
      setLoading(false);
    }
  }, [config.apiType]);

  useEffect(() => {
    void loadServices();
  }, [loadServices]);

  const categories = useMemo(
    () => [...new Set(services.map((service) => service.category).filter(Boolean))],
    [services]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return services.filter((service) => {
      const matchesCategory = category === "All" || service.category === category;
      const matchesSearch = !query || [service.name, service.description, service.category]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [category, search, services]);

  const grouped = useMemo(() => {
    if (category !== "All") return [[category, filtered] as const];
    const groups = new Map<string, Service[]>();
    filtered.forEach((service) => {
      const group = service.category || "Available tools";
      groups.set(group, [...(groups.get(group) ?? []), service]);
    });
    return [...groups.entries()];
  }, [category, filtered]);

  return (
    <div className="min-h-[70vh] px-4 pb-20 pt-8 md:pt-12">
      <div className="mx-auto max-w-7xl">
        <section className="surface-navy relative overflow-hidden rounded-[1.75rem] px-6 py-9 shadow-[0_24px_60px_hsl(222_47%_14%/.16)] md:px-10 md:py-12">
          <div className="signal-grid pointer-events-none absolute inset-0 opacity-50" />
          <div className="relative grid gap-9 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-200">
                  <Wrench className="h-5 w-5" />
                </div>
                 <p className="font-mono text-xs font-semibold uppercase tracking-[.22em] text-blue-200/75">{config.eyebrow}</p>
              </div>
               <h1 className="mt-6 max-w-2xl font-display text-4xl font-semibold tracking-[-.04em] text-white md:text-6xl">{config.title}</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-blue-100/70 md:text-lg">
                 {config.description}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:w-72">
              <div className="rounded-2xl border border-white/10 bg-white/[.06] p-4">
                <Layers3 className="h-4 w-4 text-cyan-200" />
                <p className="mt-4 text-sm font-medium text-white">Live catalog</p>
                <p className="mt-1 text-xs text-blue-100/55">Pulled from services</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[.06] p-4">
                <CheckCircle2 className="h-4 w-4 text-emerald-200" />
                <p className="mt-4 text-sm font-medium text-white">Clear access</p>
                <p className="mt-1 text-xs text-blue-100/55">Details before order</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-card p-4 shadow-sm md:flex-row md:items-center">
          <div className="relative min-w-0 flex-1 md:max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              data-testid="input-search-tool-services"
              aria-label="Search tool activation and credit services"
               placeholder={config.searchPlaceholder}
              className="h-11 border-slate-200 bg-slate-50/70 pl-9 pr-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {search && (
              <button data-testid="button-clear-tool-search" type="button" aria-label="Clear search" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-slate-400" />
            <button data-testid="button-category-all" type="button" onClick={() => setCategory("All")} className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${category === "All" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700"}`}>All</button>
            {categories.map((item) => (
              <button data-testid={`button-category-${item}`} key={item} type="button" onClick={() => setCategory(item)} className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold capitalize transition-colors ${category === item ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700"}`}>
                {item}
              </button>
            ))}
          </div>
        </section>

        {loading && (
          <div data-testid="status-loading-tool-services" className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="h-52 animate-pulse rounded-2xl border border-slate-200 bg-slate-100/80" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div data-testid="status-tool-services-error" className="mx-auto mt-16 max-w-md rounded-2xl border border-red-200 bg-red-50 p-7 text-center">
            <p className="font-semibold text-red-950">Catalog unavailable</p>
            <p className="mt-2 text-sm leading-6 text-red-800/70">{error}</p>
            <Button data-testid="button-retry-tool-services" variant="outline" className="mt-5 border-red-200 bg-red-50 text-red-800 hover:bg-red-100" onClick={() => void loadServices()}>
              <RefreshCw className="mr-2 h-4 w-4" /> Try again
            </Button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div data-testid="status-tool-services-empty" className="mx-auto mt-16 max-w-lg rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700"><Wrench className="h-6 w-6" /></div>
             <h2 className="mt-5 font-display text-2xl font-semibold text-slate-950">{services.length === 0 ? config.emptyTitle : "No matching services"}</h2>
             <p className="mt-2 text-sm leading-6 text-slate-500">{services.length === 0 ? config.emptyDescription : `${config.emptySearchDescription} ${search ? `"${search}"` : "this category"}. Try a different search or category.`}</p>
            {(search || category !== "All") && <Button data-testid="button-reset-tool-filters" variant="outline" className="mt-5" onClick={() => { setSearch(""); setCategory("All"); }}>Reset filters</Button>}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="mt-10 space-y-10">
            {grouped.map(([group, items]) => (
              <section key={group}>
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-blue-600">Catalog group</p>
                    <h2 className="mt-1 font-display text-2xl font-semibold capitalize text-slate-950">{group}</h2>
                  </div>
                  <span className="text-xs font-medium text-slate-500">{items.length} {items.length === 1 ? "service" : "services"}</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((service) => (
                    <ServiceCard key={service.slug} service={service} onSelect={() => navigate(getServicePath(service.serviceType, service.slug))} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ToolRent() {
  return <ToolCatalog mode="rent" />;
}

function ServiceCard({ service, onSelect }: { service: Service; onSelect: () => void }) {
  return (
    <button data-testid={`button-tool-service-${service.slug}`} type="button" onClick={onSelect} className="group block w-full text-left">
      <Card className="interactive-lift h-full border-slate-200 bg-card shadow-sm group-hover:border-blue-300 group-hover:shadow-lg">
        <CardContent className="flex h-full flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 transition-colors group-hover:bg-blue-600 group-hover:text-white">
              <Wrench className="h-5 w-5" />
            </div>
            {service.category && <Badge variant="secondary" className="shrink-0 bg-slate-100 text-[10px] font-semibold capitalize text-slate-600">{service.category}</Badge>}
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold leading-snug text-slate-950 group-hover:text-blue-700">{service.name}</h3>
            {service.description && <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">{service.description}</p>}
          </div>
          <div className="mt-auto flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Clock3 className="h-3.5 w-3.5 text-blue-600" />
              {service.processingTime || "Timing varies"}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display text-lg font-semibold text-blue-700">{formatPrice(service.price)}</span>
              <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}