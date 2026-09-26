import { Link, useNavigate } from "react-router-dom";
import { useSEO } from "@/lib/seo";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BadgeCheck,
  Cable,
  Check,
  ChevronRight,
  Clock3,
  Cpu,
  Globe2,
  KeyRound,
  LockKeyhole,
  ScanLine,
  Server,
  ShieldCheck,
  Smartphone,
  Wrench,
} from "lucide-react";

const SERVICE_LINES = [
  {
    index: "01",
    icon: Smartphone,
    label: "IMEI Services",
    title: "Unlock phones by IMEI or serial.",
    description:
      "IMEI and serial-based phone unlocks, MDM unlock, iCloud bypass, FRP unlock, and network unlock services.",
    href: "/imei-services",
    action: "Explore IMEI services",
    tone: "bg-blue-50 border-blue-200/80",
  },
  {
    index: "02",
    icon: Server,
    label: "Server Services",
    title: "Buy and renew software access.",
    description:
      "Software subscriptions, renewals, licenses, and server-based products for unlocking workflows.",
    href: "/server-services",
    action: "Explore server services",
    tone: "bg-indigo-50 border-indigo-200/80",
  },
  {
    index: "03",
    icon: Wrench,
    label: "Tool Activation & Credits",
    title: "Tools, subscriptions, and credits.",
    description:
      "Purchase unlock-related tools, tool subscriptions, activations, and credit packs for your technician workflow.",
    href: "/tool-activation-credits",
    action: "View tool activations",
    tone: "bg-cyan-50 border-cyan-200/80",
  },
  {
    index: "04",
    icon: Wrench,
    label: "Tool Rent",
    title: "Rent the tool when you need it.",
    description:
      "Rent unlock-related tools for temporary access, technician jobs, and short-term device service workflows.",
    href: "/tool-rent",
    action: "Explore tool rentals",
    tone: "bg-sky-50 border-sky-200/80",
  },
];

const CHECKS = [
  ["iPhone IMEI Check", "/iphone-imei-check"],
  ["Apple Serial Check", "/apple-serial-check"],
  ["iCloud Check", "/icloud-check"],
  ["Apple Warranty", "/apple-warranty-check"],
  ["Carrier Check", "/iphone-carrier-check"],
  ["Samsung IMEI", "/samsung-imei-check"],
  ["Xiaomi Mi Status", "/xiaomi-mi-status-check"],
  ["Blacklist Check", "/imei-blacklist-check"],
];

const WORKFLOW = [
  {
    number: "01",
    icon: ScanLine,
    title: "Choose the right route",
    description: "Start with an IMEI service, a server workflow, or technician tool access.",
  },
  {
    number: "02",
    icon: Cable,
    title: "Send clean device details",
    description: "Each service page shows the inputs, pricing, and processing expectations up front.",
  },
  {
    number: "03",
    icon: BadgeCheck,
    title: "Track the outcome",
    description: "Keep your orders, balance, and service history in one professional workspace.",
  },
];

