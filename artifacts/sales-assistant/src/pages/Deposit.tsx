import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Wallet,
  CheckCircle2,
  AlertCircle,
  Copy,
  Loader2,
  TriangleAlert,
  ChevronDown,
  Clock,
  ArrowLeft,
} from "lucide-react";

interface CryptoOrder {
  id: number;
  amount: string;
  invoiceAmount?: string;
  payableAmount?: string;
  walletAddress: string;
  network: string;
  status: string;
  txHash: string | null;
  expiresAt: string | null;
}

const NETWORKS = [
  { key: "opbnb", label: "opBNB", description: "BNB Chain Layer 2" },
  { key: "bsc", label: "BEP20", description: "BNB Smart Chain" },
] as const;

const QUICK_AMOUNTS = [10, 20, 30, 50, 100];

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00";
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function generateOrderNumber(id: number): string {
  return String(id).padStart(6, "0");
}

export default function Deposit() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const prefillAmount = (location.state as { amount?: number } | null)?.amount;

  const [network, setNetwork] = useState<"opbnb" | "bsc">("opbnb");
  const [networkOpen, setNetworkOpen] = useState(false);
  const [amount, setAmount] = useState(prefillAmount ? String(prefillAmount) : "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<CryptoOrder | null>(null);
  const [done, setDone] = useState(false);
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [copiedAmt, setCopiedAmt] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const token = localStorage.getItem("iu_token");

  const checkStatus = useCallback(async (orderId: number) => {
    try {
      const res = await fetch(`/api/crypto/status/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      return data.status as string;
    } catch {
      return null;
    }
  }, [token]);

  useEffect(() => {
    if (!order || done) return;
    const interval = setInterval(async () => {
      setPollCount((c) => c + 1);
      const status = await checkStatus(order.id);
      if (status === "completed") {
        clearInterval(interval);
        const res = await fetch(`/api/crypto/status/${order.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setOrder(data);
        setDone(true);
        await refreshUser();
        setTimeout(() => navigate("/"), 3000);
      } else if (status === "rejected") {
        clearInterval(interval);
        setOrder(null);
        setError("Payment window expired. Please create a new order.");
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [order, done, checkStatus, token, refreshUser, navigate]);

  useEffect(() => {
    if (!order || done || !order.expiresAt) return;
    const update = () => {
      const left = new Date(order.expiresAt!).getTime() - Date.now();
      setTimeLeft(left > 0 ? left : 0);
      if (left <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        setOrder(null);
        setError("Payment window expired. Please create a new order.");
      }
    };
    update();
    timerRef.current = setInterval(update, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [order, done]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center flex flex-col items-center gap-4">
        <Wallet className="w-12 h-12 text-muted-foreground opacity-40" />
        <h2 className="text-xl font-bold">Login Required</h2>
        <p className="text-muted-foreground text-sm">Please sign in to add funds.</p>
        <Button onClick={() => navigate("/login", { state: { from: "/deposit" } })}>Sign In</Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt < 10) {
      setError("Minimum deposit is $10 USDT");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/crypto/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: amt, network }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to create order"); return; }
      setOrder(data);
      setPollCount(0);
      setDone(false);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyAddr = async () => {
    if (!order?.walletAddress) return;
    await navigator.clipboard.writeText(order.walletAddress);
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 2000);
  };

  const copyAmt = async () => {
    if (!order?.payableAmount && !order?.amount) return;
    await navigator.clipboard.writeText(order.payableAmount ?? order.amount);
    setCopiedAmt(true);
    setTimeout(() => setCopiedAmt(false), 1500);
  };

  const selectedNetwork = NETWORKS.find(n => n.key === network)!;

  // ── Confirmed screen ──
  if (done && order) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <p className="text-xs text-muted-foreground font-mono">Order #{generateOrderNumber(order.id)}</p>
        <h2 className="text-2xl font-bold">Payment Confirmed!</h2>
        <p className="text-muted-foreground text-sm">
          <strong>${order.amount} USDT</strong> credited to your account.
        </p>
        {order.txHash && (
          <p className="text-xs text-muted-foreground break-all bg-muted px-3 py-2 rounded-md max-w-xs">
            TX: {order.txHash}
          </p>
        )}
        <p className="text-xs text-muted-foreground">Redirecting to home...</p>
        <div className="flex gap-3 mt-2">
          <Button onClick={() => navigate("/")}>Go Home</Button>
          <Button variant="outline" onClick={() => navigate("/my-deposits")}>Fund History</Button>
        </div>
      </div>
    );
  }

  // ── Waiting for payment screen ──
  if (order) {
    const urgentTime = timeLeft !== null && timeLeft < 2 * 60 * 1000;

    return (
      <div className="max-w-xl mx-auto px-4 py-8 flex flex-col gap-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-mono mb-1">← Order #{generateOrderNumber(order.id)}</p>
            <h1 className="text-2xl font-bold">Send USDT Payment</h1>
          </div>
          {timeLeft !== null && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-mono font-bold border ${urgentTime ? "bg-red-50 border-red-300 text-red-700 dark:bg-red-950/30 dark:border-red-700 dark:text-red-400" : "bg-muted border-border text-foreground"}`}>
              <Clock className="w-3.5 h-3.5" />
              {formatCountdown(timeLeft)}
            </div>
          )}
        </div>

        <Card className="border-border bg-primary/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Wallet className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Current Balance</p>
              <p className="text-lg font-bold text-primary">${parseFloat(user.balance).toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-start gap-3 bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-800 rounded-lg px-4 py-3">
          <TriangleAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm text-red-700 dark:text-red-400">Only use {order.network === "bsc" ? "Binance Smart Chain (BEP20)" : order.network} Network</p>
            <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">
              Sending from any other network will result in <strong>permanent loss of funds</strong>.
            </p>
          </div>
        </div>

        <Card className="border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">
              Deposit Address — {order.network === "bsc" ? "Binance Smart Chain" : order.network} Network
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-3 border border-border">
              <code className="text-sm font-mono flex-1 break-all select-all leading-relaxed">
                {order.walletAddress}
              </code>
              <Button type="button" variant="ghost" size="sm" className="shrink-0 h-8 w-8 p-0" onClick={copyAddr}>
                {copiedAddr ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>

            <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-3">
              <div>
                <p className="text-xs text-muted-foreground">Exact Amount to Send</p>
                <p className="text-2xl font-bold">${order.payableAmount ?? order.amount} <span className="text-sm font-normal text-muted-foreground">USDT</span></p>
              </div>
              <Button variant="ghost" size="sm" onClick={copyAmt} className="text-xs gap-1">
                {copiedAmt ? <CheckCircle2 className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                Copy
              </Button>
            </div>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-dashed border-amber-300 dark:border-amber-700 rounded px-2.5 py-1.5 mt-1">⚠️ Please send the exact amount shown above. This includes our $0.10 fee. Your account will be credited with ${order.amount} USDT after deduction.</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4 flex items-start gap-3">
            <span className="relative flex h-5 w-5 shrink-0 mt-0.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-5 w-5 bg-green-500"></span></span>
            <div>
              <p className="font-semibold text-sm">Waiting for payment on {order.network === "bsc" ? "Binance Smart Chain" : order.network}...</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Smart detection active — your payment will be confirmed automatically.
                
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => navigate("/my-deposits")}>
            Fund History
          </Button>
          <Button variant="outline" className="flex-1 border-2 border-red-200 hover:border-red-400 hover:bg-red-50 text-red-600 font-semibold" onClick={() => { setOrder(null); setAmount(""); setPollCount(0); setTimeLeft(null); }}>
            Cancel / Start Over
          </Button>
        </div>
      </div>
    );
  }

  // ── Amount entry screen ──
  return (
    <div className="max-w-xl mx-auto px-4 py-8 flex flex-col gap-5">
      <div>
        <button
          onClick={() => navigate("/add-fund")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Add Fund
        </button>
        <h1 className="text-2xl font-bold">Crypto Payment</h1>
        <p className="text-muted-foreground text-sm mt-1">USDT deposit — auto-verified on blockchain.</p>
      </div>

      <Card className="border-border bg-primary/5">
        <CardContent className="p-4 flex items-center gap-3">
          <Wallet className="w-5 h-5 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Current Balance</p>
            <p className="text-xl font-bold text-primary">${parseFloat(user.balance).toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">Deposit USDT</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label>Select Network</Label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNetworkOpen(o => !o)}
                  className="w-full flex items-center justify-between px-3 py-2.5 border border-border rounded-md bg-background text-sm hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="font-medium">{selectedNetwork.label}</span>
                    <span className="text-muted-foreground text-xs">{selectedNetwork.description}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${networkOpen ? "rotate-180" : ""}`} />
                </button>
                {networkOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-20 overflow-hidden">
                    {NETWORKS.map(n => (
                      <button
                        key={n.key}
                        type="button"
                        onClick={() => { setNetwork(n.key); setNetworkOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-accent transition-colors text-left ${network === n.key ? "bg-primary/10 text-primary" : ""}`}
                      >
                        <div className={`w-2 h-2 rounded-full ${network === n.key ? "bg-primary" : "bg-green-500"}`} />
                        <div>
                          <p className="font-medium">{n.label}</p>
                          <p className="text-xs text-muted-foreground">{n.description}</p>
                        </div>
                        {network === n.key && <CheckCircle2 className="w-4 h-4 ml-auto text-primary" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="amount">Amount (USDT)</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="10"
                  placeholder="Minimum deposit $10"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pr-16"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">USDT</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {QUICK_AMOUNTS.map(q => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setAmount(String(q))}
                    className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors ${amount === String(q) ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground bg-background"}`}
                  >
                    ${q}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-sm text-muted-foreground border border-border rounded-md p-3 bg-muted/40 flex flex-col gap-2">
              <p className="font-medium text-foreground">How it works</p>
              <ol className="flex flex-col gap-1.5 list-none">
                {[
                  "Select network & enter amount, then click Deposit.",
                  "You receive the wallet address for chosen network.",
                  "Send USDT on the selected network only.",
                  "Payment auto-detected — balance credited instantly.",
                ].map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating order...</>
                : <><Wallet className="w-4 h-4 mr-2" /> Deposit USDT ({selectedNetwork.label})</>}
            </Button>

            <div className="text-center">
              <button type="button" onClick={() => navigate("/my-deposits")} className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline">
                View fund history
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
