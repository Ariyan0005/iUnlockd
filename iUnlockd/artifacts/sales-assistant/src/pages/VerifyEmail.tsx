import { useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import Logo from "@/components/Logo";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const email = searchParams.get("email") ?? "";
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length > 0) {
      const next = [...otp];
      text.split("").forEach((ch, i) => { if (i < 6) next[i] = ch; });
      setOtp(next);
      inputs.current[Math.min(text.length, 5)]?.focus();
    }
    e.preventDefault();
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== 6) { setError("Please enter the 6-digit code"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token: code }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Invalid or expired code"); return; }
      if (data.token && data.user) {
        login(data.token, data.user);
        navigate("/dashboard");
      } else {
        navigate("/login");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError("");
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      let countdown = 60;
      setResendCountdown(countdown);
      const timer = setInterval(() => {
        countdown--;
        setResendCountdown(countdown);
        if (countdown <= 0) clearInterval(timer);
      }, 1000);
    } finally {
      setResending(false);
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <p className="text-gray-500 text-sm">No email found. Please register again.</p>
        <button
          onClick={() => navigate("/register")}
          className="mt-4 px-5 py-3 bg-black text-white text-sm font-semibold rounded-xl hover:bg-gray-900 transition-colors"
        >
          Register
        </button>
      </div>
    );
  }

  const otpComplete = otp.join("").length === 6;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col px-6 pt-10 pb-8 max-w-md mx-auto w-full">
        <div className="mb-8">
          <Logo size="lg" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          Verify your email ✉️
        </h1>
        <p className="text-sm text-gray-500 mb-1">
          Account activation code sent to your email address:
        </p>
        <p className="text-sm font-medium text-gray-800 mb-8">
          {email}{" "}
          <button
            onClick={() => navigate("/register")}
            className="text-gray-500 underline text-xs ml-1 hover:text-gray-700"
          >
            - Change Email
          </button>
        </p>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4 text-center">
            {error}
          </p>
        )}

        <p className="text-sm text-gray-600 mb-3">Type your 6 digit verify code</p>

        {/* OTP boxes */}
        <div className="flex gap-1.5 mb-6" onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={el => { inputs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleOtpChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className="flex-1 min-w-0 h-12 text-center text-lg font-bold border border-gray-300 rounded-xl bg-white focus:border-gray-700 focus:ring-2 focus:ring-gray-200 outline-none transition-colors"
            />
          ))}
        </div>

        <button
          onClick={handleVerify}
          disabled={loading || !otpComplete}
          className="w-full py-3.5 bg-gray-200 text-gray-600 font-semibold rounded-xl text-sm transition-colors disabled:cursor-not-allowed enabled:bg-black enabled:text-white enabled:hover:bg-gray-900"
        >
          {loading ? "Verifying…" : "Verify"}
        </button>

        <div className="text-center mt-4">
          {resendCountdown > 0 ? (
            <p className="text-sm text-gray-400">Resend OTP After {resendCountdown} Second</p>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium hover:underline disabled:opacity-50"
            >
              {resending ? "Sending…" : "Resend OTP"}
            </button>
          )}
        </div>
      </div>

      <div className="text-center pb-6">
        <button
          onClick={() => navigate("/login")}
          className="text-xs text-gray-400 hover:text-gray-600 hover:underline"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
