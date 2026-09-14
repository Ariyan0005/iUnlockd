import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertCircle, ArrowRight, CheckCircle2, Search, ShieldCheck } from "lucide-react";
import { useSEO } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type CheckPageConfig = {
  title: string;
  seoTitle: string;
  description: string;
  intro: string;
  inputLabel: string;
  placeholder: string;
  identifierParam: string;
};

export const CHECK_PAGE_CONFIG: Record<string, CheckPageConfig> = {
  "iphone-imei-check": {
    title: "iPhone IMEI Check",
    seoTitle: "iPhone IMEI Check Online — Device Status & Details | iUnlockd",
    description: "Check an iPhone IMEI for device details, carrier information, warranty signals, and availability of connected lookup providers.",
    intro: "Enter an iPhone IMEI to check device information and carrier status when the relevant provider is connected.",
    inputLabel: "iPhone IMEI",
    placeholder: "Enter a 14 or 15 digit iPhone IMEI",
    identifierParam: "imei",
  },
  "apple-serial-check": {
    title: "Apple Serial Check",
    seoTitle: "Apple Serial Number Check Online | iUnlockd",
    description: "Look up Apple device details with a serial number through a secure server-side provider connection.",
    intro: "Use an Apple serial number to request device details from your configured lookup provider.",
    inputLabel: "Apple serial number",
    placeholder: "Enter an Apple serial number",
    identifierParam: "serial",
  },
  "icloud-check": {
    title: "iCloud Check",
    seoTitle: "iCloud Check Online — Apple Device Status | iUnlockd",
    description: "Check an Apple device identifier for iCloud-related status through a secure provider connection.",
    intro: "Submit an IMEI or serial number to check the iCloud-related status returned by your connected provider.",
    inputLabel: "IMEI or serial number",
    placeholder: "Enter IMEI or serial number",
    identifierParam: "identifier",
  },
  "apple-warranty-check": {
    title: "Apple Warranty Check",
    seoTitle: "Apple Warranty Check Online — Coverage Lookup | iUnlockd",
    description: "Check Apple warranty and coverage details using an IMEI or serial number.",
    intro: "Check coverage information without exposing your provider credentials to the browser.",
    inputLabel: "IMEI or serial number",
    placeholder: "Enter IMEI or serial number",
    identifierParam: "identifier",
  },
  "iphone-carrier-check": {
    title: "iPhone Carrier Check",
    seoTitle: "iPhone Carrier Check Online — Network Status | iUnlockd",
    description: "Check an iPhone carrier and network status using a secure server-side lookup.",
    intro: "Find the carrier information returned for an iPhone identifier by your configured provider.",
    inputLabel: "iPhone IMEI",
    placeholder: "Enter a 14 or 15 digit iPhone IMEI",
    identifierParam: "imei",
  },
  "samsung-imei-check": {
    title: "Samsung IMEI Check",
    seoTitle: "Samsung IMEI Check Online — Device Lookup | iUnlockd",
    description: "Check Samsung device details and status using an IMEI lookup provider.",
    intro: "Enter a Samsung IMEI for a server-side lookup of device and network information.",
    inputLabel: "Samsung IMEI",
    placeholder: "Enter a 14 or 15 digit Samsung IMEI",
    identifierParam: "imei",
  },
  "xiaomi-mi-status-check": {
    title: "Xiaomi Mi Status Check",
    seoTitle: "Xiaomi Mi Status Check Online | iUnlockd",
    description: "Check Xiaomi device status and identifier details through a secure lookup provider.",
    intro: "Enter a Xiaomi IMEI or serial number to request the status available from your connected provider.",
    inputLabel: "Xiaomi IMEI or serial",
    placeholder: "Enter IMEI or serial number",
    identifierParam: "identifier",
  },
  "google-pixel-imei-check": {
    title: "Google Pixel IMEI Check",
    seoTitle: "Google Pixel IMEI Check Online | iUnlockd",
    description: "Check Google Pixel device details and carrier status with an IMEI lookup.",
    intro: "Enter a Google Pixel IMEI for a secure device lookup.",
    inputLabel: "Google Pixel IMEI",
    placeholder: "Enter a 14 or 15 digit Pixel IMEI",
    identifierParam: "imei",
  },
  "imei-blacklist-check": {
    title: "IMEI Blacklist Check",
    seoTitle: "IMEI Blacklist Check Online — Lost or Stolen Status | iUnlockd",
    description: "Check whether an IMEI is reported as blocked or blacklisted when a blacklist provider is connected.",
    intro: "Check the blacklist status returned by your configured provider. No result is invented when the provider is not connected.",
    inputLabel: "IMEI",
    placeholder: "Enter a 14 or 15 digit IMEI",
    identifierParam: "imei",
  },
  "fmi-check": {
    title: "FMI Check",
    seoTitle: "FMI Check Online — Find My iPhone Status | iUnlockd",
    description: "Check Find My iPhone status through a secure, server-side provider connection.",
    intro: "Enter an Apple IMEI or serial number to request Find My iPhone status from your connected provider.",
    inputLabel: "IMEI or serial number",
    placeholder: "Enter IMEI or serial number",
    identifierParam: "identifier",
  },
};

