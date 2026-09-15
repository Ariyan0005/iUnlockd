import { useEffect, useState } from "react";
import { useSEO } from "@/lib/seo";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShoppingBag, Search, Clock, CheckCircle2, XCircle, RefreshCw } from "lucide-react";

interface Order {
  id: number;
  serviceId: number;
  serviceName?: string;
  serviceType?: string;
  identifier: string;
  additionalInfo?: string;
  status: string;
  result?: string;
  price: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: typeof Clock }> = {
  pending:    { label: "Pending",    className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", icon: Clock },
  processing: { label: "Processing", className: "bg-blue-500/10 text-blue-600 border-blue-500/20",       icon: RefreshCw },
  completed:  { label: "Completed",  className: "bg-green-500/10 text-green-600 border-green-500/20",    icon: CheckCircle2 },
  failed:     { label: "Failed",     className: "bg-red-500/10 text-red-600 border-red-500/20",          icon: XCircle },
};

const TYPE_TABS = [
  { key: "imei",   label: "IMEI Service" },
  { key: "server", label: "Server Service" },
  { key: "tool",   label: "Remote / Rent" },
];

function orderNumber(id: number): string {
  return String(id).padStart(6, "0");
}

export default function Orders() {
  useSEO("My Orders — iUnlockd", "View and track all your unlock service orders.");
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const typeFilter = searchParams.get("type") ?? "";
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    setLoading(true);
    const token = localStorage.getItem("iu_token");
    const url = typeFilter ? `/api/orders?type=${encodeURIComponent(typeFilter)}` : "/api/orders";
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setOrders(Array.isArray(data) ? data : data.orders ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, navigate, typeFilter]);

  const filtered = orders.filter((o) => {
    const matchSearch =
      !search ||
      o.identifier.toLowerCase().includes(search.toLowerCase()) ||
      o.serviceName?.toLowerCase().includes(search.toLowerCase()) ||
      orderNumber(o.id).includes(search) ||
      String(o.id).includes(search);
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">My Orders</h1>
        <p className="text-muted-foreground text-sm mt-1">Track all your unlock service orders.</p>
      </div>

      {/* Service type filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              navigate(tab.key ? `/orders?type=${tab.key}` : "/orders");
              setStatusFilter("all");
              setSearch("");
            }}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              typeFilter === tab.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by IMEI, order number…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading orders…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 flex flex-col items-center gap-3 text-muted-foreground">
          <ShoppingBag className="w-12 h-12 opacity-30" />
          <p>{orders.length === 0 ? "No orders yet." : "No orders match your filters."}</p>
          {orders.length === 0 && (
            <Button variant="outline" onClick={() => navigate("/imei-services")}>
              Browse Services
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((order) => {
            const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
            const Icon = cfg.icon;
            return (
              <Card key={order.id} className="border-border hover:border-primary/30 transition-colors">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground font-mono">Order #{orderNumber(order.id)}</span>
                      {order.serviceType && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full capitalize">
                          {order.serviceType}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">
                        {order.serviceName ?? "Service"}
                      </span>
                      <Badge
                        variant="outline"
                        className={`${cfg.className} flex items-center gap-1 text-xs`}
                      >
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      {order.identifier}
                    </p>
                    {order.result && (
                      <div className="mt-1 px-3 py-2 bg-green-500/5 border border-green-500/20 rounded text-xs text-green-700">
                        <strong>Result:</strong> {order.result}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-bold text-primary">${parseFloat(order.price).toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
