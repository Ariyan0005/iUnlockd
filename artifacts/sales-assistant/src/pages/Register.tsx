import { useState, useMemo, useEffect, useRef } from "react";
import { useLang, LANGUAGES } from "@/lib/i18n";
import { useSEO } from "@/lib/seo";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, CheckCircle2, XCircle, Loader2, Globe, ChevronDown } from "lucide-react";
import Logo from "@/components/Logo";

const COUNTRIES = [
  {n:"Afghanistan",c:"AF"},{n:"Albania",c:"AL"},{n:"Algeria",c:"DZ"},{n:"Angola",c:"AO"},
  {n:"Argentina",c:"AR"},{n:"Armenia",c:"AM"},{n:"Australia",c:"AU"},{n:"Austria",c:"AT"},
  {n:"Azerbaijan",c:"AZ"},{n:"Bahrain",c:"BH"},{n:"Bangladesh",c:"BD"},{n:"Belarus",c:"BY"},
  {n:"Belgium",c:"BE"},{n:"Bolivia",c:"BO"},{n:"Bosnia and Herzegovina",c:"BA"},{n:"Brazil",c:"BR"},
  {n:"Brunei",c:"BN"},{n:"Bulgaria",c:"BG"},{n:"Cambodia",c:"KH"},{n:"Cameroon",c:"CM"},
  {n:"Canada",c:"CA"},{n:"Chile",c:"CL"},{n:"China",c:"CN"},{n:"Colombia",c:"CO"},
  {n:"Costa Rica",c:"CR"},{n:"Croatia",c:"HR"},{n:"Cuba",c:"CU"},{n:"Cyprus",c:"CY"},
  {n:"Czech Republic",c:"CZ"},{n:"Denmark",c:"DK"},{n:"Dominican Republic",c:"DO"},
  {n:"Ecuador",c:"EC"},{n:"Egypt",c:"EG"},{n:"Estonia",c:"EE"},{n:"Ethiopia",c:"ET"},
  {n:"Finland",c:"FI"},{n:"France",c:"FR"},{n:"Georgia",c:"GE"},{n:"Germany",c:"DE"},
  {n:"Ghana",c:"GH"},{n:"Greece",c:"GR"},{n:"Guatemala",c:"GT"},{n:"Honduras",c:"HN"},
  {n:"Hong Kong",c:"HK"},{n:"Hungary",c:"HU"},{n:"Iceland",c:"IS"},{n:"India",c:"IN"},
  {n:"Indonesia",c:"ID"},{n:"Iran",c:"IR"},{n:"Iraq",c:"IQ"},{n:"Ireland",c:"IE"},
  {n:"Israel",c:"IL"},{n:"Italy",c:"IT"},{n:"Jamaica",c:"JM"},{n:"Japan",c:"JP"},
  {n:"Jordan",c:"JO"},{n:"Kazakhstan",c:"KZ"},{n:"Kenya",c:"KE"},{n:"Kuwait",c:"KW"},
  {n:"Kyrgyzstan",c:"KG"},{n:"Latvia",c:"LV"},{n:"Lebanon",c:"LB"},{n:"Libya",c:"LY"},
  {n:"Lithuania",c:"LT"},{n:"Luxembourg",c:"LU"},{n:"Macau",c:"MO"},{n:"Malaysia",c:"MY"},
  {n:"Maldives",c:"MV"},{n:"Malta",c:"MT"},{n:"Mauritius",c:"MU"},{n:"Mexico",c:"MX"},
  {n:"Moldova",c:"MD"},{n:"Mongolia",c:"MN"},{n:"Montenegro",c:"ME"},{n:"Morocco",c:"MA"},
  {n:"Mozambique",c:"MZ"},{n:"Myanmar",c:"MM"},{n:"Namibia",c:"NA"},{n:"Nepal",c:"NP"},
  {n:"Netherlands",c:"NL"},{n:"New Zealand",c:"NZ"},{n:"Nicaragua",c:"NI"},{n:"Nigeria",c:"NG"},
  {n:"North Macedonia",c:"MK"},{n:"Norway",c:"NO"},{n:"Oman",c:"OM"},{n:"Pakistan",c:"PK"},
  {n:"Palestine",c:"PS"},{n:"Panama",c:"PA"},{n:"Paraguay",c:"PY"},{n:"Peru",c:"PE"},
  {n:"Philippines",c:"PH"},{n:"Poland",c:"PL"},{n:"Portugal",c:"PT"},{n:"Qatar",c:"QA"},
  {n:"Romania",c:"RO"},{n:"Russia",c:"RU"},{n:"Rwanda",c:"RW"},{n:"Saudi Arabia",c:"SA"},
  {n:"Senegal",c:"SN"},{n:"Serbia",c:"RS"},{n:"Singapore",c:"SG"},{n:"Slovakia",c:"SK"},
  {n:"Slovenia",c:"SI"},{n:"Somalia",c:"SO"},{n:"South Africa",c:"ZA"},{n:"South Korea",c:"KR"},
  {n:"Spain",c:"ES"},{n:"Sri Lanka",c:"LK"},{n:"Sudan",c:"SD"},{n:"Sweden",c:"SE"},
  {n:"Switzerland",c:"CH"},{n:"Syria",c:"SY"},{n:"Taiwan",c:"TW"},{n:"Tanzania",c:"TZ"},
  {n:"Thailand",c:"TH"},{n:"Tunisia",c:"TN"},{n:"Turkey",c:"TR"},{n:"Turkmenistan",c:"TM"},
  {n:"UAE",c:"AE"},{n:"Uganda",c:"UG"},{n:"Ukraine",c:"UA"},{n:"United Kingdom",c:"GB"},
  {n:"United States",c:"US"},{n:"Uruguay",c:"UY"},{n:"Uzbekistan",c:"UZ"},{n:"Venezuela",c:"VE"},
  {n:"Vietnam",c:"VN"},{n:"Yemen",c:"YE"},{n:"Zambia",c:"ZM"},{n:"Zimbabwe",c:"ZW"},
].sort((a,b)=>a.n.localeCompare(b.n));

