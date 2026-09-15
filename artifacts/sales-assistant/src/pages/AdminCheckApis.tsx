import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  ServerCog,
  ShieldCheck,
  Trash2,
  Wifi,
  X,
  XCircle,
} from "lucide-react";
import { useSEO } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Provider = {
  id: number;
  slug: string;
  name: string;
  apiEndpoint: string;
  apiUser?: string | null;
  apiFormat: string;
  httpMethod: string;
  identifierParam: string;
  apiKeyLocation: string;
  apiKeyParam: string;
  responseFormat: string;
  responseFormatParam: string;
  staticQuery?: string | null;
  description?: string | null;
  isActive: boolean;
  apiKeySet?: boolean;
};

type ProviderForm = {
  slug: string;
  name: string;
  apiEndpoint: string;
  apiKey: string;
  apiUser: string;
  apiFormat: string;
  httpMethod: string;
  identifierParam: string;
  apiKeyLocation: string;
  apiKeyParam: string;
  responseFormat: string;
  responseFormatParam: string;
  staticQuery: string;
  description: string;
  isActive: boolean;
};

const CHECK_SLUGS = [
  "imei-checker",
  "iphone-imei-check",
  "apple-serial-check",
  "icloud-check",
  "apple-warranty-check",
  "iphone-carrier-check",
  "samsung-imei-check",
  "xiaomi-mi-status-check",
  "google-pixel-imei-check",
  "imei-blacklist-check",
  "fmi-check",
];