const RELATED_CHECKS = [
  ["imei-checker", "IMEI Checker"],
  ["iphone-imei-check", "iPhone IMEI Check"],
  ["apple-serial-check", "Apple Serial Check"],
  ["icloud-check", "iCloud Check"],
  ["apple-warranty-check", "Apple Warranty Check"],
  ["iphone-carrier-check", "iPhone Carrier Check"],
  ["samsung-imei-check", "Samsung IMEI Check"],
  ["xiaomi-mi-status-check", "Xiaomi Mi Status Check"],
  ["google-pixel-imei-check", "Google Pixel IMEI Check"],
  ["imei-blacklist-check", "IMEI Blacklist Check"],
  ["fmi-check", "FMI Check"],
];

function formatResult(value: unknown) {
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

export default function DeviceCheckPage() {
  const { slug = "imei-blacklist-check" } = useParams();
  const config = CHECK_PAGE_CONFIG[slug] ?? CHECK_PAGE_CONFIG["imei-blacklist-check"];
  useSEO(config.seoTitle, config.description);

  const [identifier, setIdentifier] = useState("");
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = identifier.trim();
    if (!value) {
      setError(`Enter a ${config.inputLabel.toLowerCase()} first.`);
      setResult(null);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch(`/api/checks/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: value }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? "The lookup provider is not available yet.");
      } else {
        setResult(data.data);
      }
    } catch {
      setError("Unable to reach the lookup service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-background text-foreground pb-16">
      <section className="relative overflow-hidden px-4 py-16 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.2),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.2),transparent_35%)]" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-200">
            <ShieldCheck className="w-3.5 h-3.5" /> Secure server-side device lookup
          </div>
          <h1 className="mt-5 text-4xl md:text-5xl font-black tracking-tight">{config.title}</h1>
          <p className="mt-4 mx-auto max-w-2xl text-slate-300 leading-relaxed">{config.intro}</p>
          <form onSubmit={submit} className="mt-8 mx-auto max-w-2xl rounded-2xl border border-white/15 bg-white/10 p-2 backdrop-blur-xl">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder={config.placeholder}
                aria-label={config.inputLabel}
                className="min-w-0 flex-1 rounded-xl bg-white px-4 py-3.5 font-mono text-slate-900 outline-none ring-cyan-400 focus:ring-2"
              />
              <Button type="submit" disabled={loading} className="h-auto rounded-xl bg-cyan-500 px-6 py-3.5 font-semibold text-slate-950 hover:bg-cyan-300">
                <Search className="mr-2 h-4 w-4" /> {loading ? "Checking…" : "Check now"}
              </Button>
            </div>
          </form>
        </div>
      </section>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 md:grid-cols-[1.35fr_0.65fr]">
        <Card className="border-border bg-card/95 shadow-xl">
          <CardContent className="p-6 md:p-8">
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{error}</span>
              </div>
            )}
            {result !== null ? (
              <div>
                <div className="mb-4 flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <h2 className="font-semibold">Provider response</h2>
                </div>
                <pre className="max-h-[520px] overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-relaxed text-slate-100">{formatResult(result)}</pre>
              </div>
            ) : !error ? (
              <div className="py-12 text-center text-muted-foreground">
                <Search className="mx-auto mb-3 h-9 w-9 opacity-30" />
                <p>Enter an identifier to start a lookup.</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <aside className="space-y-6">
          <Card className="border-border">
            <CardContent className="p-6">
              <h2 className="font-bold">Related device checks</h2>
              <div className="mt-4 grid gap-1">
                {RELATED_CHECKS.filter(([path]) => path !== slug).map(([path, label]) => (
                  <Link key={path} to={`/${path}`} className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-primary/10 hover:text-primary">
                    {label}<ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="border-cyan-500/20 bg-cyan-500/5">
            <CardContent className="p-6 text-sm text-muted-foreground">
              <h2 className="font-bold text-foreground">How this works</h2>
              <p className="mt-2 leading-relaxed">Your identifier is sent to iUnlockd&apos;s server. The configured provider key stays server-side and is never included in the browser response.</p>
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  );
}