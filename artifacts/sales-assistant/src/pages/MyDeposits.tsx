import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, History, ExternalLink, Loader2, Plus, RefreshCw } from "lucide-react";

interface Deposit {
  id: number;
  amount: string;
  network: string;
  method: string;
  status: "pending" | "processing" | "completed" | "rejected";
  txHash: string | null;
  expiresAt: string | null;
  createdAt: string;
}

const STATUS_CONFIG = {
  pending:    { label: "Pending",            variant: "secondary" as const, dot: "bg-yellow-500" },
  processing: { label: "Processing",         variant: "secondary" as const, dot: "bg-blue-500" },
  completed:  { label: "Paid / Confirmed",   variant: "default" as const,   dot: "bg-green-500" },
  rejected:   { label: "Cancelled",          variant: "destructive" as const, dot: "bg-red-500" },
};

function networkExplorerUrl(txHash: string, network: string): string {
  if (network === "Plasma") return `https://plasma-explorer.example.com/tx/${txHash}`;
  return `https://opbnbscan.com/tx/${txHash}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function getRemainingTime(expiresAt: string | null, status: string): string | null {
  if (status !== "pending" || !expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const min = Math.floor(diff / 60000);
  const sec = Math.floor((diff % 60000) / 1000);
  return `${min}m ${sec}s remaining`;
}

function orderNumber(id: number): string {
  return String(id).padStart(6, "0");
}

export default function MyDeposits() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const token = localStorage.getItem("iu_token");

  const fetchDeposits = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const res = await fetch("/api/crypto/my-deposits", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setDeposits(await res.json());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { if (user) fetchDeposits(); }, [user]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center flex flex-col items-center gap-4">
        <History className="w-12 h-12 text-muted-foreground opacity-40" />
        <h2 className="text-xl font-bold">Login Required</h2>
        <p className="text-muted-foreground text-sm">Please sign in to view your fund history.</p>
        <Button onClick={() => navigate("/login", { state: { from: "/my-deposits" } })}>Sign In</Button>
      </div>
    );
  }

  const totalConfirmed = deposits.filter(d => d.status === "completed").reduce((s, d) => s + parseFloat(d.amount), 0);
  const pending = deposits.filter(d => d.status === "pending").length;
  const cancelled = deposits.filter(d => d.status === "rejected").length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Fund History</h1>
          <p className="text-muted-foreground text-sm mt-0.5">All your USDT fund orders</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => fetchDeposits(true)} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
          <Button size="sm" onClick={() => navigate("/add-fund")}>
            <Plus className="w-4 h-4 mr-1" /> Add Fund
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border bg-primary/5">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Total Confirmed</p>
            <p className="text-lg font-bold text-primary">${totalConfirmed.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Pending</p>
            <p className={`text-lg font-bold ${pending > 0 ? "text-yellow-600" : ""}`}>{pending}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Cancelled</p>
            <p className={`text-lg font-bold ${cancelled > 0 ? "text-red-500" : ""}`}>{cancelled}</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
        </div>
      ) : deposits.length === 0 ? (
        <div className="text-center py-16 flex flex-col items-center gap-4">
          <Wallet className="w-12 h-12 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground text-sm">No fund history yet.</p>
          <Button onClick={() => navigate("/add-fund")}>Add Your First Funds</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {deposits.map((dep) => {
            const cfg = STATUS_CONFIG[dep.status] ?? STATUS_CONFIG.pending;
            const remaining = getRemainingTime(dep.expiresAt, dep.status);
            return (
              <Card key={dep.id} className="border-border hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground font-mono">Order #{orderNumber(dep.id)}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg font-bold">${dep.amount} USDT</span>
                        <Badge variant={cfg.variant} className="text-xs gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} inline-block`} />
                          {cfg.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{dep.network}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{formatDate(dep.createdAt)}</p>
                      {remaining && (
                        <p className="text-xs font-medium text-yellow-600">{remaining}</p>
                      )}
                      {dep.txHash && (
                        <a
                          href={networkExplorerUrl(dep.txHash, dep.network)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1 font-mono truncate max-w-[240px]"
                        >
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          {dep.txHash.slice(0, 18)}...{dep.txHash.slice(-6)}
                        </a>
                      )}
                    </div>
                    {dep.status === "pending" && (dep.method === "manual" || !dep.expiresAt || new Date(dep.expiresAt) > new Date()) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 text-xs"
                        onClick={() => {
                          if (dep.method === "manual") {
                            navigate("/manual-payment", { state: { amount: parseFloat(dep.amount), orderId: String(dep.id) } });
                          } else {
                            navigate("/deposit", { state: { amount: parseFloat(dep.amount) } });
                          }
                        }}
                      >
                        Pay Now
                      </Button>
                    )}
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
