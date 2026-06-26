import { useState, useRef, useEffect } from "react";
import { useLang, LANGUAGES } from "@/lib/i18n";
import { useSEO } from "@/lib/seo";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Eye, EyeOff, Globe, ChevronDown } from "lucide-react";
import Logo from "@/components/Logo";
import { startAuthentication } from "@simplewebauthn/browser";

const TS_KEY = "0x4AAAAAADf8Y6bd6_-NTNSx";
const WA = "https://wa.me/96897043234";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
  </svg>
);

export default function Login() {
  useSEO("Sign In — iUnlockd", "Sign in to your iUnlockd account to manage your unlock orders and services.");
  const { login } = useAuth();
  const { t, setLang, currentLang } = useLang();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [showTotp, setShowTotp] = useState(false);
  const [captcha, setCaptcha] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const tsRef = useRef<HTMLDivElement>(null);
  const tsId = useRef<string|null>(null);

  useEffect(()=>{
    if(showTotp) return;
    const go=()=>{
      if(!tsRef.current||tsId.current!==null||!window.turnstile) return;
      tsId.current=window.turnstile.render(tsRef.current,{
        sitekey:TS_KEY,theme:"light",
        callback:(t:string)=>setCaptcha(t),
        "expired-callback":()=>setCaptcha(""),
        "error-callback":()=>setCaptcha(""),
      });
    };
    if(window.turnstile) go();
    else{const p=setInterval(()=>{if(window.turnstile){clearInterval(p);go();}},150);return()=>clearInterval(p);}
    return()=>{if(window.turnstile&&tsId.current!==null){try{window.turnstile.remove(tsId.current);}catch{}tsId.current=null;setCaptcha("");}};
  },[showTotp]);

  const handlePasskeyLogin = async () => {
    setError(""); setPasskeyLoading(true);
    try {
      const optRes = await fetch("/api/user/passkey/authentication-options");
      if (!optRes.ok) { setError("Failed to start passkey login"); return; }
      type AuthOptions = { sessionId: string } & Parameters<typeof startAuthentication>[0]["optionsJSON"];
      const { sessionId, ...authOptions } = await optRes.json() as AuthOptions;
      let authResp;
      try { authResp = await startAuthentication({ optionsJSON: authOptions }); }
      catch { setError("Passkey login cancelled or not supported"); return; }
      const res = await fetch("/api/user/passkey/authenticate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...authResp, sessionId }),
      });
      const data = await res.json() as { token?: string; user?: unknown; error?: string };
      if (!res.ok) { setError(data.error ?? "Passkey authentication failed"); return; }
      login(data.token!, data.user as Parameters<typeof login>[1]);
      navigate(from, { replace: true });
    } catch { setError(t("networkError")); }
    finally { setPasskeyLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (!email || !/\S+@\S+\.\S+/.test(email)) { setError(t("enterValidEmail")); return; }
    if (!password) { setError(t("enterPassword")); return; }
    if (!captcha && !showTotp) { setError(t("securityCheck")); return; }
    setLoading(true);
    try {
      const body: Record<string, string> = { email, password, turnstileToken: captcha };
      if (showTotp) body["totpToken"] = totpCode;
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok && data.requireTotp) { setShowTotp(true); setTotpCode(""); setLoading(false); return; }
      if (!res.ok) { setError(data.error ?? "Login failed"); if (showTotp) setTotpCode(""); setLoading(false); return; }
      login(data.token, data.user);
      navigate(from, { replace: true });
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  const inp = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-500 bg-white placeholder-gray-400 transition-colors";

  if (showTotp) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center mb-4 mx-auto">
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 text-center mb-1">Two-Factor Auth</h2>
        <p className="text-xs text-gray-400 text-center mb-5">Enter the 6-digit code from Google Authenticator</p>
        {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input type="text" inputMode="numeric" maxLength={6} placeholder="000000"
            value={totpCode} onChange={e=>setTotpCode(e.target.value.replace(/\D/g,"").slice(0,6))}
            required autoFocus
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl tracking-widest font-mono text-gray-900 focus:outline-none focus:border-gray-600"/>
          <button type="submit" disabled={loading||totpCode.length!==6}
            className="w-full py-2.5 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-900 disabled:opacity-60">
            {loading?"Verifying…":"Verify & Sign In"}
          </button>
          <button type="button" onClick={()=>{setShowTotp(false);setError("");setTotpCode("");}}
            className="text-center text-xs text-gray-500 hover:text-gray-700">← Back</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <Logo size="sm"/>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button onClick={()=>setShowLangMenu(v=>!v)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50">
              <Globe className="w-3.5 h-3.5"/> {currentLang.flag} {currentLang.label} <ChevronDown className="w-3 h-3"/>
            </button>
            {showLangMenu && (
              <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[130px]">
                {LANGUAGES.map(l=>(
                  <button key={l.code} onClick={()=>{setLang(l.code);setShowLangMenu(false);}}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 ${currentLang.code===l.code?"font-semibold text-black":"text-gray-600"}`}>
                    {l.flag} {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <a href={WA} target="_blank" rel="noopener noreferrer"
            className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-700 font-medium hover:bg-gray-50">
            {t("support")}
          </a>
        </div>
      </header>

      <div className="flex-1 flex flex-col px-5 max-w-sm mx-auto w-full">
        <div className="mt-5 mb-4">
          <h1 className="text-xl font-bold text-gray-900 leading-tight">{t("welcome")}</h1>
          <p className="text-xs text-gray-400 mt-0.5">{t("signInSub")}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-2 mb-1">
            <button type="button"
              onClick={()=>{ window.location.href = "/api/auth/google"; }}
              className="flex-1 flex flex-col items-center gap-1 py-2.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors">
              <GoogleIcon/> Google
            </button>
            {[
              {name:"Apple",Icon:AppleIcon},
              {name:"GitHub",Icon:GithubIcon},
            ].map(({name,Icon})=>(
              <button key={name} type="button"
                onClick={()=>alert(name+" login coming soon")}
                className="flex-1 flex flex-col items-center gap-1 py-2.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors">
                <Icon/> {name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200"/>
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200"/>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-medium text-gray-700">{t("email")}</label>
            </div>
            <input type="email" placeholder={t("emailPh")} value={email}
              onChange={e=>setEmail(e.target.value)} required autoComplete="email"
              className={inp}/>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-medium text-gray-700">{t("password")}</label>
              <Link to="/forgot-password" className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline">{t("forgotPw")}</Link>
            </div>
            <div className="relative">
              <input type={showPw?"text":"password"} placeholder={t("passwordPh")} value={password}
                onChange={e=>setPassword(e.target.value)} required autoComplete="current-password"
                className={inp+" pr-9"}/>
              <button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPw?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">{t("humanCheck")}</p>
            <div ref={tsRef} className="min-h-[65px]"/>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              className="w-4 h-4 accent-black rounded"
            />
            <span className="text-xs text-gray-600">{t("rememberMe")}</span>
          </label>

          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-900 active:scale-[0.98] transition-all disabled:opacity-60">
            {loading?t("signingIn"):t("signIn")}
          </button>

          <button type="button" onClick={()=>void handlePasskeyLogin()} disabled={passkeyLoading}
            className="w-full py-2.5 border-2 border-amber-400 text-gray-700 text-xs font-semibold rounded-lg hover:bg-amber-50 bg-amber-50/50 transition-colors disabled:opacity-60">
            {passkeyLoading?t("verifying"):t("passkeyBtn")}
          </button>

          <p className="text-center text-sm text-gray-500 mt-6 pb-2">
            New user?{" "}
            <Link to="/register" className="text-blue-500 font-bold hover:underline">Create an account</Link>
          </p>
        </form>
      </div>

      <p className="text-center text-xs text-gray-400 px-5 pb-6 mt-auto">
        Protected by iUnlockd security. Subject to our{" "}
        <Link to="/privacy" className="font-semibold text-blue-500 hover:underline">Privacy Policy</Link>
        {" "}and{" "}
        <Link to="/terms" className="font-semibold text-blue-500 hover:underline">Terms of Service</Link>.
      </p>
    </div>
  );
}
