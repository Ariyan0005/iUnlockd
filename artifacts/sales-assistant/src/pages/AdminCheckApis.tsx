import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Plus, RefreshCw, Trash2, Wifi, XCircle } from "lucide-react";
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
  description?: string | null;
  isActive: boolean;
  apiKeySet?: boolean;
};

const EMPTY_FORM = {
  slug: "imei-checker",
  name: "IMEI Check Provider",
  apiEndpoint: "",
  apiKey: "",
  apiUser: "",
  apiFormat: "rest",
  httpMethod: "GET",
  identifierParam: "imei",
  description: "",
  isActive: false,
};

export default function AdminCheckApis() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState<Provider | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [testValues, setTestValues] = useState<Record<number, string>>({});
  const [testResults, setTestResults] = useState<Record<number, { ok: boolean; message: string }>>({});
  const [testing, setTesting] = useState<number | null>(null);

  const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("iu_token")}` });
  const loadProviders = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/check-providers", { headers: authHeader() });
      const data = await response.json();
      if (response.ok) setProviders(Array.isArray(data) ? data : []);
      else setMessage(data.error ?? "Unable to load check providers.");
    } catch {
      setMessage("Unable to load check providers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProviders(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
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
      description: provider.description ?? "",
      isActive: provider.isActive,
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.slug || !form.name || !form.apiEndpoint || (!editing && !form.apiKey)) {
      setMessage("Slug, name, endpoint, and a new provider key are required.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(editing ? `/api/admin/check-providers/${editing.id}` : "/api/admin/check-providers", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error ?? "Could not save provider.");
      } else {
        setMessage(editing ? "Check provider updated." : "Check provider added.");
        setShowForm(false);
        await loadProviders();
      }
    } catch {
      setMessage("Network error while saving provider.");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (provider: Provider) => {
    const response = await fetch(`/api/admin/check-providers/${provider.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ isActive: !provider.isActive }),
    });
    if (response.ok) await loadProviders();
  };

  const remove = async (provider: Provider) => {
    if (!confirm(`Delete ${provider.name}?`)) return;
    const response = await fetch(`/api/admin/check-providers/${provider.id}`, { method: "DELETE", headers: authHeader() });
    if (response.ok) await loadProviders();
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
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ identifier }),
      });
      const data = await response.json();
      setTestResults((previous) => ({
        ...previous,
        [provider.id]: { ok: Boolean(data.ok), message: data.ok ? `Connected (HTTP ${data.httpStatus})` : (data.error ?? `HTTP ${data.httpStatus ?? "error"}`) },
      }));
    } catch {
      setTestResults((previous) => ({ ...previous, [provider.id]: { ok: false, message: "Network error during test." } }));
    } finally {
      setTesting(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link to="/admin" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Admin panel</Link>
            <h1 className="text-2xl font-bold">Device Check APIs</h1>
            <p className="mt-1 text-sm text-muted-foreground">Connect IMEI, FMI, blacklist, Apple, Samsung, Xiaomi, or Pixel providers. Keys remain server-side.</p>
          </div>
          <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Add provider</Button>
        </div>

        {message && <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">{message}</div>}

        {showForm && (
          <Card>
            <CardContent className="grid gap-4 p-6">
              <div className="flex items-center justify-between"><h2 className="font-semibold">{editing ? "Edit provider" : "Add check provider"}</h2><button onClick={() => setShowForm(false)} className="text-sm text-muted-foreground">Cancel</button></div>
              <div className="grid gap-4 md:grid-cols-2">
                <div><Label>Route slug *</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="imei-checker" /><p className="mt-1 text-xs text-muted-foreground">Must match a public route slug.</p></div>
                <div><Label>Provider name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="imeicheck.com" /></div>
                <div className="md:col-span-2"><Label>API endpoint *</Label><Input value={form.apiEndpoint} onChange={(e) => setForm({ ...form, apiEndpoint: e.target.value })} placeholder="https://..." /></div>
                <div><Label>API key {editing ? "(blank keeps current)" : "*"}</Label><Input type="password" value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} /></div>
                <div><Label>API user / partner ID</Label><Input value={form.apiUser} onChange={(e) => setForm({ ...form, apiUser: e.target.value })} /></div>
                <div><Label>Request format</Label><select className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.apiFormat} onChange={(e) => setForm({ ...form, apiFormat: e.target.value })}><option value="rest">REST headers + query</option><option value="json">JSON POST</option><option value="form">Form POST</option></select></div>
                <div><Label>HTTP method</Label><select className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.httpMethod} onChange={(e) => setForm({ ...form, httpMethod: e.target.value })}><option value="GET">GET</option><option value="POST">POST</option></select></div>
                <div><Label>Identifier parameter</Label><Input value={form.identifierParam} onChange={(e) => setForm({ ...form, identifierParam: e.target.value })} placeholder="imei" /></div>
                <div className="flex items-center gap-2 pt-6"><input id="provider-active" type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /><Label htmlFor="provider-active">Enable provider immediately</Label></div>
                <div className="md:col-span-2"><Label>Internal note</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              </div>
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={save} disabled={saving}>{saving ? "Saving…" : editing ? "Update provider" : "Save provider"}</Button></div>
            </CardContent>
          </Card>
        )}

        {loading ? <div className="py-16 text-center text-muted-foreground">Loading providers…</div> : providers.length === 0 ? (
          <Card><CardContent className="py-16 text-center text-muted-foreground">No device check providers configured yet.</CardContent></Card>
        ) : providers.map((provider) => (
          <Card key={provider.id} className={!provider.isActive ? "opacity-70" : ""}>
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{provider.name}</h2><span className={`rounded-full px-2 py-0.5 text-xs ${provider.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{provider.isActive ? "Active" : "Inactive"}</span><span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">/{provider.slug}</span></div>
                  <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{provider.apiEndpoint}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{provider.httpMethod} · {provider.apiFormat} · parameter: {provider.identifierParam} · key stored server-side</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(provider)}>Edit</Button>
                  <Button size="sm" variant="outline" onClick={() => toggle(provider)}>{provider.isActive ? "Disable" : "Enable"}</Button>
                  <Button size="sm" variant="outline" className="text-destructive" onClick={() => remove(provider)}><Trash2 className="mr-1 h-3.5 w-3.5" /> Delete</Button>
                </div>
              </div>
              <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row">
                <Input placeholder="Sample IMEI / serial for connection test" value={testValues[provider.id] ?? ""} onChange={(e) => setTestValues({ ...testValues, [provider.id]: e.target.value })} />
                <Button variant="outline" onClick={() => test(provider)} disabled={testing === provider.id} className="shrink-0"><Wifi className="mr-2 h-4 w-4" />{testing === provider.id ? "Testing…" : "Test connection"}</Button>
              </div>
              {testResults[provider.id] && <div className={`flex items-center gap-2 text-sm ${testResults[provider.id].ok ? "text-green-700" : "text-red-700"}`}>{testResults[provider.id].ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}{testResults[provider.id].message}</div>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}