const EMPTY_FORM: ProviderForm = {
  slug: "imei-checker",
  name: "",
  apiEndpoint: "",
  apiKey: "",
  apiUser: "",
  apiFormat: "rest",
  httpMethod: "GET",
  identifierParam: "imei",
  apiKeyLocation: "header",
  apiKeyParam: "X-API-Key",
  responseFormat: "json",
  responseFormatParam: "format",
  staticQuery: "",
  description: "",
  isActive: false,
};

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("iu_token") ?? ""}` };
}

export default function AdminCheckApis() {
  useSEO("Check API Providers — Admin | iUnlockd", "Configure server-side device check providers for iUnlockd public verification routes.");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [form, setForm] = useState<ProviderForm>(EMPTY_FORM);
  const [editing, setEditing] = useState<Provider | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "info" | "error"; text: string } | null>(null);
  const [testValues, setTestValues] = useState<Record<number, string>>({});
  const [testResults, setTestResults] = useState<Record<number, { ok: boolean; message: string }>>({});
  const [testing, setTesting] = useState<number | null>(null);
  const [showKey, setShowKey] = useState(false);

  const loadProviders = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/check-providers", { headers: authHeaders() });
      const data = await response.json().catch(() => []);
      if (!response.ok) throw new Error(data?.error ?? "Unable to load providers.");
      setProviders(Array.isArray(data) ? data : Array.isArray(data?.providers) ? data.providers : []);
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Unable to load providers." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadProviders(); }, []);

  const setField = <K extends keyof ProviderForm>(field: K, value: ProviderForm[K]) => setForm((previous) => ({ ...previous, [field]: value }));

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowKey(false);
    setShowForm(true);
    setMessage(null);
  };

  const openEdit = (provider: Provider) => {
    setEditing(provider);
    setForm({
      slug: provider.slug,
      name: provider.name,
      apiEndpoint: provider.apiEndpoint,
      apiKey: "",
      apiUser: provider.apiUser ?? "",
      apiFormat: provider.apiFormat,
      httpMethod: provider.httpMethod,
      identifierParam: provider.identifierParam,
      apiKeyLocation: provider.apiKeyLocation ?? "header",
      apiKeyParam: provider.apiKeyParam ?? "X-API-Key",
      responseFormat: provider.responseFormat ?? "json",
      responseFormatParam: provider.responseFormatParam ?? "format",
      staticQuery: provider.staticQuery ?? "",
      description: provider.description ?? "",
      isActive: provider.isActive,
    });
    setShowKey(false);
    setShowForm(true);
    setMessage(null);
  };

  const save = async () => {
    if (!form.slug || !form.name || !form.apiEndpoint || (!editing && !form.apiKey)) {
      setMessage({ tone: "error", text: "Slug, provider name, endpoint, and a provider key for new records are required." });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(editing ? `/api/admin/check-providers/${editing.id}` : "/api/admin/check-providers", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error ?? "Could not save provider.");
      setShowForm(false);
      setMessage({ tone: "info", text: editing ? "Provider updated. The stored key remains masked." : "Provider added. It is ready for a connection test." });
      await loadProviders();
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Network error while saving provider." });
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (provider: Provider) => {
    const response = await fetch(`/api/admin/check-providers/${provider.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ isActive: !provider.isActive }),
    });
    if (response.ok) {
      setMessage({ tone: "info", text: `${provider.name} is now ${provider.isActive ? "inactive" : "active"}.` });
      await loadProviders();
    } else {
      setMessage({ tone: "error", text: "Could not change provider status." });
    }
  };

  const remove = async (provider: Provider) => {
    if (!window.confirm(`Delete ${provider.name}? This removes the provider configuration.`)) return;
    const response = await fetch(`/api/admin/check-providers/${provider.id}`, { method: "DELETE", headers: authHeaders() });
    if (response.ok) {
      setMessage({ tone: "info", text: "Provider deleted." });
      await loadProviders();
    } else setMessage({ tone: "error", text: "Could not delete provider." });
  };

  const test = async (provider: Provider) => {
    const identifier = testValues[provider.id]?.trim();
    if (!identifier) {
      setTestResults((previous) => ({ ...previous, [provider.id]: { ok: false, message: "Enter a sample identifier first." } }));
      return;
    }
    setTesting(provider.id);
    try {
      const response = await fetch(`/api/admin/check-providers/${provider.id}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ identifier }),
      });
      const data = await response.json().catch(() => ({}));
      setTestResults((previous) => ({
        ...previous,
        [provider.id]: { ok: Boolean(response.ok && data.ok), message: response.ok && data.ok ? `Connected · HTTP ${data.httpStatus ?? "200"}` : (data.error ?? `Provider returned HTTP ${data.httpStatus ?? response.status}`) },
      }));
    } catch {
      setTestResults((previous) => ({ ...previous, [provider.id]: { ok: false, message: "Network error during test." } }));
    } finally {
      setTesting(null);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background px-4 py-7 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-7">
        <header className="flex flex-col gap-5 border-b border-border/80 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link to="/admin" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"><ArrowLeft className="h-4 w-4" /> Admin panel</Link>
            <div className="flex items-start gap-3">
              <div className="hidden rounded-2xl bg-[#10263d] p-3 text-cyan-300 sm:block"><ServerCog className="h-6 w-6" /></div>
              <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">Operations / providers</p><h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Check API connections</h1><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Manage the provider behind each public verification route. Keys are accepted by the server and never rendered back into this screen.</p></div>
            </div>
          </div>
          <Button onClick={openNew} data-testid="button-add-provider" className="rounded-xl"><Plus className="mr-2 h-4 w-4" /> Add provider</Button>
        </header>

        {message && <div data-testid="status-admin-message" className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${message.tone === "error" ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-200" : "border-cyan-200 bg-cyan-50 text-cyan-900 dark:border-cyan-900/60 dark:bg-cyan-950/20 dark:text-cyan-100"}`}><Activity className="mt-0.5 h-4 w-4 shrink-0" />{message.text}</div>}

        {showForm && (
          <Card className="overflow-hidden border-cyan-200 shadow-md dark:border-cyan-900/60">
            <div className="flex items-center justify-between border-b border-border bg-muted/40 px-5 py-4 sm:px-6">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">{editing ? "Edit connection" : "New connection"}</p><h2 className="mt-1 font-display text-xl font-bold">{editing ? editing.name : "Add a check provider"}</h2></div>
              <button type="button" onClick={() => setShowForm(false)} aria-label="Close provider form" data-testid="button-close-provider-form" className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <CardContent className="space-y-5 p-5 sm:p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div><Label htmlFor="provider-slug">Public route slug</Label><select id="provider-slug" value={form.slug} onChange={(event) => setField("slug", event.target.value)} data-testid="select-provider-slug" className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15">{CHECK_SLUGS.map((slug) => <option key={slug} value={slug}>{slug}</option>)}</select><p className="mt-1 text-xs text-muted-foreground">Must match one public check route.</p></div>
                <div><Label htmlFor="provider-name">Provider name</Label><Input id="provider-name" value={form.name} onChange={(event) => setField("name", event.target.value)} placeholder="Example: GSMA Lookup" data-testid="input-provider-name" className="mt-1.5" /></div>
                <div className="md:col-span-2"><Label htmlFor="provider-endpoint">API endpoint</Label><Input id="provider-endpoint" value={form.apiEndpoint} onChange={(event) => setField("apiEndpoint", event.target.value)} placeholder="https://provider.example/v1/check" data-testid="input-provider-endpoint" className="mt-1.5 font-mono text-xs" /></div>
                <div><Label htmlFor="provider-key">API key {editing ? <span className="font-normal text-muted-foreground">(blank keeps current)</span> : "*"}</Label><div className="relative mt-1.5"><Input id="provider-key" type={showKey ? "text" : "password"} value={form.apiKey} onChange={(event) => setField("apiKey", event.target.value)} autoComplete="new-password" data-testid="input-provider-key" className="pr-11 font-mono text-xs" placeholder={editing ? "Stored key is masked" : "Paste provider key"} /><button type="button" onClick={() => setShowKey((current) => !current)} aria-label={showKey ? "Hide API key" : "Show API key"} data-testid="button-toggle-provider-key" className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground hover:text-foreground">{showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
                <div><Label htmlFor="provider-user">API user / partner ID</Label><Input id="provider-user" value={form.apiUser} onChange={(event) => setField("apiUser", event.target.value)} data-testid="input-provider-user" className="mt-1.5" /></div>
                <div><Label htmlFor="provider-format">Request format</Label><select id="provider-format" value={form.apiFormat} onChange={(event) => setField("apiFormat", event.target.value)} data-testid="select-provider-format" className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"><option value="rest">REST headers + query</option><option value="json">JSON POST</option><option value="form">Form POST</option></select></div>
                <div><Label htmlFor="provider-method">HTTP method</Label><select id="provider-method" value={form.httpMethod} onChange={(event) => setField("httpMethod", event.target.value)} data-testid="select-provider-method" className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"><option value="GET">GET</option><option value="POST">POST</option></select></div>
                <div><Label htmlFor="provider-parameter">Identifier parameter</Label><Input id="provider-parameter" value={form.identifierParam} onChange={(event) => setField("identifierParam", event.target.value)} placeholder="imei" data-testid="input-provider-parameter" className="mt-1.5 font-mono text-xs" /></div>
                <div><Label htmlFor="provider-key-location">API key location</Label><select id="provider-key-location" value={form.apiKeyLocation} onChange={(event) => setField("apiKeyLocation", event.target.value)} data-testid="select-provider-key-location" className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"><option value="header">Request header</option><option value="query">Query parameter</option><option value="body">Request body</option></select></div>
                <div><Label htmlFor="provider-key-param">API key parameter</Label><Input id="provider-key-param" value={form.apiKeyParam} onChange={(event) => setField("apiKeyParam", event.target.value)} placeholder="X-API-Key" data-testid="input-provider-key-param" className="mt-1.5 font-mono text-xs" /></div>
                <div><Label htmlFor="provider-response-format">Response format</Label><Input id="provider-response-format" value={form.responseFormat} onChange={(event) => setField("responseFormat", event.target.value)} placeholder="json" data-testid="input-provider-response-format" className="mt-1.5 font-mono text-xs" /></div>
                <div><Label htmlFor="provider-response-param">Response format parameter</Label><Input id="provider-response-param" value={form.responseFormatParam} onChange={(event) => setField("responseFormatParam", event.target.value)} placeholder="format" data-testid="input-provider-response-param" className="mt-1.5 font-mono text-xs" /></div>
                <label className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm md:mt-6"><input type="checkbox" checked={form.isActive} onChange={(event) => setField("isActive", event.target.checked)} data-testid="checkbox-provider-active" className="h-4 w-4 accent-cyan-700" /><span><span className="block font-semibold">Enable immediately</span><span className="text-xs text-muted-foreground">Public checks can use this route.</span></span></label>
                <div className="md:col-span-2"><Label htmlFor="provider-static-query">Static query JSON <span className="font-normal text-muted-foreground">(optional)</span></Label><Textarea id="provider-static-query" rows={2} value={form.staticQuery} onChange={(event) => setField("staticQuery", event.target.value)} data-testid="textarea-provider-static-query" className="mt-1.5 font-mono text-xs" placeholder='{"country":"US"}' /></div>
                <div className="md:col-span-2"><Label htmlFor="provider-description">Internal note</Label><Textarea id="provider-description" rows={2} value={form.description} onChange={(event) => setField("description", event.target.value)} data-testid="textarea-provider-description" className="mt-1.5" placeholder="What this provider is used for…" /></div>
              </div>
              <div className="flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end"><Button variant="outline" onClick={() => setShowForm(false)} data-testid="button-cancel-provider">Cancel</Button><Button onClick={() => void save()} disabled={saving} data-testid="button-save-provider">{saving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}{saving ? "Saving…" : editing ? "Update provider" : "Save provider"}</Button></div>
            </CardContent>
          </Card>
        )}

        <section className="grid gap-3 sm:grid-cols-3">
          <Stat label="Configured routes" value={providers.length} icon={ServerCog} />
          <Stat label="Active now" value={providers.filter((provider) => provider.isActive).length} icon={Activity} />
          <Stat label="Keys stored server-side" value={providers.filter((provider) => provider.apiKeySet).length} icon={ShieldCheck} />
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3"><div><h2 className="font-display text-2xl font-bold">Provider registry</h2><p className="mt-1 text-sm text-muted-foreground">One provider can power one public route. Test before enabling.</p></div><Button variant="outline" size="sm" onClick={() => void loadProviders()} disabled={loading} data-testid="button-refresh-providers"><RefreshCw className={`mr-2 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh</Button></div>
          {loading ? <ProviderSkeleton /> : providers.length === 0 ? <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center px-5 py-16 text-center"><ServerCog className="h-9 w-9 text-muted-foreground/50" /><h3 className="mt-4 font-display text-lg font-bold">No provider routes yet</h3><p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">Add the provider for a public device check. Until then, visitors will see a clear not-configured state.</p><Button onClick={openNew} className="mt-5" data-testid="button-empty-add-provider"><Plus className="mr-2 h-4 w-4" /> Add first provider</Button></CardContent></Card> : providers.map((provider) => <ProviderCard key={provider.id} provider={provider} testValue={testValues[provider.id] ?? ""} onTestValueChange={(value) => setTestValues((previous) => ({ ...previous, [provider.id]: value }))} testResult={testResults[provider.id]} isTesting={testing === provider.id} onTest={() => void test(provider)} onEdit={() => openEdit(provider)} onToggle={() => void toggle(provider)} onDelete={() => void remove(provider)} />)}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Activity }) {
  return <Card><CardContent className="flex items-center gap-3 p-4"><div className="rounded-xl bg-cyan-100 p-2.5 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300"><Icon className="h-4 w-4" /></div><div><p className="font-display text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div></CardContent></Card>;
}