function pwStr(pw: string) {
  const checks = [
    {l:"8+ chars",ok:pw.length>=8},
    {l:"Uppercase",ok:/[A-Z]/.test(pw)},
    {l:"Lowercase",ok:/[a-z]/.test(pw)},
    {l:"Number",ok:/\d/.test(pw)},
    {l:"Special",ok:/[^A-Za-z0-9]/.test(pw)},
  ];
  return {score:checks.filter(x=>x.ok).length,checks};
}

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

const Header = ({ showLangMenu, setShowLangMenu, currentLang, setLang, LANGUAGES }: any) => (
  <header className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
    <Logo size="sm" />
    <div className="flex items-center gap-2">
          <div className="relative">
            <button onClick={()=>setShowLangMenu((v: any)=>!v)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50">
              <Globe className="w-3.5 h-3.5"/> {currentLang?.flag} {currentLang?.label} <ChevronDown className="w-3 h-3"/>
            </button>
            {showLangMenu && (
              <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[130px]">
                {LANGUAGES.map(l=>(
                  <button key={l.code} onClick={()=>{setLang(l.code);setShowLangMenu(false);}}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 ${currentLang?.code===l.code?"font-semibold text-black":"text-gray-600"}`}>
                    {l.flag} {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>
      <a href={WA} target="_blank" rel="noopener noreferrer"
        className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-700 font-medium hover:bg-gray-50">
        Support
      </a>
    </div>
  </header>
);

export default function Register() {
  useSEO("Create Account — iUnlockd", "Create a free iUnlockd account and start unlocking your devices today. No subscription required.");
  const nav = useNavigate();
  const { t, setLang, currentLang } = useLang();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [cpw, setCpw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [country, setCountry] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [avail, setAvail] = useState<boolean|null>(null);
  const [fmt, setFmt] = useState<boolean|null>(null);
  const [captcha, setCaptcha] = useState("");
  const tsRef = useRef<HTMLDivElement>(null);
  const tsId = useRef<string|null>(null);

  useEffect(() => {
    fetch("https://www.cloudflare.com/cdn-cgi/trace")
      .then(r=>r.text())
      .then(t=>{
        const m=t.match(/loc=(\w+)/);
        const found=m&&COUNTRIES.find(c=>c.c===m[1]);
        if(found){setCountry(found.n);return;}
        throw new Error();
      })
      .catch(()=>
        fetch("https://ipapi.co/country_code/")
          .then(r=>r.text())
          .then(code=>{const found=COUNTRIES.find(c=>c.c===code.trim());if(found)setCountry(found.n);})
          .catch(()=>{})
      );
  },[]);

  useEffect(()=>{
    if(step!==2) return;
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
  },[step]);

  useEffect(()=>{
    const ok=/\S+@\S+\.\S+/.test(email);
    if(!email){setFmt(null);setAvail(null);return;}
    if(!ok){setFmt(false);setAvail(null);return;}
    setFmt(true);setChecking(true);setAvail(null);
    const t=setTimeout(async()=>{
      try{const r=await fetch("/api/auth/check-email?email="+encodeURIComponent(email));const d=await r.json();setAvail(!!d.available);}
      catch{setAvail(null);}finally{setChecking(false);}
    },600);
    return()=>clearTimeout(t);
  },[email]);

  const strength=useMemo(()=>pwStr(pw),[pw]);
  const sColor=["","#ef4444","#ef4444","#f97316","#eab308","#22c55e"][strength.score];
  const sLabel=["","Weak","Weak","Fair","Good","Strong"][strength.score];

  const next=(e:React.FormEvent)=>{
    e.preventDefault();setErr("");
    if(!fmt){setErr("Enter a valid email.");return;}
    if(avail===false){setErr("Email already registered. Sign in instead.");return;}
    if(checking||avail===null){setErr("Checking email, please wait.");return;}
    if(strength.score<3){setErr("Password too weak. Use uppercase, number & special char.");return;}
    if(pw!==cpw){setErr("Passwords do not match.");return;}
    if(!agreed){setErr("Please accept the terms.");return;}
    setStep(2);
  };

  const register=async(e:React.FormEvent)=>{
    e.preventDefault();setErr("");
    if(!first.trim()){setErr("First name required.");return;}
    if(!country){setErr("Select your country.");return;}
    if(!captcha){setErr(t("securityCheck"));return;}
    setLoading(true);
    try{
      const r=await fetch("/api/auth/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:(first+" "+last).trim(),email,password:pw,country,turnstileToken:captcha})});
      const d=await r.json();
      if(!r.ok){setErr(d.error??"Registration failed");return;}
      nav("/verify-email?email="+encodeURIComponent(email));
    }catch{setErr("Network error. Try again.");}finally{setLoading(false);}
  };

  const inp="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-500 bg-white placeholder-gray-400 transition-colors";

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header showLangMenu={showLangMenu} setShowLangMenu={setShowLangMenu} currentLang={currentLang} setLang={setLang} LANGUAGES={[]} />
      <div className="flex-1 flex flex-col px-5 max-w-sm mx-auto w-full">
        {step===1 ? (
          <>
            <div className="mt-5 mb-3">
              <div className="flex gap-2 mb-4">
                {[
                  {name:"Google",Icon:GoogleIcon},
                  {name:"Apple",Icon:AppleIcon},
                  {name:"GitHub",Icon:GithubIcon},
                ].map(({name,Icon})=>(
                  <button key={name} type="button"
                    onClick={()=>{ if(name==="Google"){ window.location.href="/api/auth/google"; } else { alert(name+" login coming soon"); } }}
                    className="flex-1 flex flex-col items-center gap-1 py-2.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors">
                    <Icon/> {name}
                  </button>
                ))}
              </div>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">{t("accountInfo")}</h2>
              <p className="text-xs text-gray-400 mt-0.5 mb-3">{t("accountInfoSub")}</p>
            </div>

            <form onSubmit={next} className="flex flex-col gap-2.5">
              {err && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</p>}

              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">E-Mail <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input type="email" placeholder={t("emailPhReg")} value={email}
                    onChange={e=>{setEmail(e.target.value);setAvail(null);}}
                    required autoComplete="email"
                    className={inp+" pr-9 "+(avail===false||fmt===false?"border-red-400":avail===true?"border-green-400":"")}/>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    {!email?null:!fmt?<XCircle className="w-4 h-4 text-red-400"/>:checking?<Loader2 className="w-4 h-4 text-gray-300 animate-spin"/>:avail===true?<CheckCircle2 className="w-4 h-4 text-green-500"/>:avail===false?<XCircle className="w-4 h-4 text-red-400"/>:null}
                  </span>
                </div>
                {avail===false&&<p className="text-xs text-red-500 mt-0.5">Already registered. <Link to="/login" className="font-semibold underline">{t("signInLink")}</Link></p>}
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input type={showPw?"text":"password"} placeholder={t("pwPhReg")} value={pw}
                    onChange={e=>setPw(e.target.value)} required autoComplete="new-password"
                    className={inp+" pr-9"}/>
                  <button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPw?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
                  </button>
                </div>
                {pw.length>0&&(
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{width:(strength.score/5*100)+"%",backgroundColor:sColor}}/>
                    </div>
                    <span className="text-xs font-medium" style={{color:sColor}}>{sLabel}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Confirm Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input type={showCpw?"text":"password"} placeholder={t("confirmPwPh")} value={cpw}
                    onChange={e=>setCpw(e.target.value)} required autoComplete="new-password"
                    className={inp+" pr-9 "+(cpw&&cpw!==pw?"border-red-400":"")}/>
                  <button type="button" onClick={()=>setShowCpw(!showCpw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showCpw?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
                  </button>
                </div>
              </div>
                {cpw && <p className={"text-xs mt-0.5 " + (cpw===pw ? "text-green-500" : "text-red-500")}>{cpw===pw ? "✓ Passwords match" : "✗ Passwords do not match"}</p>}

              <label className="flex items-start gap-2 cursor-pointer mt-1">
                <input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)} className="mt-0.5 accent-black shrink-0"/>
                <span className="text-xs text-gray-600">{t("agreeTerms")} <span className="font-semibold text-blue-500">{t("terms")}</span> &amp; <span className="font-semibold text-blue-500">{t("privacy")}</span></span>
              </label>

              <div className="flex justify-end mt-1">
                <button type="submit"
                  className="px-8 py-2.5 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-900 active:scale-[0.98] transition-all">
                  Next →
                </button>
              </div>

              <p className="text-center text-sm text-gray-500 mt-6 pb-4">
                {t("haveAccount")}{" "}
                <Link to="/login" className="text-blue-500 font-bold hover:underline">Sign in</Link>
              </p>
            </form>
          </>
        ) : (
          <>
            <div className="mt-5 mb-3">
              <h2 className="text-xl font-bold text-gray-900">Personal Details</h2>
              <p className="text-xs text-gray-400 mt-0.5">Almost done — a few more details</p>
            </div>

            <form onSubmit={register} className="flex flex-col gap-2.5">
              {err && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</p>}

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-700 mb-1 block">First Name <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="First" value={first} onChange={e=>setFirst(e.target.value)} required className={inp}/>
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-700 mb-1 block">{t("lastName")}</label>
                  <input type="text" placeholder="Last" value={last} onChange={e=>setLast(e.target.value)} className={inp}/>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                  Country <span className="text-red-500">*</span>
                  {country&&<span className="text-green-600 font-normal text-xs flex items-center gap-0.5 ml-1"><CheckCircle2 className="w-3 h-3"/>Auto-detected</span>}
                </label>
                <div className="relative">
                  <select value={country} onChange={e=>setCountry(e.target.value)} required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-500 bg-white appearance-none">
                    <option value="">Select your country</option>
                    {COUNTRIES.map(c=><option key={c.c} value={c.n}>{c.n}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"/>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Security Check</p>
                <div ref={tsRef} className="min-h-[65px]"/>
              </div>

              <div className="flex gap-2 mt-1">
                <button type="button" onClick={()=>{setStep(1);setErr("");}}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors">
                  ← Back
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-2.5 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-60">
                  {loading?"Creating…":"Register"}
                </button>
              </div>

              <p className="text-center text-sm text-gray-500 mt-6 pb-6">
                Already have an account?{" "}
                <Link to="/login" className="text-blue-500 font-bold hover:underline">Sign in</Link>
              </p>
            </form>
          </>
        )}
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
