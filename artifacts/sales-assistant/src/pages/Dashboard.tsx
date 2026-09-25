import { useEffect, useState } from "react";
import { useSEO } from "@/lib/seo";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wallet, ShoppingBag, Clock, CheckCircle2, XCircle,
  Smartphone, Server, ArrowRight, Lock, TrendingUp, ListOrdered,
  PlusCircle, RotateCw,
} from "lucide-react";

interface Order {
  id: number;
  serviceName?: string;
  identifier: string;
  status: string;
  price: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending:    { label: "Pending",    color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", icon: Clock },
  processing: { label: "In Process", color: "bg-blue-500/10 text-blue-600 border-blue-500/20",     icon: RotateCw },
  completed:  { label: "Completed",  color: "bg-green-500/10 text-green-600 border-green-500/20",   icon: CheckCircle2 },
  failed:     { label: "Rejected",   color: "bg-red-500/10 text-red-600 border-red-500/20",         icon: XCircle },
  cancelled:  { label: "Cancelled",  color: "bg-red-500/10 text-red-600 border-red-500/20",         icon: XCircle },
};

export default function Dashboard() {
  useSEO("Dashboard — iUnlockd", "Manage your unlock orders and account from your iUnlockd dashboard.");
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem("iu_token");
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    fetch("/api/orders?limit=200", { headers: { Authorization: `Bearer ${token}` }, signal: ctrl.signal })
      .then(r => r.json())
      .then(d => setOrders(Array.isArray(d) ? d : d.orders ?? []))
      .catch(() => setOrders([]))
      .finally(() => { clearTimeout(timer); setLoading(false); });
    return () => { ctrl.abort(); clearTimeout(timer); };
  }, [user]);

  const totalOrders  = orders.length;
  const inProcess    = orders.filter(o => o.status === "processing");
  const pending      = orders.filter(o => o.status === "pending");
  const rejected     = orders.filter(o => o.status === "failed" || o.status === "cancelled");
  const completed    = orders.filter(o => o.status === "completed");
  const lockedAmount = inProcess.reduce((s, o) => s + parseFloat(o.price), 0);
  const usedCredit   = completed.reduce((s, o) => s + parseFloat(o.price), 0);

  const recentOrders = [...orders].sort((a, b) => b.id - a.id).slice(0, 5);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Welcome back, {user?.name}!</p>
      </div>

      {/* Current Balance */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
          <Wallet className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Current Balance</p>
          <p className="text-3xl font-bold text-primary">${parseFloat(user?.balance ?? "0").toFixed(2)}</p>
        </div>
        <Button onClick={() => navigate("/add-fund")} className="shrink-0 gap-1.5">
          <PlusCircle className="w-4 h-4" /> Add Funds
        </Button>
      </div>

      {/* Row 1 stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={ListOrdered} iconColor="text-gray-600"   bgColor="bg-gray-100"   label="Total Orders" value={totalOrders} />
        <StatCard icon={RotateCw}    iconColor="text-blue-600"   bgColor="bg-blue-100"   label="In Process"   value={inProcess.length} />
        <StatCard icon={Clock}       iconColor="text-yellow-600" bgColor="bg-yellow-100" label="Pending"      value={pending.length} />
      </div>

      {/* Row 2 stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={XCircle}    iconColor="text-red-500"    bgColor="bg-red-100"    label="Rejected"     value={rejected.length} />
        <StatCard icon={Lock}       iconColor="text-orange-600" bgColor="bg-orange-100" label="Locked Amt"   value={`$${lockedAmount.toFixed(2)}`} />
        <StatCard icon={TrendingUp} iconColor="text-green-600"  bgColor="bg-green-100"  label="Used Credit"  value={`$${usedCredit.toFixed(2)}`} />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Button size="lg" className="h-12" onClick={() => navigate("/imei-services")}>
          <Smartphone className="w-4 h-4 mr-2" /> IMEI Services
        </Button>
        <Button size="lg" variant="outline" className="h-12" onClick={() => navigate("/server-services")}>
          <Server className="w-4 h-4 mr-2" /> Server Services
        </Button>
        <Button size="lg" variant="outline" className="h-12" onClick={() => navigate("/orders")}>
          <ShoppingBag className="w-4 h-4 mr-2" /> My Orders
        </Button>
      </div>

      {/* Recent orders */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <p className="font-semibold text-base">Recent Orders</p>
          <button
            onClick={() => navigate("/orders")}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View All <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">Loading…</div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No orders yet</p>
              <Button variant="link" size="sm" onClick={() => navigate("/imei-services")}>Browse services</Button>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {recentOrders.map((order) => {
                const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
                const Icon = cfg.icon;
                return (
                  <div key={order.id} className="py-3.5 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{order.serviceName ?? `Order #${order.id}`}</p>
                      <p className="text-xs text-muted-foreground truncate">{order.identifier}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-semibold">${parseFloat(order.price).toFixed(2)}</span>
                      <Badge variant="outline" className={`${cfg.color} flex items-center gap-1 text-xs`}>
                        <Icon className="w-3 h-3" /> {cfg.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon, iconColor, bgColor, label, value,
}: { icon: React.ElementType; iconColor: string; bgColor: string; label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-2">
      <div className={`w-9 h-9 rounded-xl ${bgColor} flex items-center justify-center`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground leading-tight">{label}</p>
        <p className="text-xl font-bold leading-tight">{value}</p>
      </div>
    </div>
  );
}
