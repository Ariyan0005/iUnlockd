import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import Logo from "@/components/Logo";

type Step = "email" | "reset";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [resending, setResending] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCountdown = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setResendCountdown(60);
    let t = 60;
    timerRef.current = setInterval(() => {
      t--;
      setResendCountdown(t);
      if (t <= 0 && timerRef.current) clearInterval(timerRef.current);
    }, 1000);
  };

  useEffect(() => {
    if (step === "reset") startCountdown();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [step]);

  const handleResend = async () => {
    setResending(true);
    setError("");
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      startCountdown();
    } finally {
      setResending(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-gray-600 bg-white placeholder-gray-400";

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to send reset code.");
        return;
      }
      setStep("reset");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!otp.trim()) { setError("Please enter the verification code."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token: otp, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Reset failed.");
        return;
      }
      navigate("/login", { state: { message: "Password reset successful. Please sign in." } });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col px-6 pt-10 pb-8 max-w-md mx-auto w-full">
        <div className="mb-8">
          <Logo size="lg" showText={false} />
        </div>

        {step === "email" ? (
          <>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Forgot Password?</h1>
            <p className="text-gray-500 text-sm mb-8">
              Enter your email and we'll send you a reset code.
            </p>
            <form onSubmit={handleSendOtp} className="flex flex-col gap-5">
              {error && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
              )}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">E-Mail</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className={inputClass}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-black text-white font-semibold rounded-xl text-sm hover:bg-gray-900 transition-colors disabled:opacity-60"
              >
                {loading ? "Sending…" : "Send Reset Code"}
              </button>
              <Link
                to="/login"
                className="flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-3 h-3" /> Back to Login
              </Link>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Reset Password</h1>
            <p className="text-gray-500 text-sm mb-8">
              Enter the code sent to <span className="font-medium text-gray-700">{email}</span> and your new password.
            </p>
            <form onSubmit={handleReset} className="flex flex-col gap-5">
              {error && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
              )}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Verification Code</label>
                <input
                  type="text"
                  placeholder="6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className={`${inputClass} tracking-widest text-center text-lg`}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">New Password</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className={`${inputClass} ${confirmPassword && confirmPassword !== password ? "border-red-400" : ""}`}
                />
                {confirmPassword && confirmPassword !== password && (
                  <p className="text-xs text-red-500">Passwords do not match</p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-black text-white font-semibold rounded-xl text-sm hover:bg-gray-900 transition-colors disabled:opacity-60"
              >
                {loading ? "Resetting…" : "Reset Password"}
              </button>

              {/* Resend OTP with countdown */}
              <div className="text-center">
                {resendCountdown > 0 ? (
                  <p className="text-sm text-gray-400">
                    Resend code in <span className="font-semibold text-gray-600">{resendCountdown}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="text-sm text-gray-600 hover:text-gray-900 font-medium underline underline-offset-2 disabled:opacity-50 transition-colors"
                  >
                    {resending ? "Sending…" : "Resend OTP"}
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => { setStep("email"); setError(""); setOtp(""); setPassword(""); setConfirmPassword(""); }}
                className="flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-3 h-3" /> Use a different email
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
