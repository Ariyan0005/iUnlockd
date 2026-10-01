import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CircleHelp,
  ExternalLink,
  FileSearch,
  Hash,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useSEO } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type CheckPageConfig = {
  title: string;
  eyebrow: string;
  seoTitle: string;
  description: string;
  intro: string;
  inputLabel: string;
  placeholder: string;
  identifierHint: string;
  identifierParam: string;
  accent: string;
  related: string[];
};

export const CHECK_PAGE_CONFIG: Record<string, CheckPageConfig> = {
  "imei-checker": {
    title: "IMEI & TAC checker",
    eyebrow: "The first step before you buy",
    seoTitle: "Free IMEI & TAC Checker Online for Phones | iUnlockd",
    description: "Check a phone's IMEI online before you buy or sell. Request device details from iUnlockd's configured lookup provider and review its response.",
    intro: "Enter an IMEI to request the device information available from the configured iUnlockd provider. No guessed results, no hidden assumptions.",
    inputLabel: "IMEI number",
    placeholder: "Enter a 14 or 15 digit IMEI",
    identifierHint: "Most IMEI numbers have 15 digits. Spaces are okay.",
    identifierParam: "imei",
    accent: "cyan",
    related: ["iphone-imei-check", "samsung-imei-check", "imei-blacklist-check"],
  },
  "iphone-imei-check": {
    title: "iPhone IMEI check",
    eyebrow: "Verify an iPhone before handover",
    seoTitle: "iPhone IMEI Check Online for Device Status | iUnlockd",
    description: "Check an iPhone's IMEI online before purchase. Request device details and status from iUnlockd's configured provider; results depend on provider coverage.",
    intro: "Request the iPhone device details and status returned by your configured provider before you buy or repair.",
    inputLabel: "iPhone IMEI",
    placeholder: "Enter a 14 or 15 digit iPhone IMEI",
    identifierHint: "Find it in Settings > General > About, or dial *#06#.",
    identifierParam: "imei",
    accent: "blue",
    related: ["imei-checker", "iphone-carrier-check", "fmi-check"],
  },
  "apple-serial-check": {
    title: "Apple serial check",
    eyebrow: "Know the device behind the box",
    seoTitle: "Apple Serial Number Check Online for Devices | iUnlockd",
    description: "Look up Apple device details with its serial number. iUnlockd sends the identifier to its configured provider and displays the returned response.",
    intro: "Use the Apple serial number to request the device details your connected lookup provider can return.",
    inputLabel: "Apple serial number",
    placeholder: "Enter an Apple serial number",
    identifierHint: "Serial numbers can include letters and numbers.",
    identifierParam: "serial",
    accent: "violet",
    related: ["iphone-imei-check", "apple-warranty-check", "icloud-check"],
  },
  "icloud-check": {
    title: "iCloud status check",
    eyebrow: "A clear handover starts here",
    seoTitle: "iCloud Status Check Online for Apple Devices | iUnlockd",
    description: "Request an Apple device's iCloud-related status before purchase. Results come directly from iUnlockd's configured lookup provider.",
    intro: "Submit an IMEI or serial number to request the iCloud-related status returned by your configured provider.",
    inputLabel: "IMEI or serial number",
    placeholder: "Enter IMEI or serial number",
    identifierHint: "Use the identifier shown on the device or packaging.",
    identifierParam: "identifier",
    accent: "indigo",
    related: ["fmi-check", "apple-serial-check", "apple-warranty-check"],
  },
  "apple-warranty-check": {
    title: "Apple warranty check",
    eyebrow: "Understand coverage before you commit",
    seoTitle: "Apple Warranty Check Online for Device Coverage | iUnlockd",
    description: "Request Apple warranty and coverage details by IMEI or serial number. Results and availability depend on the configured lookup provider.",
    intro: "Check the coverage information available from your connected provider without exposing provider credentials in the browser.",
    inputLabel: "IMEI or serial number",
    placeholder: "Enter IMEI or serial number",
    identifierHint: "Coverage data depends on the connected provider.",
    identifierParam: "identifier",
    accent: "amber",
    related: ["apple-serial-check", "iphone-imei-check", "icloud-check"],
  },
  "iphone-carrier-check": {
    title: "iPhone carrier check",
    eyebrow: "Know the network before you activate",
    seoTitle: "iPhone Carrier Check Online for Network Status | iUnlockd",
    description: "Check an iPhone's carrier and network status by IMEI. iUnlockd sends the request to its configured provider and shows the response.",
    intro: "Find the carrier information returned for an iPhone identifier by your connected provider.",
    inputLabel: "iPhone IMEI",
    placeholder: "Enter a 14 or 15 digit iPhone IMEI",
    identifierHint: "Carrier results are supplied by the active provider for this route.",
    identifierParam: "imei",
    accent: "sky",
    related: ["iphone-imei-check", "imei-checker", "imei-blacklist-check"],
  },
  "samsung-imei-check": {
    title: "Samsung IMEI check",
    eyebrow: "Verify a Galaxy before you buy",
    seoTitle: "Samsung IMEI Check Online for Device Details | iUnlockd",
    description: "Check a Samsung phone's IMEI before buying, selling, or servicing it. See device details returned by iUnlockd's configured lookup provider.",
    intro: "Enter a Samsung IMEI to request the device and network information your provider supports.",
    inputLabel: "Samsung IMEI",
    placeholder: "Enter a 14 or 15 digit Samsung IMEI",
    identifierHint: "Dial *#06# on the phone to display its IMEI.",
    identifierParam: "imei",
    accent: "emerald",
    related: ["imei-checker", "imei-blacklist-check", "iphone-carrier-check"],
  },
  "xiaomi-mi-status-check": {
    title: "Xiaomi Mi status check",
    eyebrow: "A safer check for second-hand devices",
    seoTitle: "Xiaomi Mi Status Check Online for Phones | iUnlockd",
    description: "Request Xiaomi device details and Mi status by IMEI or serial number. Results depend on the provider configured for this check.",
    intro: "Enter a Xiaomi IMEI or serial number to request the status available from your connected provider.",
    inputLabel: "Xiaomi IMEI or serial",
    placeholder: "Enter IMEI or serial number",
    identifierHint: "Use the identifier shown in About phone or on the original box.",
    identifierParam: "identifier",
    accent: "lime",
    related: ["imei-checker", "samsung-imei-check", "imei-blacklist-check"],
  },
  "google-pixel-imei-check": {
    title: "Google Pixel IMEI check",
    eyebrow: "Make the next Pixel purchase with confidence",
    seoTitle: "Google Pixel IMEI Check Online for Device Status | iUnlockd",
    description: "Check Google Pixel device details with an IMEI lookup. iUnlockd sends your request to its configured provider and shows returned data.",
    intro: "Enter a Google Pixel IMEI to request the device information available from the provider configured for this check.",
    inputLabel: "Google Pixel IMEI",
    placeholder: "Enter a 14 or 15 digit Pixel IMEI",
    identifierHint: "Most Pixel IMEI numbers contain 15 digits.",
    identifierParam: "imei",
    accent: "orange",
    related: ["imei-checker", "iphone-carrier-check", "imei-blacklist-check"],
  },
  "imei-blacklist-check": {
    title: "IMEI blacklist check",
    eyebrow: "Do not inherit someone else's problem",
    seoTitle: "IMEI Blacklist Check Online for Device Status | iUnlockd",
    description: "Request an IMEI blacklist status before purchase. Results depend on iUnlockd's configured provider; no device status is invented.",
    intro: "Request the blacklist status returned by your configured provider. If no provider is active, iUnlockd will tell you instead of inventing a result.",
    inputLabel: "IMEI number",
    placeholder: "Enter a 14 or 15 digit IMEI",
    identifierHint: "Check the number against the phone, box, and purchase receipt.",
    identifierParam: "imei",
    accent: "rose",
    related: ["imei-checker", "iphone-imei-check", "fmi-check"],
  },
  "fmi-check": {
    title: "Find My iPhone check",
    eyebrow: "Confirm a clean Apple handover",
    seoTitle: "Find My iPhone (FMI) Check Online for Status | iUnlockd",
    description: "Request the Find My iPhone status for an Apple device. iUnlockd displays the configured provider's response and does not invent results.",
    intro: "Enter an Apple IMEI or serial number to request the Find My iPhone status returned by your connected provider.",
    inputLabel: "IMEI or serial number",
    placeholder: "Enter IMEI or serial number",
    identifierHint: "Ask the seller to erase the device before you pay.",
    identifierParam: "identifier",
    accent: "purple",
    related: ["icloud-check", "iphone-imei-check", "imei-checker"],
  },
};