export default function Home() {
  useSEO(
    "iUnlockd — Professional IMEI & Unlock Services",
    "One service marketplace for IMEI and serial unlocks, server software, tool activations, credits, and tool rentals."
  );
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="overflow-hidden">
      <section className="relative px-4 pb-16 pt-10 md:pb-24 md:pt-16">
        <div className="signal-grid pointer-events-none absolute inset-x-0 top-0 h-[34rem] opacity-80" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_.95fr] lg:gap-20">
          <div className="relative z-10">
            <Badge className="mb-6 gap-2 border border-blue-200 bg-blue-50 px-3 py-1.5 text-blue-700 hover:bg-blue-50">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              The professional unlock desk
            </Badge>
            <h1 className="max-w-3xl font-display text-5xl font-semibold leading-[1.02] tracking-[-0.045em] text-slate-950 md:text-7xl">
              The faster way to move a device from <span className="text-gradient-blue">locked to ready.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600 md:text-xl">
              iUnlockd brings IMEI and serial unlocks, server software, tool access, credits, and rentals into one reliable marketplace.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button data-testid="button-browse-imei-services" size="lg" className="h-12 px-6 shadow-[0_10px_24px_hsl(221_83%_53%/.22)]" onClick={() => navigate("/imei-services")}>
                Browse IMEI services
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button data-testid="button-open-tool-access" size="lg" variant="outline" className="h-12 border-slate-300 bg-background/70 px-6" onClick={() => navigate("/tool-activation-credits")}>
                Tool Activation &amp; Credits
              </Button>
            </div>
            {user ? (
              <div className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-blue-200/70 bg-blue-50/75 px-4 py-3 text-sm text-slate-700">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <span>Welcome back, <strong className="text-slate-950">{user.name}</strong>. Balance: <strong className="text-blue-700">${parseFloat(user.balance).toFixed(2)}</strong></span>
              </div>
            ) : (
              <p className="mt-7 flex items-center gap-2 text-sm font-medium text-slate-500">
                <LockKeyhole className="h-4 w-4 text-blue-600" />
                Secure account workspace for every order
              </p>
            )}
          </div>

          <div className="surface-navy relative min-h-[28rem] overflow-hidden rounded-[2rem] p-6 shadow-[0_28px_70px_hsl(222_47%_14%/.23)] md:p-8">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl" />
            <div className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />
            <div className="relative flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[.24em] text-blue-200/70">Workspace / live desk</p>
                  <p className="mt-2 font-display text-xl font-semibold text-white">Service control</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
                  <Cpu className="h-5 w-5 text-blue-200" />
                </div>
              </div>
              <div className="mt-7 rounded-2xl border border-white/10 bg-white/[.06] p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-100/70">Recommended starting point</span>
                  <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.16em] text-emerald-200">Ready</span>
                </div>
                <p className="mt-8 font-display text-3xl font-semibold tracking-tight text-white">Device intelligence</p>
                <p className="mt-2 max-w-xs text-sm leading-6 text-blue-100/65">Check status, carrier, warranty, and risk before choosing an unlock route.</p>
                <Button data-testid="button-run-device-check" variant="secondary" className="mt-6 h-10 bg-white text-slate-950 hover:bg-blue-50" onClick={() => navigate("/imei-checker")}>
                  Run an IMEI check
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <div className="mt-auto grid grid-cols-2 gap-3 pt-6">
                <div className="rounded-2xl border border-white/10 bg-white/[.045] p-4">
                  <Globe2 className="h-4 w-4 text-cyan-200" />
                  <p className="mt-3 text-sm font-medium text-white">Carrier coverage</p>
                  <p className="mt-1 text-xs text-blue-100/55">Global service catalog</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[.045] p-4">
                  <Clock3 className="h-4 w-4 text-blue-200" />
                  <p className="mt-3 text-sm font-medium text-white">Clear timing</p>
                  <p className="mt-1 text-xs text-blue-100/55">Processing shown first</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-blue-100/80 bg-blue-50/55 px-4 py-5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-sm">
          <p className="font-medium text-slate-700">Built for the people behind every successful device handoff.</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-slate-500">
            <span className="inline-flex items-center gap-2"><Wrench className="h-4 w-4 text-blue-600" /> Technicians</span>
            <span className="inline-flex items-center gap-2"><Globe2 className="h-4 w-4 text-blue-600" /> Resellers</span>
            <span className="inline-flex items-center gap-2"><Smartphone className="h-4 w-4 text-blue-600" /> Device owners</span>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[.22em] text-blue-600">One marketplace, four routes</p>
              <h2 className="mt-3 max-w-2xl font-display text-4xl font-semibold tracking-[-.035em] text-slate-950 md:text-5xl">Start with the service your device actually needs.</h2>
            </div>
            <Link data-testid="link-all-services" to="/services" className="group inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800">
              View all services <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICE_LINES.map((service) => {
              const Icon = service.icon;
              return (
                <Link data-testid={`card-service-${service.index}`} to={service.href} key={service.index} className={`interactive-lift group rounded-[1.5rem] border p-6 shadow-[0_12px_30px_hsl(222_47%_14%/.05)] ${service.tone}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="font-mono text-xs font-semibold tracking-[.2em] text-slate-400">{service.index}</span>
                  </div>
                  <p className="mt-8 text-xs font-bold uppercase tracking-[.17em] text-blue-700">{service.label}</p>
                  <h3 className="mt-3 font-display text-2xl font-semibold tracking-[-.025em] text-slate-950">{service.title}</h3>
                  <p className="mt-3 min-h-[4.5rem] text-sm leading-6 text-slate-600">{service.description}</p>
                  <span className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-950">
                    {service.action}<ChevronRight className="h-4 w-4 text-blue-600 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="surface-navy relative overflow-hidden px-4 py-20 md:py-24">
        <div className="absolute inset-0 opacity-50 signal-grid" />
        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[.22em] text-blue-200">A cleaner operating rhythm</p>
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-[-.04em] text-white md:text-5xl">Less guesswork. More devices out the door.</h2>
            <p className="mt-5 max-w-md text-base leading-7 text-blue-100/65">From first check to final order, the service flow stays focused on the details technicians and customers need.</p>
          </div>
          <div className="grid gap-3">
            {WORKFLOW.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="flex gap-5 rounded-2xl border border-white/10 bg-white/[.055] p-5 transition-colors hover:bg-white/[.09]">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-blue-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] tracking-[.18em] text-blue-200/65">{step.number}</span>
                      <h3 className="font-semibold text-white">{step.title}</h3>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-blue-100/60">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[.22em] text-blue-600">Device intelligence</p>
              <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-.035em] text-slate-950">Check first. Unlock with context.</h2>
              <p className="mt-4 max-w-xl text-slate-600">Use the right check for the brand and decision in front of you. No account required to browse the tools.</p>
            </div>
            <Button data-testid="button-open-checker" variant="outline" className="w-fit border-slate-300" onClick={() => navigate("/imei-checker")}>
              Open IMEI checker <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div className="mt-9 grid grid-cols-2 gap-3 md:grid-cols-4">
            {CHECKS.map(([label, href]) => (
              <Link data-testid={`link-device-check-${href.slice(1)}`} key={href} to={href} className="group flex min-h-20 items-center justify-between rounded-2xl border border-slate-200 bg-card px-4 py-4 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:text-blue-700 hover:shadow-md">
                <span>{label}</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-blue-500 transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {!user && (
        <section className="px-4 pb-20 md:pb-28">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 rounded-[1.75rem] border border-blue-200 bg-blue-50/70 p-7 md:flex-row md:items-center md:p-10">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-700"><KeyRound className="h-4 w-4" /> A workspace that remembers your work</div>
              <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold tracking-[-.03em] text-slate-950 md:text-4xl">Create an account when you are ready to place an order.</h2>
              <p className="mt-3 max-w-xl text-slate-600">Keep service history, deposits, invoices, and account actions in one secure place.</p>
            </div>
            <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row">
              <Button data-testid="button-create-account" size="lg" onClick={() => navigate("/register")}>Create an account <ArrowRight className="ml-2 h-4 w-4" /></Button>
              <Button data-testid="button-sign-in" size="lg" variant="outline" onClick={() => navigate("/login")}>Sign in</Button>
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-slate-200 px-4 py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-blue-600" /> Built for clear, accountable service decisions.</p>
          <Link to="/contact" className="font-semibold text-blue-700 hover:text-blue-800">Talk to support <ArrowRight className="ml-1 inline h-3.5 w-3.5" /></Link>
        </div>
      </section>
    </div>
  );
}