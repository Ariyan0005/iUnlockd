import { useState, useEffect } from "react";
import { useSEO } from "@/lib/seo";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { ArrowLeft, Zap, MessageCircle, Shield } from "lucide-react";

function generateOrderId(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export default function AddFund() {
  useSEO("Add Funds — iUnlockd", "Add funds to your iUnlockd account balance.");
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useAuth();
  const locationState = location.state as { step?: "cart" | "method"; amount?: number; orderId?: string } | null;

  const [step, setStep] = useState<"cart" | "method">(locationState?.step ?? "cart");
  const [amount, setAmount] = useState(locationState?.amount ? String(locationState.amount) : "");
  const [orderId] = useState(() => locationState?.orderId ?? generateOrderId());
  const [error, setError] = useState("");
  const [manualLoading, setManualLoading] = useState(false);
  const [cryptoUnlocked, setCryptoUnlocked] = useState(false);
  const [cryptoSystemEnabled, setCryptoSystemEnabled] = useState(true);

  useEffect(() => {
    // Check global admin toggle (public endpoint, no auth needed)
    fetch("/api/crypto/config")
      .then(r => r.ok ? r.json() : { enabled: true })
      .then((d: { enabled: boolean }) => setCryptoSystemEnabled(d.enabled))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!token) return;
    let unlocked = false;
    // Check passkeys
    fetch("/api/user/passkey/list", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then((list: unknown[]) => { if (list.length > 0) unlocked = true; setCryptoUnlocked(unlocked); })
      .catch(() => {});
    // Check 2FA via profile
    fetch("/api/user/profile", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : {})
      .then((data: { totpEnabled?: boolean }) => { if (data.totpEnabled) setCryptoUnlocked(true); })
      .catch(() => {});
  }, [token]);

  if (!user) {
    navigate("/login", { state: { from: "/add-fund" } });
    return null;
  }

  const parsedAmount = parseFloat(amount) || 0;
  const QUICK_AMOUNTS = [10, 20, 30, 50, 100];

  const handleProcess = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!amount || parsedAmount < 10) {
      setError("Minimum deposit is $10.00");
      return;
    }
    setStep("method");
  };

  const handleManualPayment = async () => {
    setManualLoading(true);
    try {
      const res = await fetch("/api/user/manual-deposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: parsedAmount, orderId }),
      });
      const data = await res.json();
      const depositOrderId = data.orderId ?? orderId;
      navigate("/manual-payment", { state: { amount: parsedAmount, orderId: depositOrderId } });
    } catch {
      navigate("/manual-payment", { state: { amount: parsedAmount, orderId } });
    } finally {
      setManualLoading(false);
    }
  };

  if (step === "method") {
    return (
      <div className="max-w-md mx-auto px-4 py-6 flex flex-col min-h-[80vh]">
        <button
          onClick={() => setStep("cart")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="border border-gray-200 rounded-2xl p-6 mb-6">
          <p className="text-xs text-gray-400 font-mono mb-1">Order #{orderId}</p>
          <p className="text-lg font-bold text-gray-900 mb-3">Total Amount</p>
          <p className="text-4xl font-bold text-gray-900">${parsedAmount.toFixed(2)}</p>
        </div>

        <div className="flex flex-col gap-3">
          {!cryptoSystemEnabled ? (
            <div className="w-full rounded-2xl bg-gray-100 border border-gray-200 overflow-hidden cursor-not-allowed select-none">
              <div className="py-4 flex flex-col items-center gap-0.5 relative">
                <span className="flex items-center gap-2 text-gray-400 font-bold text-base">
                  <Zap className="w-5 h-5" /> Crypto Payment
                </span>
                <span className="text-xs font-medium text-gray-400 opacity-70">⏸ Temporarily Suspended</span>
                <span className="absolute top-2 right-3 text-[10px] font-bold bg-gray-400 text-white px-2 py-0.5 rounded-full">SUSPENDED</span>
              </div>
              <div className="border-t border-gray-200 px-4 py-2.5 flex items-center gap-2 bg-gray-50">
                <Shield className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <p className="text-xs text-gray-400">Crypto deposits temporarily unavailable. Please use manual payment.</p>
              </div>
            </div>
          ) : cryptoUnlocked ? (
            <button
              onClick={() => navigate("/deposit", { state: { amount: parsedAmount } })}
              className="w-full rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 overflow-hidden hover:border-amber-400 transition-colors text-left"
            >
              <div className="py-4 flex flex-col items-center gap-0.5 relative">
                <span className="flex items-center gap-2 text-gray-900 font-bold text-base">
                  Crypto Payment
                </span>
                <span className="text-xs font-medium text-gray-500">USDT · opBNB &amp; BEP20 · On-chain auto-detected</span>
                <span className="absolute top-2 right-3 text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full flex items-center gap-0.5">⚡ INSTANT</span>
              </div>
            </button>
          ) : (
            <div className="w-full rounded-2xl bg-gray-100 border border-gray-200 overflow-hidden cursor-not-allowed select-none">
              <div className="py-4 flex flex-col items-center gap-0.5 relative">
                <span className="flex items-center gap-2 text-gray-400 font-bold text-base">
                  <Zap className="w-5 h-5" /> Crypto Payment
                </span>
                <span className="text-xs font-medium text-gray-400 opacity-70">⏸ Temporarily Suspended</span>
                <span className="absolute top-2 right-3 text-[10px] font-bold bg-gray-400 text-white px-2 py-0.5 rounded-full">SUSPENDED</span>
              </div>
              <div className="border-t border-gray-200 px-4 py-2.5 flex items-center gap-2 bg-gray-50">
                <Shield className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <p className="text-xs text-gray-400">Requires Passkey or 2FA — enable in My Account → Profile &amp; Password</p>
              </div>
            </div>
          )}

          <button
            onClick={handleManualPayment}
            disabled={manualLoading}
            className="w-full py-4 rounded-2xl bg-slate-700 hover:bg-slate-600 disabled:opacity-60 text-white border border-slate-500 font-bold text-base transition-colors flex flex-col items-center gap-0.5"
          >
            <span className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              {manualLoading ? "Processing..." : "Manual Payment"}
            </span>
            <span className="text-xs font-medium opacity-70">Contact admin via WhatsApp</span>
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Your order will be processed after payment confirmation.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 flex flex-col">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-5"
      >
        <ArrowLeft className="w-4 h-4" /> Cart
      </button>

      <div className="mb-6">
        <p className="text-2xl font-bold text-gray-900">{user.name}</p>
        <p className="text-sm text-gray-500">{user.email}</p>
      </div>

      <div className="border-t border-gray-100 pt-5 mb-5">
        <p className="text-xl font-bold text-gray-900 mb-4">Items</p>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-500 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-base">Wallet Credits</p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-gray-900">
              {parsedAmount > 0 ? `$${parsedAmount.toFixed(2)}` : "$0.00"}
            </p>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">One Time</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleProcess} className="flex flex-col gap-4">
        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex flex-col gap-2 border-t border-gray-100 pt-4">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal</span>
            <span>${parsedAmount > 0 ? parsedAmount.toFixed(2) : "0.00"}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Transaction tax (0%)</span>
            <span>$0.00</span>
          </div>
          <div className="flex justify-between text-base font-bold text-gray-900 pt-1 border-t border-gray-100 mt-1">
            <span>Total</span>
            <span>${parsedAmount > 0 ? parsedAmount.toFixed(2) : "0.00"}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">
            Credits <span className="text-gray-400 font-normal">(Minimum $10)</span>
          </label>
          <input
            type="number"
            min="10"
            step="0.01"
            placeholder="Credits ( Minimum 10 )"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-gray-600 bg-white placeholder-gray-300"
          />
          <div className="flex gap-2 flex-wrap">
            {QUICK_AMOUNTS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setAmount(String(q))}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  amount === String(q)
                    ? "bg-gray-900 text-white border-gray-900"
                    : "border-gray-200 text-gray-600 hover:border-gray-400 bg-white"
                }`}
              >
                ${q}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            className="flex items-center gap-1.5 px-5 py-2.5 bg-gray-900 text-white font-semibold rounded-xl text-sm hover:bg-gray-800 transition-colors"
          >
            Process Payment →
          </button>
        </div>

        <div className="flex items-center justify-center gap-3 mt-1">
          <svg className="h-5 w-auto opacity-30" viewBox="0 0 38 24" fill="none"><rect width="38" height="24" rx="4" fill="#252525"/><circle cx="15" cy="12" r="7" fill="#EB001B"/><circle cx="23" cy="12" r="7" fill="#F79E1B"/><path d="M19 6.8a7 7 0 0 1 0 10.4A7 7 0 0 1 19 6.8z" fill="#FF5F00"/></svg>
          <svg className="h-5 w-auto opacity-30" viewBox="0 0 60 24" fill="none"><rect width="60" height="24" rx="4" fill="#1A1F71"/><text x="6" y="17" fontSize="12" fontWeight="bold" fill="#FFFFFF" fontFamily="Arial">VISA</text></svg>
          <svg className="h-5 w-auto opacity-30" viewBox="0 0 60 24" fill="none"><rect width="60" height="24" rx="4" fill="#009B77"/><text x="4" y="17" fontSize="9" fontWeight="bold" fill="#FFFFFF" fontFamily="Arial">PayPal</text></svg>
          <div className="px-2 py-0.5 bg-gray-200 rounded text-xs font-bold text-gray-500 opacity-60">USDT</div>
        </div>
      </form>
    </div>
  );
}
