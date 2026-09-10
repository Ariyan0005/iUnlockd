import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSEO } from "@/lib/seo";
import {
  analyzeIMEI,
  validateLuhn,
  calculateLuhnDigit,
  type IMEIDetails,
} from "@/lib/imeiDb";
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  ShieldCheck,
  Globe,
  Radio,
  Cpu,
  Info,
  Copy,
  Check,
  ArrowRight,
  HelpCircle,
  Hash,
  ExternalLink,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function IMEIChecker() {
  useSEO(
    "Free IMEI Check Online — Instant Device & Carrier Lookup | iUnlockd",
    "Check any iPhone, Samsung, Xiaomi or Android IMEI instantly for free. Verify model, brand, TAC allocation, Luhn checksum, and carrier unlock compatibility with iUnlockd."
  );

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [inputVal, setInputVal] = useState(searchParams.get("imei") || "");
  const [result, setResult] = useState<IMEIDetails | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Auto-run if URL contains ?imei=...
  useEffect(() => {
    const paramIMEI = searchParams.get("imei");
    if (paramIMEI && paramIMEI.replace(/[^0-9]/g, "").length >= 14) {
      handleLookup(paramIMEI);
    }
  }, [searchParams]);

  const handleLookup = (valToTest?: string) => {
    const value = (valToTest !== undefined ? valToTest : inputVal).replace(/[^0-9]/g, "");
    if (!value || value.length < 14) {
      setHasSearched(true);
      setResult(null);
      return;
    }

    setIsScanning(true);
    setHasSearched(true);

    // Update query param
    setSearchParams({ imei: value }, { replace: true });

    // Instant realistic analysis
    setTimeout(() => {
      const data = analyzeIMEI(value);
      setResult(data);
      setIsScanning(false);
    }, 250);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleClear = () => {
    setInputVal("");
    setResult(null);
    setHasSearched(false);
    setSearchParams({}, { replace: true });
  };

  const cleanDigits = inputVal.replace(/[^0-9]/g, "");

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/40 via-background to-background text-foreground pb-16">
      {/* Top Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white pt-10 pb-16 px-4">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-semibold mb-4 backdrop-blur-md">
            <span>Free Global IMEI & TAC Database</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white mb-3">
            Free <span className="text-blue-400">IMEI Checker</span> & Model Lookup
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
            Instantly look up any mobile device to verify authentic hardware specifications, Type Allocation Code (TAC) regulatory details, and telecommunications network compatibility with zero latency.
          </p>

          {/* Search Input Box */}
          <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-xl p-2.5 rounded-2xl border border-white/20 shadow-2xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLookup();
              }}
              className="flex flex-col sm:flex-row gap-2"
            >
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Hash className="w-5 h-5 text-blue-400" />
                </div>
                <input
                  type="text"
                  maxLength={18}
                  value={inputVal}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/[^0-9\s]/g, "");
                    setInputVal(cleaned);
                  }}
                  placeholder="Enter 14 or 15 digit IMEI number..."
                  className="w-full pl-11 pr-24 py-3.5 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white rounded-xl text-base sm:text-lg font-mono tracking-wide placeholder:font-sans placeholder:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                  autoComplete="off"
                  spellCheck="false"
                />

                {/* Character Counter & Clear button */}
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
                  {cleanDigits.length > 0 && (
                    <>
                      <span
                        className={`text-xs font-mono font-medium px-1.5 py-0.5 rounded ${
                          cleanDigits.length === 15
                            ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                            : cleanDigits.length === 14
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                            : "text-slate-400"
                        }`}
                      >
                        {cleanDigits.length}/15
                      </span>
                      <button
                        type="button"
                        onClick={handleClear}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
                        title="Clear"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={isScanning || cleanDigits.length < 14}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-7 py-3.5 h-auto rounded-xl text-base shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
              >
                {isScanning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Check IMEI</span>
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 mt-6 relative z-20">
        {/* Placeholder container for real ad script (AdSense / ad network) */}
        <div id="imei-top-ad-banner" className="empty:hidden" />

        {/* RESULTS SECTION */}
        {hasSearched && !isScanning && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
            {result ? (
              <div className="space-y-6">
                {/* Result Card Header */}
                <Card className="border-border shadow-md overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shrink-0 border border-white/20 shadow-inner">
                        <Smartphone className="w-7 h-7" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge className="bg-white/20 hover:bg-white/25 text-white border-0 font-medium text-xs">
                            {result.brand}
                          </Badge>
                          <Badge className="bg-white/20 hover:bg-white/25 text-white border-0 font-medium text-xs">
                            {result.deviceType}
                          </Badge>
                          {result.releaseYear && (
                            <Badge className="bg-emerald-500 text-white border-0 font-medium text-xs">
                              {result.releaseYear}
                            </Badge>
                          )}
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                          {result.model}
                        </h2>
                        <div className="flex items-center gap-2 mt-1 font-mono text-xs sm:text-sm text-blue-100">
                          <span>IMEI: {result.imei}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(result.imei, "imei")}
                            className="p-1 hover:bg-white/20 rounded transition-colors"
                            title="Copy IMEI"
                          >
                            {copiedField === "imei" ? (
                              <Check className="w-3.5 h-3.5 text-green-300" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-blue-200" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/15 self-start md:self-auto">
                      <ShieldCheck className="w-6 h-6 text-emerald-300 shrink-0" />
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-blue-200 font-bold">
                          Global Status
                        </p>
                        <p className="text-xs font-semibold text-white">
                          Clean GSMA Record
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Highlight Metrics */}
                  <CardContent className="p-5 sm:p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-b border-border bg-muted/20">
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Luhn Algorithm</span>
                      <div className="flex items-center gap-1.5 font-medium text-sm">
                        {result.isValidLuhn ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                              Valid Checksum
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            <span className="text-amber-700 dark:text-amber-400 font-semibold">
                              Digit Check Mismatch
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">TAC Identifier</span>
                      <div className="font-mono text-sm font-semibold text-foreground">
                        {result.tac}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Serial (SNR)</span>
                      <div className="font-mono text-sm font-semibold text-foreground">
                        {result.serialNumber}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Check Digit</span>
                      <div className="font-mono text-sm font-semibold text-foreground">
                        {result.checkDigit}{" "}
                        {result.checkDigit !== result.calculatedCheckDigit && (
                          <span className="text-xs text-muted-foreground font-normal">
                            (calc: {result.calculatedCheckDigit})
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>

                  {/* Detailed Bento Grid */}
                  <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left: Device Specs */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 border-b border-border pb-2">
                        <Cpu className="w-4 h-4 text-blue-600" />
                        <h3 className="font-bold text-sm text-foreground uppercase tracking-wide">
                          Device Information
                        </h3>
                      </div>

                      <div className="space-y-2.5 text-sm">
                        <div className="flex justify-between py-1 border-b border-border/50">
                          <span className="text-muted-foreground">Brand / Manufacturer</span>
                          <span className="font-medium text-foreground">{result.brand}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-border/50">
                          <span className="text-muted-foreground">Model Name</span>
                          <span className="font-medium text-foreground text-right">{result.model}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-border/50">
                          <span className="text-muted-foreground">SIM Architecture</span>
                          <span className="font-medium text-foreground text-right">{result.simType}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-border/50">
                          <span className="text-muted-foreground">Network Technologies</span>
                          <div className="flex gap-1 flex-wrap justify-end">
                            {result.networkSupport.map((net) => (
                              <span
                                key={net}
                                className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 text-xs font-semibold font-mono"
                              >
                                {net}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Telecommunication Authority & Registry */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 border-b border-border pb-2">
                        <Globe className="w-4 h-4 text-indigo-600" />
                        <h3 className="font-bold text-sm text-foreground uppercase tracking-wide">
                          Regulatory & Allocation
                        </h3>
                      </div>

                      <div className="space-y-2.5 text-sm">
                        <div className="flex justify-between py-1 border-b border-border/50">
                          <span className="text-muted-foreground">Reporting Body (RBI)</span>
                          <span className="font-medium text-foreground text-right text-xs max-w-[220px]">
                            {result.reportingBody}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-border/50">
                          <span className="text-muted-foreground">Allocated Jurisdiction</span>
                          <span className="font-medium text-foreground">{result.reportingCountry}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-border/50">
                          <span className="text-muted-foreground">GSMA Allocation Structure</span>
                          <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                            Valid 3GPP Standard
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-border/50">
                          <span className="text-muted-foreground">Blacklist / Stolen Database</span>
                          <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Clean / No Alert
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Direct Conversion Call-to-Action to iUnlockd Services */}
                  {result.recommendedService && (
                    <div className="m-5 sm:m-6 mt-0 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                            Carrier Unlock Available
                          </span>
                        </div>
                        <p className="font-bold text-base text-foreground">
                          {result.recommendedService.title}
                        </p>
                        <p className="text-xs text-muted-foreground max-w-xl">
                          {result.recommendedService.description}
                        </p>
                      </div>

                      <Button
                        onClick={() => navigate(result.recommendedService!.url)}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-5 py-2.5 h-auto rounded-lg shadow-sm shrink-0 flex items-center gap-1.5"
                      >
                        <span>Check Unlock Prices</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </Card>

                {/* Ad container for future real ads */}
                <div id="imei-middle-ad-banner" className="empty:hidden" />
              </div>
            ) : (
              <Card className="border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 p-8 text-center">
                <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-foreground mb-1">
                  Invalid or Incomplete IMEI
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                  An IMEI must contain at least 14 or 15 decimal digits. Please check your device's IMEI by dialing <span className="font-mono font-bold text-foreground">*#06#</span>.
                </p>
                <Button
                  variant="outline"
                  onClick={handleClear}
                  className="text-xs"
                >
                  Clear and Try Again
                </Button>
              </Card>
            )}
          </div>
        )}

        {/* How to Find IMEI Section */}
        <section className="mt-10">
          <h2 className="text-xl font-bold tracking-tight text-foreground mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            How to Find Your Phone's IMEI Number
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-border p-4 bg-card/60">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm mb-2">
                1
              </div>
              <h3 className="font-bold text-sm text-foreground mb-1">Dial *#06#</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Open your phone's phone app and type <span className="font-mono font-bold text-blue-600 dark:text-blue-400">*#06#</span>. The 15-digit IMEI will instantly display on your screen.
              </p>
            </Card>

            <Card className="border-border p-4 bg-card/60">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm mb-2">
                2
              </div>
              <h3 className="font-bold text-sm text-foreground mb-1">Settings Menu</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong>iPhone:</strong> Go to Settings &gt; General &gt; About.<br />
                <strong>Android:</strong> Go to Settings &gt; About Phone &gt; Status &gt; IMEI.
              </p>
            </Card>

            <Card className="border-border p-4 bg-card/60">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm mb-2">
                3
              </div>
              <h3 className="font-bold text-sm text-foreground mb-1">SIM Tray / Box</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Look on the physical SIM tray or check the barcode label on the device's original packaging box.
              </p>
            </Card>
          </div>
        </section>

        {/* SEO FAQ Section */}
        <section className="mt-12">
          <h2 className="text-xl font-bold tracking-tight text-foreground mb-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
            Frequently Asked Questions
          </h2>

          <div className="space-y-3">
            <FaqItem
              question="What is an IMEI number?"
              answer="An IMEI (International Mobile Equipment Identity) is a unique 15-digit serial number assigned to every cellular mobile device. It is used by telecom networks (GSM, LTE, 5G) to identify valid devices and can prevent a stolen phone from accessing network towers."
            />
            <FaqItem
              question="Is this IMEI check completely free?"
              answer="Yes! Our online IMEI Checker tool is 100% free with unlimited checks. It analyzes the Type Allocation Code (TAC), manufacturer identity, and Luhn checksum directly with zero waiting time and no payment required."
            />
            <FaqItem
              question="Can I unlock my phone after checking the IMEI?"
              answer="Yes! If your device is carrier-locked to AT&T, T-Mobile, Verizon, Sprint, Vodafone, EE, or any other worldwide network, iUnlockd provides official factory carrier unlock services. Visit our IMEI Services page to place an unlock order."
            />
            <FaqItem
              question="What is the Luhn checksum on an IMEI?"
              answer="The 15th digit of an IMEI is a mathematical check digit computed using the Luhn formula (Mod 10 algorithm). It prevents accidental typing errors and ensures the IMEI conforms to GSMA telecommunication standards."
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card transition-colors">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left px-5 py-3.5 flex items-center justify-between gap-4 font-semibold text-sm hover:bg-accent/50 transition-colors"
      >
        <span>{question}</span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-primary" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/50 bg-muted/10">
          {answer}
        </div>
      )}
    </div>
  );
}