function ProviderSkeleton() {
  return <div className="grid gap-4">{[1, 2].map((item) => <Card key={item}><CardContent className="space-y-4 p-5"><div className="h-5 w-56 animate-pulse rounded bg-muted" /><div className="h-3 w-2/3 animate-pulse rounded bg-muted" /><div className="h-10 animate-pulse rounded-lg bg-muted" /></CardContent></Card>)}</div>;
}

function ProviderCard({ provider, testValue, onTestValueChange, testResult, isTesting, onTest, onEdit, onToggle, onDelete }: { provider: Provider; testValue: string; onTestValueChange: (value: string) => void; testResult?: { ok: boolean; message: string }; isTesting: boolean; onTest: () => void; onEdit: () => void; onToggle: () => void; onDelete: () => void }) {
  return (
    <Card className={`overflow-hidden transition-shadow hover:shadow-md ${provider.isActive ? "border-cyan-200 dark:border-cyan-900/60" : "opacity-80"}`} data-testid={`card-provider-${provider.id}`}>
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><h3 className="font-display text-lg font-bold">{provider.name}</h3><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${provider.isActive ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-muted text-muted-foreground"}`}>{provider.isActive ? "Active" : "Inactive"}</span><span className="rounded-full bg-cyan-100 px-2.5 py-1 font-mono text-[11px] font-semibold text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300">/{provider.slug}</span></div>
            <p className="mt-2 truncate font-mono text-xs text-muted-foreground">{provider.apiEndpoint}</p>
            <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground"><span>{provider.httpMethod}</span><span>{provider.apiFormat}</span><span>param: {provider.identifierParam}</span><span>key: {provider.apiKeyLocation} / {provider.apiKeyParam}</span><span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300"><ShieldCheck className="h-3 w-3" /> key masked</span></p>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end"><Button size="sm" variant="outline" onClick={onEdit} data-testid={`button-edit-provider-${provider.id}`}><Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit</Button><Button size="sm" variant="outline" onClick={onToggle} data-testid={`button-toggle-provider-${provider.id}`}>{provider.isActive ? "Disable" : "Enable"}</Button><Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={onDelete} data-testid={`button-delete-provider-${provider.id}`}><Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete</Button></div>
        </div>
        <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row"><Input value={testValue} onChange={(event) => onTestValueChange(event.target.value)} placeholder="Sample IMEI or serial for a connection test" data-testid={`input-test-provider-${provider.id}`} className="font-mono text-xs" /><Button variant="outline" onClick={onTest} disabled={isTesting} data-testid={`button-test-provider-${provider.id}`} className="shrink-0"><Wifi className="mr-2 h-4 w-4" />{isTesting ? "Testing…" : "Test connection"}</Button></div>
        {testResult && <div data-testid={`status-test-provider-${provider.id}`} className={`flex items-center gap-2 text-sm font-semibold ${testResult.ok ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}>{testResult.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}{testResult.message}</div>}
      </CardContent>
    </Card>
  );
}