import { type FormEvent, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CircleHelp,
  Clock3,
  ExternalLink,
  FileSearch,
  Hash,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { useSEO } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
    seoTitle: "Free IMEI & TAC Checker Online | iUnlockd",
    description: "Check a phone IMEI through iUnlockd's configured provider before you buy, sell, or service a device.",
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
    seoTitle: "iPhone IMEI Check Online — Device Status | iUnlockd",
    description: "Check an iPhone IMEI through a configured server-side provider with iUnlockd.",
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
    seoTitle: "Apple Serial Number Check Online | iUnlockd",
    description: "Look up Apple device details with a serial number through a configured iUnlockd provider.",
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
    seoTitle: "iCloud Status Check Online — Apple Device Lookup | iUnlockd",
    description: "Check an Apple device's iCloud-related status through a configured provider route.",
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
    seoTitle: "Apple Warranty Check Online — Coverage Lookup | iUnlockd",
    description: "Request Apple warranty and coverage information using an IMEI or serial number.",
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
    seoTitle: "iPhone Carrier Check Online — Network Status | iUnlockd",
    description: "Check iPhone carrier and network status using a secure, configured server-side lookup.",
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
    seoTitle: "Samsung IMEI Check Online — Device Lookup | iUnlockd",
    description: "Check Samsung device details and status using a configured iUnlockd IMEI provider.",
    intro: "Enter a Samsung IMEI for a server-side request for the device and network information your provider supports.",
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
    seoTitle: "Xiaomi Mi Status Check Online | iUnlockd",
    description: "Check Xiaomi device status and identifier details through a configured iUnlockd provider.",
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
    seoTitle: "Google Pixel IMEI Check Online | iUnlockd",
    description: "Check Google Pixel device details and carrier status with a configured IMEI lookup.",
    intro: "Enter a Google Pixel IMEI for a secure request to the provider configured for this route.",
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
    seoTitle: "IMEI Blacklist Check Online — Lost or Stolen Status | iUnlockd",
    description: "Check whether an IMEI is reported as blocked or blacklisted by the provider configured for iUnlockd.",
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
    seoTitle: "Find My iPhone FMI Check Online | iUnlockd",
    description: "Check Find My iPhone status through a secure, server-side provider connection.",
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
  const slug = fixedSlug ?? params.slug ?? "imei-checker";
  const config = CHECK_PAGE_CONFIG[slug] ?? CHECK_PAGE_CONFIG["imei-checker"];
  const [identifier, setIdentifier] = useState("");
  const [result, setResult] = useState<unknown>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [error, setError] = useState<{ kind: "validation" | "not-configured" | "provider"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useSEO(config.seoTitle, config.description);

  const relatedChecks = useMemo(
    () => config.related.map((relatedSlug) => ({ slug: relatedSlug, label: CHECK_PAGE_CONFIG[relatedSlug]?.title ?? relatedSlug })),
    [config.related],
  );

  const retry = () => {
    void submit({ preventDefault: () => undefined } as FormEvent);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const value = identifier.trim();
    setHasSubmitted(true);
    setResult(null);
    setProvider(null);
    setError(null);
    if (!value) {
      setError({ kind: "validation", message: `Enter a ${config.inputLabel.toLowerCase()} to begin.` });
      return;
    }
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
      <section className="relative isolate border-b border-white/10 bg-[#10263d] px-4 pb-14 pt-12 text-white sm:pb-20 sm:pt-16">
        <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(#5ed7df_1px,transparent_1px)] [background-size:22px_22px]" />
        <div className="pointer-events-none absolute -right-32 -top-40 h-[28rem] w-[28rem] rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="relative mx-auto max-w-6xl">
          <div className="grid items-end gap-10 lg:grid-cols-[1fr_0.92fr]">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-200/25 bg-cyan-100/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-cyan-100">
                <ShieldCheck className="h-3.5 w-3.5" /> {config.eyebrow}
              </div>
              <h1 className="max-w-2xl font-display text-4xl font-bold leading-[1.03] tracking-[-0.035em] text-balance sm:text-6xl">
                {config.title}
                <span className="mt-3 block text-cyan-300">before it costs you.</span>
              </h1>
              <p className="mt-5 max-w-xl text-[15px] leading-7 text-slate-300 sm:text-lg">{config.intro}</p>
              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-300">
                <span className="inline-flex items-center gap-1.5"><LockKeyhole className="h-3.5 w-3.5 text-cyan-300" /> Provider keys stay server-side</span>
                <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5 text-cyan-300" /> One request, one clear response</span>
              </div>
            </div>

            <div className="rounded-[1.65rem] border border-white/15 bg-white/[0.085] p-2 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
              <form onSubmit={submit} className="rounded-2xl bg-[#f4f8f9] p-4 text-foreground sm:p-5" data-testid={`form-check-${slug}`}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <label htmlFor="device-identifier" className="text-sm font-bold">{config.inputLabel}</label>
                  <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-800">Secure request</span>
                </div>
                <div className="relative">
                  <Hash className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-700" />
                  <input
                    id="device-identifier"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    placeholder={config.placeholder}
                    aria-label={config.inputLabel}
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
          </div>
        </div>
      </section>

      <main className="relative mx-auto grid max-w-6xl gap-7 px-4 py-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-7">
          <AdReserve label="top ad" />
          <Card className="overflow-hidden border-border/80 bg-card/90 shadow-sm" data-testid="card-check-result">
            <CardContent className="p-0">
              <div className="flex items-center justify-between border-b border-border/80 px-5 py-4 sm:px-7">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">Check result</p>
                  <h2 className="mt-1 font-display text-xl font-bold">What the provider returned</h2>
                </div>
                {result !== null && <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5" /> Complete</span>}
              </div>
              <div className="min-h-[245px] p-5 sm:p-7">
                {loading && (
                  <div className="space-y-4" data-testid="state-loading">
                    <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                    <div className="h-24 animate-pulse rounded-xl bg-muted" />
                    <div className="grid gap-3 sm:grid-cols-2"><div className="h-12 animate-pulse rounded-lg bg-muted" /><div className="h-12 animate-pulse rounded-lg bg-muted" /></div>
                    <p className="flex items-center gap-2 text-xs text-muted-foreground"><LoaderCircle className="h-3.5 w-3.5 animate-spin" /> Waiting for the configured provider…</p>
                  </div>
                )}
                {!loading && error && (
                  <div className={`rounded-2xl border p-5 ${error.kind === "not-configured" ? "border-amber-200 bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/20" : "border-rose-200 bg-rose-50/70 dark:border-rose-900/60 dark:bg-rose-950/20"}`} data-testid={`state-${error.kind}`}>
                    <div className="flex items-start gap-3">
                      {error.kind === "not-configured" ? <CircleHelp className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" /> : <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-700" />}
                      <div>
                        <h3 className="font-bold">{error.kind === "not-configured" ? "This check is not configured" : "Provider error"}</h3>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">{error.message}</p>
                        {error.kind === "not-configured" && <p className="mt-3 text-xs font-medium text-amber-800 dark:text-amber-200">An administrator needs to connect an active provider for <span className="font-mono">/{slug}</span>. iUnlockd does not substitute or invent lookup data.</p>}
                      </div>
                    </div>
                    {error.kind === "provider" && <Button onClick={retry} variant="outline" size="sm" className="mt-4"><RefreshCw className="mr-2 h-3.5 w-3.5" /> Try again</Button>}
                  </div>
                )}
                {!loading && !error && result !== null && (
                  <div data-testid="state-success">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                      <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300"><FileSearch className="h-4 w-4" /> Live response received</p>
                      <span className="text-xs text-muted-foreground">Source: {provider}</span>
                    </div>
                    <pre className="max-h-[460px] overflow-auto rounded-xl bg-[#122536] p-4 text-xs leading-6 text-slate-100 shadow-inner">{formatResult(result)}</pre>
                    <p className="mt-3 text-xs leading-5 text-muted-foreground">This is the response from the configured provider. iUnlockd does not alter it into a fabricated device status.</p>
                  </div>
                )}
                {!loading && !error && result === null && (
                  <div className="flex min-h-[195px] flex-col items-center justify-center text-center" data-testid="state-empty">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300"><Smartphone className="h-7 w-7" /></div>
                    <h3 className="font-display text-lg font-bold">Your result will appear here</h3>
                    <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">Enter an identifier above. We will show a response only when the provider route returns one.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <AdReserve label="middle ad" />

          <section className="rounded-2xl border border-border/80 bg-card/60 p-5 sm:p-7">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-cyan-100 p-2.5 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300"><LockKeyhole className="h-5 w-5" /></div>
              <div>
                <h2 className="font-display text-xl font-bold">A lookup, not a guess</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Your identifier is sent to iUnlockd's server. The provider key stays server-side. If the route is not configured or the provider fails, you see that state clearly instead of receiving a made-up clean, locked, or covered status.</p>
              </div>
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">Keep checking</p><h2 className="mt-1 font-display text-2xl font-bold">More device checks</h2></div>
              <Link to="/imei-checker" className="hidden items-center gap-1 text-sm font-semibold text-primary hover:underline sm:inline-flex">Main checker <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {relatedChecks.map((related) => (
                <Link key={related.slug} to={`/${related.slug}`} data-testid={`link-related-${related.slug}`} className="group rounded-2xl border border-border/80 bg-card p-4 transition-transform hover:-translate-y-0.5 hover:border-cyan-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
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
                <Link key={check.slug} to={`/${check.slug}`} data-testid={`link-check-${check.slug}`} className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                  <span>{check.label}</span><ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ))}
            </div>
          </section>
          <section className="rounded-2xl bg-[#d9f1ef] p-5 text-[#16484d] dark:bg-[#163d42] dark:text-cyan-50">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/70 text-cyan-800 dark:bg-white/10 dark:text-cyan-200"><CircleHelp className="h-4 w-4" /></div>
            <h2 className="mt-4 font-display font-bold">Not sure where to start?</h2>
            <p className="mt-2 text-sm leading-6 opacity-80">Start with the main IMEI checker. From there you can move to carrier, blacklist, iCloud, warranty, and brand-specific routes.</p>
            <Link to="/imei-checker" className="mt-4 inline-flex items-center gap-2 text-sm font-bold underline underline-offset-4" data-testid="link-main-checker">Open main checker <ArrowRight className="h-3.5 w-3.5" /></Link>
          </section>
        </aside>
      </main>
    </div>
  );
}