const ALL_CHECKS = Object.entries(CHECK_PAGE_CONFIG).map(([slug, config]) => ({ slug, label: config.title }));

function formatResult(value: unknown) {
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

function providerErrorMessage(data: unknown, status: number) {
  if (data && typeof data === "object" && "error" in data && typeof data.error === "string") return data.error;
  if (status === 404 || status === 503) return "This check is not configured yet.";
  return "The configured provider could not complete this check. Try again in a moment.";
}

function AdReserve({ label }: { label: string }) {
  return (
    <div className="ad-reserve flex items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/35 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/60" aria-label={label} data-testid={`ad-reserve-${label.replace(/\s+/g, "-").toLowerCase()}`}>
      Reserved space
    </div>
  );
}

export default function DeviceCheckPage({ fixedSlug }: { fixedSlug?: string }) {
  const params = useParams();
  const location = useLocation();
  const slug = fixedSlug ?? params.slug ?? "imei-checker";
  const config = CHECK_PAGE_CONFIG[slug] ?? CHECK_PAGE_CONFIG["imei-checker"];
  const [identifier, setIdentifier] = useState("");
  const [result, setResult] = useState<unknown>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [error, setError] = useState<{ kind: "validation" | "not-configured" | "provider"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  useSEO(config.seoTitle, config.description, {
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: config.title,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Web",
      description: config.description,
      url: new URL(window.location.pathname, window.location.origin).toString(),
      provider: { "@type": "Organization", name: "iUnlockd" },
    },
  });

  const relatedChecks = useMemo(
    () => config.related.map((relatedSlug) => ({ slug: relatedSlug, label: CHECK_PAGE_CONFIG[relatedSlug]?.title ?? relatedSlug })),
    [config.related],
  );

  const retry = () => {
    void submit({ preventDefault: () => undefined } as FormEvent);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const value = config.identifierParam === "imei" ? identifier.replace(/\D/g, "") : identifier.trim();
    setResult(null);
    setProvider(null);
    setError(null);
    if (!value) {
      setError({ kind: "validation", message: `Enter a ${config.inputLabel.toLowerCase()} to begin.` });
      setModalOpen(true);
      return;
    }
    if (config.identifierParam === "imei" && !/^\d{14,15}$/.test(value)) {
      setError({ kind: "validation", message: "Enter a valid 14 or 15 digit IMEI." });
      setModalOpen(true);
      return;
    }
    setIdentifier(value);
    setModalOpen(true);
    setLoading(true);
    try {
      const response = await fetch(`/api/checks/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: value }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = providerErrorMessage(data, response.status);
        setError({ kind: response.status === 404 || response.status === 503 ? "not-configured" : "provider", message });
      } else {
        setResult(data?.data ?? data);
        setProvider(typeof data?.provider === "string" ? data.provider : "Configured provider");
      }
    } catch {
      setError({ kind: "provider", message: "We could not reach the check service. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] overflow-hidden bg-background pb-16">
      <section className="relative isolate border-b border-white/10 bg-[#10263d] px-4 pb-12 pt-10 text-white sm:pb-16 sm:pt-14">
        <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(#5ed7df_1px,transparent_1px)] [background-size:22px_22px]" />
        <div className="pointer-events-none absolute -right-32 -top-40 h-[28rem] w-[28rem] rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="relative mx-auto max-w-4xl">
          <div className="text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-200/25 bg-cyan-100/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-cyan-100">
              <ShieldCheck className="h-3.5 w-3.5" /> {config.eyebrow}
            </div>
            <h1 className="mx-auto max-w-3xl font-display text-4xl font-bold leading-[1.03] tracking-[-0.035em] text-balance sm:text-6xl">
              {config.title}
              <span className="mt-2 block text-cyan-300">before it costs you.</span>
            </h1>
          </div>

          <div className="mx-auto mt-8 max-w-3xl rounded-[1.65rem] border border-white/15 bg-white/[0.085] p-2 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
            <form onSubmit={submit} className="rounded-2xl bg-[#f4f8f9] p-4 text-foreground sm:p-5" data-testid={`form-check-${slug}`}>
              <div className="mb-4 flex items-center gap-3">
                <label htmlFor="device-identifier" className="text-sm font-bold">{config.inputLabel}</label>
              </div>
              <div className="relative">
                <Hash className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-700" />
                <input
                  ref={inputRef}
                  id="device-identifier"
                  value={identifier}
                  onChange={(event) => setIdentifier(config.identifierParam === "imei" ? event.target.value.replace(/\D/g, "").slice(0, 15) : event.target.value)}
                  placeholder={config.placeholder}
                  aria-label={config.inputLabel}
                  inputMode={config.identifierParam === "imei" ? "numeric" : "text"}
                  data-testid="input-device-identifier"
                  className="h-14 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 font-mono text-[15px] tracking-wide outline-none transition-shadow placeholder:font-sans placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              <p className="mt-2 px-1 text-xs text-slate-500">{config.identifierHint}</p>
              <Button type="submit" disabled={loading} data-testid="button-submit-check" className="mt-4 h-12 w-full rounded-xl bg-[#087e96] text-white shadow-lg shadow-cyan-900/15 hover:bg-[#066b80] focus-visible:ring-cyan-500">
                {loading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                {loading ? "Requesting provider…" : "Check this device"}
                {!loading && <ArrowRight className="ml-auto h-4 w-4" />}
              </Button>
            </form>
          </div>

          <p className="mx-auto mt-5 max-w-3xl text-center text-[15px] leading-7 text-slate-300 sm:text-lg">{config.intro}</p>
        </div>
      </section>

      <main className="relative mx-auto grid max-w-6xl gap-7 px-4 py-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-7">
          <AdReserve label="top ad" />

          <section className="rounded-2xl border border-border/80 bg-card/60 p-5 sm:p-7">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-cyan-100 p-2.5 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300"><LockKeyhole className="h-5 w-5" /></div>
              <div>
                <h2 className="font-display text-xl font-bold">A lookup, not a guess</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">If the provider does not support this check or returns an error, the page will show that clearly instead of guessing a clean, locked, or covered status.</p>
              </div>
            </div>
          </section>

          <AdReserve label="middle ad" />

          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">Keep checking</p><h2 className="mt-1 font-display text-2xl font-bold">More device checks</h2></div>
              <Link to="/imei-checker" onClick={scrollToTop} className="hidden items-center gap-1 text-sm font-semibold text-primary hover:underline sm:inline-flex">Main checker <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {relatedChecks.map((related) => (
                <Link key={related.slug} to={`/${related.slug}`} onClick={scrollToTop} data-testid={`link-related-${related.slug}`} className="group rounded-2xl border border-border/80 bg-card p-4 transition-transform hover:-translate-y-0.5 hover:border-cyan-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-primary"><ExternalLink className="h-4 w-4" /></div>
                  <p className="font-semibold leading-5">{related.label}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground group-hover:text-primary">Open check <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" /></span>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-border/80 bg-card p-5">
            <div className="mb-4 flex items-center gap-2"><Sparkles className="h-4 w-4 text-amber-600" /><h2 className="font-display font-bold">Every check, one place</h2></div>
            <div className="grid gap-1">
              {ALL_CHECKS.filter((check) => check.slug !== slug).map((check) => (
                <Link key={check.slug} to={`/${check.slug}`} onClick={scrollToTop} data-testid={`link-check-${check.slug}`} className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                  <span>{check.label}</span><ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ))}
            </div>
          </section>
          <section className="rounded-2xl bg-[#d9f1ef] p-5 text-[#16484d] dark:bg-[#163d42] dark:text-cyan-50">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/70 text-cyan-800 dark:bg-white/10 dark:text-cyan-200"><CircleHelp className="h-4 w-4" /></div>
            <h2 className="mt-4 font-display font-bold">Not sure where to start?</h2>
            <p className="mt-2 text-sm leading-6 opacity-80">Start with the main IMEI checker. From there you can move to carrier, blacklist, iCloud, warranty, and brand-specific routes.</p>
            <Link to="/imei-checker" onClick={scrollToTop} className="mt-4 inline-flex items-center gap-2 text-sm font-bold underline underline-offset-4" data-testid="link-main-checker">Open main checker <ArrowRight className="h-3.5 w-3.5" /></Link>
          </section>
        </aside>
      </main>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl overflow-hidden border-0 bg-transparent p-0 shadow-none sm:rounded-[1.75rem] [&>button]:right-5 [&>button]:top-5 [&>button]:z-10 [&>button]:rounded-full [&>button]:bg-white/10 [&>button]:p-1.5 [&>button]:text-white [&>button]:opacity-100 [&>button]:hover:bg-white/20">
          <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-background shadow-2xl">
            <div className="relative overflow-hidden bg-[#10263d] px-6 py-7 pr-14 text-white sm:px-8">
              <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-cyan-300/15 blur-3xl" />
              <DialogHeader className="relative space-y-3">
                <div className="text-left">
                  {loading ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-200/20 bg-cyan-100/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-100">
                      <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> Secure lookup running
                    </span>
                  ) : error ? (
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${error.kind === "not-configured" ? "bg-amber-100/15 text-amber-100" : "bg-rose-100/15 text-rose-100"}`}>
                      {error.kind === "not-configured" ? <CircleHelp className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                      {error.kind === "validation" ? "Check the identifier" : error.kind === "not-configured" ? "Provider unavailable" : "Lookup incomplete"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-100">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Response received
                    </span>
                  )}
                </div>
                <DialogTitle className="font-display text-2xl font-bold leading-tight text-white sm:text-[1.75rem]">
                  {loading ? "Your device check is in progress" : error?.kind === "validation" ? "Check the identifier" : error ? "We couldn't complete this check" : "Your check result is ready"}
                </DialogTitle>
                <DialogDescription className="max-w-lg text-left leading-6 text-slate-300">
                  {loading
                    ? "Your request is being sent to the configured lookup provider. This usually takes only a moment."
                    : error
                      ? "We will only show information returned by the configured service. No device status is guessed or filled in."
                      : "The response below is returned by the configured provider for this identifier."}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="space-y-5 p-5 sm:p-7">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border/80 bg-card px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Identifier</p>
                  <p className="mt-2 truncate font-mono text-sm font-semibold" title={identifier}>{identifier || "Not entered"}</p>
                </div>
                <div className="rounded-xl border border-border/80 bg-card px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Lookup provider</p>
                  <p className="mt-2 truncate text-sm font-semibold" title={provider ?? undefined}>{provider ?? "Waiting for provider response"}</p>
                </div>
              </div>

              {loading && (
                <div className="flex items-center gap-3 rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-cyan-950 dark:border-cyan-900/70 dark:bg-cyan-950/20 dark:text-cyan-100" role="status" data-testid="state-loading">
                  <LoaderCircle className="h-5 w-5 shrink-0 animate-spin" />
                  <div>
                    <p className="text-sm font-bold">Waiting for the configured provider</p>
                    <p className="mt-1 text-xs opacity-80">Keep this window open while the lookup completes.</p>
                  </div>
                </div>
              )}

              {!loading && error && (
                <div className={`rounded-xl border p-4 ${error.kind === "not-configured" ? "border-amber-200 bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/20" : "border-rose-200 bg-rose-50/70 dark:border-rose-900/60 dark:bg-rose-950/20"}`} role="alert" data-testid={`state-${error.kind}`}>
                  <div className="flex items-start gap-3">
                    {error.kind === "not-configured" ? <CircleHelp className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" /> : <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-700 dark:text-rose-300" />}
                    <div>
                      <p className="font-bold">{error.kind === "validation" ? "Review the value and try again" : error.kind === "not-configured" ? "This check is not configured" : "The provider returned an error"}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{error.message}</p>
                      {error.kind === "not-configured" && <p className="mt-3 text-xs leading-5 text-amber-900 dark:text-amber-200">An administrator needs to connect an active provider for <span className="font-mono">/{slug}</span>. iUnlockd does not substitute or invent lookup data.</p>}
                    </div>
                  </div>
                </div>
              )}

              {!loading && !error && result !== null && (
                <div data-testid="state-success">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-300"><FileSearch className="h-4 w-4" /> Live response received</p>
                    <span className="text-xs text-muted-foreground">Source: {provider}</span>
                  </div>
                  <pre className="max-h-[40vh] overflow-auto whitespace-pre-wrap break-words rounded-xl bg-[#122536] p-4 text-xs leading-6 text-slate-100 shadow-inner">{formatResult(result)}</pre>
                  <p className="mt-3 text-xs leading-5 text-muted-foreground">This is the response from the configured provider. iUnlockd does not alter it into a fabricated device status.</p>
                </div>
              )}

              {!loading && (
                <div className="flex flex-col-reverse gap-2 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  {error?.kind === "provider" ? (
                    <Button type="button" onClick={retry} className="rounded-xl bg-[#087e96] text-white hover:bg-[#066b80]">
                      <RefreshCw className="mr-2 h-4 w-4" /> Try again
                    </Button>
                  ) : <span className="hidden sm:block" />}
                  <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="rounded-xl">
                    {error?.kind === "validation" ? "Edit identifier" : "Close"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}