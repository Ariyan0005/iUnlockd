import { useEffect, useState } from "react";
import { useSEO } from "@/lib/seo";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Wrench, Clock, ArrowRight } from "lucide-react";

interface Service {
  id: number;
  name: string;
  description: string;
  price: string;
  processingTime: string;
  serviceType: string;
  category: string;
  isActive: boolean;
}

export default function ToolRent() {
  useSEO("Remote & Rent Services — Professional Unlock Tools | iUnlockd", "Rent professional unlock tools or access remote services. Flexible plans for technicians and resellers.");
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [filtered, setFiltered] = useState<Service[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/services?type=tool_rent")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.services ?? [];
        setServices(list);
        setFiltered(list);
      })
      .catch(() => setError("Failed to load services"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      services.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q) ||
          s.category?.toLowerCase().includes(q)
      )
    );
  }, [search, services]);

  const categories = [...new Set(filtered.map((s) => s.category).filter(Boolean))];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Wrench className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Remote / Rent Service</h1>
        </div>
        <p className="text-muted-foreground">
          Rent professional unlock tools or book a remote session with our experts.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search services…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && (
        <div className="text-center py-16 text-muted-foreground">Loading services…</div>
      )}
      {error && (
        <div className="text-center py-16 text-destructive">{error}</div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Wrench className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No tool rent services found{search ? ` for "${search}"` : ""}.</p>
        </div>
      )}

      {categories.map((cat) => (
        <div key={cat} className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold capitalize">{cat}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered
              .filter((s) => s.category === cat)
              .map((service) => (
                <ServiceCard key={service.id} service={service} onSelect={() => navigate(`/services/${service.id}`)} />
              ))}
          </div>
        </div>
      ))}

      {!loading && !error && categories.length === 0 && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((service) => (
            <ServiceCard key={service.id} service={service} onSelect={() => navigate(`/services/${service.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ServiceCard({ service, onSelect }: { service: Service; onSelect: () => void }) {
  return (
    <Card
      className="border-border hover:border-primary/40 cursor-pointer transition-all hover:shadow-md group"
      onClick={onSelect}
    >
      <CardContent className="p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors">
            {service.name}
          </h3>
          {service.category && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              {service.category}
            </Badge>
          )}
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
  );
}
