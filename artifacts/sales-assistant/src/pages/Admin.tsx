import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import logoImg from "/logo.jpg";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Shield, Users, ShoppingBag, Wallet, CheckCircle2, XCircle, Clock,
  RefreshCw, AlertCircle, TrendingUp, Package, Plus, Pencil, Trash2,
  ToggleLeft, ToggleRight, Settings, Key, Store, LayoutDashboard,
  ChevronDown, ChevronRight, Menu, X, LogOut, Activity, Bell,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Deposit {
  id: number; userId: number; userName?: string; userEmail?: string;
  amount: string; method: string; txHash?: string; status: string; createdAt: string;
}
interface Order {
  id: number; userId: number; userName?: string; userEmail?: string;
  serviceName?: string; serviceType?: string; identifier?: string; imei?: string;
  status: string; price: string; result?: string; apiOrderId?: string; createdAt: string;
}
interface AdminUser {
  id: number; name: string; email: string; balance: string;
  role: string; isEmailVerified: boolean; createdAt: string;
}
interface Stats {
  totalUsers: number; totalOrders: number; totalRevenue: string;
  pendingDeposits: number; todayOrders: number; completedOrders: number;
}
interface Service {
  id: number; name: string; category: string; price: string;
  description?: string; deliveryTime?: string; isActive: boolean;
  apiServiceId?: string; merchantId?: number | null;
  identifierType?: string; fieldLabel?: string | null;
  requireQuantity?: boolean; requireUsername?: boolean; requireEmail?: boolean;
}
interface Merchant {
  id: number; name: string; apiEndpoint: string; apiUser?: string | null;
  apiFormat?: string | null; description?: string | null; isActive: boolean; createdAt: string; updatedAt: string;
}

const EMPTY_SERVICE = { name: "", category: "imei", price: "", description: "", deliveryTime: "", identifierType: "imei", fieldLabel: "", requireQuantity: false, requireUsername: false, requireEmail: false };
const EMPTY_MERCHANT = { name: "", apiEndpoint: "", apiKey: "", apiUser: "", apiFormat: "rest", description: "" };

// ─── Sidebar Shell ────────────────────────────────────────────────────────────

type Section =
  | "dashboard"
  | "orders-all" | "orders-waiting" | "orders-processing" | "orders-completed" | "orders-rejected"
  | "services"
  | "merchants"
  | "deposits"
  | "users"
  | "settings";

interface SidebarProps {
  activeSection: Section;
  setActiveSection: (s: Section) => void;
  onLogout: () => void;
  pendingDeposits: number;
  waitingOrders: number;
  processingOrders: number;
  totalMerchants: number;
  totalUsers: number;
  totalServices: number;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
}

function Sidebar({
  activeSection, setActiveSection, onLogout,
  pendingDeposits, waitingOrders, processingOrders,
  totalMerchants, totalUsers, totalServices,
  sidebarOpen, setSidebarOpen,
}: SidebarProps) {
  const [ordersOpen, setOrdersOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const nav = (s: Section) => {
    setActiveSection(s);
    setSidebarOpen(false);
  };

  const isOrders = activeSection.startsWith("orders");

  const itemCls = (s: Section) =>
    `flex items-center justify-between w-full px-3 py-2 rounded-lg text-base transition-colors cursor-pointer ${
      activeSection === s
        ? "bg-white/15 text-white font-medium"
        : "text-gray-300 hover:bg-white/10 hover:text-white"
    }`;

  const subItemCls = (s: Section) =>
    `flex items-center justify-between w-full pl-8 pr-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer ${
      activeSection === s
        ? "text-white font-semibold"
        : "text-gray-400 hover:text-white"
    }`;

  return (
    <>
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-gray-900 flex flex-col z-40 transition-transform duration-200
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="iUnlockd" className="w-7 h-7 rounded-lg object-cover" />
            <div>
              <span className="text-white font-bold text-sm">iUnlockd</span>
              <span className="ml-2 text-xs px-1.5 py-0.5 bg-primary/80 text-white rounded font-semibold">ADMIN</span>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">

          {/* Back to site */}
          <Link to="/" className="flex items-center gap-2.5 px-3 py-2 mb-2 rounded-lg text-xs bg-white/10 text-white hover:bg-white/20 transition-colors font-medium border border-white/20">
            <Activity className="w-3.5 h-3.5" />Back to site
          </Link>
                    {/* Dashboard */}
          <button onClick={() => nav("dashboard")} className={itemCls("dashboard")}>
            <span className="flex items-center gap-2.5">
              <LayoutDashboard className="w-4 h-4" />Dashboard
            </span>
          </button>

          {/* Order History */}
          <div>
            <button
              onClick={() => { setOrdersOpen(!ordersOpen); if (!isOrders) nav("orders-all"); }}
              className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-base transition-colors cursor-pointer ${
                isOrders ? "bg-white/15 text-white font-medium" : "text-gray-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4" />Order History
              </span>
              {ordersOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {ordersOpen && (
              <div className="mt-1 flex flex-col gap-0.5">
                <button onClick={() => nav("orders-all")} className={subItemCls("orders-all")}>
                  <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-gray-500" />All Orders</span>
                </button>
                <button onClick={() => nav("orders-waiting")} className={subItemCls("orders-waiting")}>
                  <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-gray-500" />Waiting Action</span>
                  {waitingOrders > 0 && <span className="text-xs bg-yellow-500 text-white rounded-full px-1.5 min-w-[1.25rem] text-center">{waitingOrders}</span>}
                </button>
                <button onClick={() => nav("orders-processing")} className={subItemCls("orders-processing")}>
                  <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-gray-500" />In Process</span>
                  {processingOrders > 0 && <span className="text-xs bg-blue-500 text-white rounded-full px-1.5 min-w-[1.25rem] text-center">{processingOrders}</span>}
                </button>
                <button onClick={() => nav("orders-completed")} className={subItemCls("orders-completed")}>
                  <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-gray-500" />Completed</span>
                </button>
                <button onClick={() => nav("orders-rejected")} className={subItemCls("orders-rejected")}>
                  <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-gray-500" />Rejected</span>
                </button>
              </div>
            )}
          </div>

          {/* Services List */}
          <button onClick={() => nav("services")} className={itemCls("services")}>
            <span className="flex items-center gap-2.5">
              <Package className="w-4 h-4" />Services List
            </span>
            {totalServices > 0 && <span className="text-xs bg-gray-600 text-gray-200 rounded-full px-1.5">{totalServices}</span>}
          </button>

          {/* Merchants */}
          <button onClick={() => nav("merchants")} className={itemCls("merchants")}>
            <span className="flex items-center gap-2.5">
              <Store className="w-4 h-4" />Merchants
            </span>
            {totalMerchants > 0 && <span className="text-xs bg-gray-600 text-gray-200 rounded-full px-1.5">{totalMerchants}</span>}
          </button>

          {/* Deposits */}
          <button onClick={() => nav("deposits")} className={itemCls("deposits")}>
            <span className="flex items-center gap-2.5">
              <Wallet className="w-4 h-4" />Deposits
            </span>
            {pendingDeposits > 0 && <span className="text-xs bg-red-500 text-white rounded-full px-1.5 min-w-[1.25rem] text-center">{pendingDeposits}</span>}
          </button>

          {/* Users */}
          <button onClick={() => nav("users")} className={itemCls("users")}>
            <span className="flex items-center gap-2.5">
              <Users className="w-4 h-4" />User
            </span>
            {totalUsers > 0 && <span className="text-xs bg-gray-600 text-gray-200 rounded-full px-1.5">{totalUsers}</span>}
          </button>

          {/* Settings */}
          <div>
            <button
              onClick={() => { setSettingsOpen(!settingsOpen); if (activeSection !== "settings") nav("settings"); }}
              className={itemCls("settings")}
            >
              <span className="flex items-center gap-2.5">
                <Settings className="w-4 h-4" />Settings
              </span>
              {settingsOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {settingsOpen && (
              <div className="mt-1 flex flex-col gap-0.5">
                <button onClick={() => nav("settings")} className={subItemCls("settings")}>
                  <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-gray-500" />Change Password</span>
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Bottom links */}
        <div className="px-3 py-4 border-t border-white/10 flex flex-col gap-1">
          <button onClick={onLogout} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-red-400 hover:bg-white/10 transition-colors w-full text-left">
            <LogOut className="w-3.5 h-3.5" />Logout
          </button>
        </div>
      </aside>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState<Section>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [adminOrderTypeFilter, setAdminOrderTypeFilter] = useState("all");

  // Service modal
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceForm, setServiceForm] = useState(EMPTY_SERVICE);
  const [savingService, setSavingService] = useState(false);

  // Merchant modal
  const [showMerchantModal, setShowMerchantModal] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null);
  const [merchantForm, setMerchantForm] = useState(EMPTY_MERCHANT);
  const [savingMerchant, setSavingMerchant] = useState(false);
  const [togglingMerchant, setTogglingMerchant] = useState<number | null>(null);

  // User action modal
  const [userActionModal, setUserActionModal] = useState<{ user: AdminUser; type: "add" | "deduct" | "delete" } | null>(null);
  const [userActionAmount, setUserActionAmount] = useState("");
  const [userActionNote, setUserActionNote] = useState("");
  const [userActionLoading, setUserActionLoading] = useState(false);

  const [cryptoEnabled, setCryptoEnabled] = useState(true);
  const [togglingCrypto, setTogglingCrypto] = useState(false);

  const [pwChange, setPwChange] = useState({ current: "", newPw: "", confirm: "" });
  const [changingPw, setChangingPw] = useState(false);
  const [syncing, setSyncing] = useState<number | "all" | null>(null);
  const [syncResult, setSyncResult] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [testingMerchant, setTestingMerchant] = useState<number | null>(null);
  const [testResults, setTestResults] = useState<Record<number, { ok: boolean; message: string }>>({});
  const [userSearch, setUserSearch] = useState("");
  const [svcCategoryFilter, setSvcCategoryFilter] = useState("all");
  const [svcMerchantFilter, setSvcMerchantFilter] = useState("all");
  const [svcGroupBy, setSvcGroupBy] = useState(true);
  const [svcSearch, setSvcSearch] = useState("");

  const svcCategories = useMemo(() =>
    ["all", ...Array.from(new Set(services.map((s: any) => s.category).filter(Boolean))) as string[]], [services]);
  const svcMerchantNames = useMemo(() =>
    ["all", ...Array.from(new Set(services.map((s: any) => { const m = (merchants as any[]).find((m: any) => m.id === s.merchantId); return m?.name ?? null; }).filter((n): n is string => !!n))) as string[]], [services, merchants]);
  const filteredSvcs = useMemo(() =>
    services.filter((s: any) =>
      (svcCategoryFilter === "all" || s.category === svcCategoryFilter) &&
      (svcMerchantFilter === "all" || (merchants as any[]).find((m: any) => m.id === s.merchantId)?.name === svcMerchantFilter) &&
      (!svcSearch || s.name?.toLowerCase().includes(svcSearch.toLowerCase()))
    ), [services, merchants, svcCategoryFilter, svcMerchantFilter, svcSearch]);
  const svcGrouped = useMemo(() =>
    svcGroupBy
      ? Array.from(new Set(filteredSvcs.map((s: any) => s.category || "Uncategorized")))
          .map(cat => ({ cat, items: filteredSvcs.filter((s: any) => (s.category || "Uncategorized") === cat) }))
      : [{ cat: null as string | null, items: filteredSvcs }],
    [filteredSvcs, svcGroupBy]);
  const [depositSearch, setDepositSearch] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("iu_token");
    if (token) loadAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("iu_token")}` });

  const apiFetch = (url: string, options: RequestInit = {}) => {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 12000);
    return fetch(url, { ...options, signal: ctrl.signal });
  };

  const flash = (type: "success" | "error", text: string) => {
    setActionMsg({ type, text });
    setTimeout(() => setActionMsg(null), 5000);
  };

  const loadAll = async () => {
    setLoading(true);
    const results = await Promise.allSettled([
      apiFetch("/api/admin/deposits",  { headers: authHeader() }),
      apiFetch("/api/admin/orders",    { headers: authHeader() }),
      apiFetch("/api/admin/users",     { headers: authHeader() }),
      apiFetch("/api/admin/stats",     { headers: authHeader() }),
      apiFetch("/api/admin/services",  { headers: authHeader() }),
      apiFetch("/api/admin/merchants", { headers: authHeader() }),
      apiFetch("/api/admin/settings",  { headers: authHeader() }),
    ]);
    const safeJson = async (r: PromiseSettledResult<Response>) => {
      if (r.status !== "fulfilled" || !r.value.ok) return null;
      return r.value.json().catch(() => null);
    };
    const [dData, oData, uData, sData, svData, mData, stData] = await Promise.all(results.map(safeJson));
    if (dData !== null)  setDeposits(Array.isArray(dData) ? dData : []);
    if (oData !== null)  setOrders(Array.isArray(oData) ? oData : []);
    if (uData !== null)  setUsers(Array.isArray(uData) ? uData : []);
    if (sData !== null)  setStats(sData);
    if (svData !== null) setServices(Array.isArray(svData) ? svData : []);
    if (mData !== null)  setMerchants(Array.isArray(mData) ? mData : []);
    if (stData !== null && typeof stData === "object") {
      setCryptoEnabled((stData as Record<string, string>)["crypto_enabled"] !== "false");
    }
    setLoading(false);
  };

  const toggleCrypto = async () => {
    setTogglingCrypto(true);
    const newVal = !cryptoEnabled;
    try {
      const res = await fetch("/api/admin/settings/crypto_enabled", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ value: String(newVal) }),
      });
      if (res.ok) {
        setCryptoEnabled(newVal);
        flash("success", newVal ? "Crypto deposits enabled" : "Crypto deposits suspended");
      } else {
        flash("error", "Failed to update setting");
      }
    } catch { flash("error", "Network error"); }
    finally { setTogglingCrypto(false); }
  };

  // ── Test merchant connection ───────────────────────────────────────────────

  const testMerchant = async (id: number) => {
    setTestingMerchant(id);
    setTestResults(prev => ({ ...prev, [id]: { ok: false, message: "Testing…" } }));
    try {
      const res = await apiFetch(`/api/admin/merchants/${id}/test`, { method: "POST", headers: authHeader() });
      const data = await res.json();
      setTestResults(prev => ({ ...prev, [id]: { ok: data.ok, message: data.message ?? (data.error ?? "Unknown result") } }));
    } catch {
      setTestResults(prev => ({ ...prev, [id]: { ok: false, message: "Network error — could not reach server" } }));
    } finally {
      setTestingMerchant(null);
    }
  };

  // ── Sync ──────────────────────────────────────────────────────────────────

  const handleSync = async (merchantId?: number) => {
    setSyncing(merchantId ?? "all");
    setSyncResult(null);
    try {
      const res = await apiFetch("/api/admin/services/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(merchantId ? { merchantId } : {}),
      });
      const data = await res.json();
      if (!res.ok) {
        setSyncResult({ type: "error", text: data.error ?? "Sync failed" });
      } else {
        setSyncResult({ type: "success", text: data.message ?? "Sync complete" });
        const svRes = await apiFetch("/api/admin/services", { headers: authHeader() });
        if (svRes.ok) { const sv = await svRes.json(); setServices(Array.isArray(sv) ? sv : []); }
      }
    } catch { setSyncResult({ type: "error", text: "Network error during sync" }); }
    finally { setSyncing(null); }
  };

  // ── Merchant CRUD ─────────────────────────────────────────────────────────

  const openAddMerchant = () => {
    setEditingMerchant(null);
    setMerchantForm(EMPTY_MERCHANT);
    setShowMerchantModal(true);
  };

  const openEditMerchant = (m: Merchant) => {
    setEditingMerchant(m);
    setMerchantForm({ name: m.name, apiEndpoint: m.apiEndpoint, apiKey: "", apiUser: m.apiUser ?? "", apiFormat: m.apiFormat ?? "rest", description: m.description ?? "" });
    setShowMerchantModal(true);
  };

  const saveMerchant = async () => {
    if (!merchantForm.name || !merchantForm.apiEndpoint) {
      flash("error", "Name and API Endpoint are required"); return;
    }
    if (!editingMerchant && !merchantForm.apiKey) {
      flash("error", "API Key is required"); return;
    }
    setSavingMerchant(true);
    try {
      const url = editingMerchant ? `/api/admin/merchants/${editingMerchant.id}` : "/api/admin/merchants";
      const method = editingMerchant ? "PATCH" : "POST";
      const body: Record<string, string> = {
        name: merchantForm.name,
        apiEndpoint: merchantForm.apiEndpoint,
        apiUser: merchantForm.apiUser,
        apiFormat: merchantForm.apiFormat,
        description: merchantForm.description,
      };
      if (merchantForm.apiKey) body["apiKey"] = merchantForm.apiKey;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        if (editingMerchant) {
          setMerchants((prev) => prev.map((m) => m.id === editingMerchant.id ? data : m));
          flash("success", "Merchant updated");
        } else {
          setMerchants((prev) => [data, ...prev]);
          flash("success", "Merchant added successfully");
        }
        setShowMerchantModal(false);
      } else {
        flash("error", data.error ?? "Failed to save merchant");
      }
    } catch { flash("error", "Network error"); }
    finally { setSavingMerchant(false); }
  };

  const toggleMerchant = async (id: number) => {
    setTogglingMerchant(id);
    try {
      const res = await fetch(`/api/admin/merchants/${id}/toggle`, {
        method: "POST",
        headers: authHeader(),
      });
      const data = await res.json();
      if (res.ok) {
        setMerchants((prev) => prev.map((m) => m.id === id ? data : m));
        flash("success", `Merchant ${data.isActive ? "activated" : "deactivated"}`);
      } else {
        flash("error", data.error ?? "Failed to toggle merchant");
      }
    } catch { flash("error", "Network error"); }
    finally { setTogglingMerchant(null); }
  };

  const deleteMerchant = async (id: number, name: string) => {
    if (!confirm(`Delete merchant "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/merchants/${id}`, { method: "DELETE", headers: authHeader() });
      if (res.ok) {
        setMerchants((prev) => prev.filter((m) => m.id !== id));
        flash("success", "Merchant deleted");
      } else {
        const data = await res.json();
        flash("error", data.error ?? "Failed to delete merchant");
      }
    } catch { flash("error", "Network error"); }
  };

  // ── Services ──────────────────────────────────────────────────────────────

  const openAddService = () => { setEditingService(null); setServiceForm(EMPTY_SERVICE); setShowServiceModal(true); };
  const openEditService = (svc: Service) => {
    setEditingService(svc);
    setServiceForm({ name: svc.name, category: svc.category, price: svc.price, description: svc.description || "", deliveryTime: svc.deliveryTime || "", identifierType: svc.identifierType ?? "imei", fieldLabel: svc.fieldLabel ?? "", requireQuantity: svc.requireQuantity ?? false, requireUsername: svc.requireUsername ?? false, requireEmail: svc.requireEmail ?? false });
    setShowServiceModal(true);
  };

  const saveService = async () => {
    if (!serviceForm.name || !serviceForm.category || !serviceForm.price) { flash("error", "Name, category, and price are required"); return; }
    setSavingService(true);
    try {
      const url = editingService ? `/api/admin/services/${editingService.id}` : "/api/admin/services";
      const method = editingService ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json", ...authHeader() }, body: JSON.stringify(serviceForm) });
      const data = await res.json();
      if (res.ok) {
        if (editingService) { setServices((prev) => prev.map((s) => s.id === editingService.id ? data : s)); flash("success", "Service updated"); }
        else { setServices((prev) => [data, ...prev]); flash("success", "Service created"); }
        setShowServiceModal(false);
      } else { flash("error", data.error ?? "Failed to save service"); }
    } catch { flash("error", "Network error"); }
    finally { setSavingService(false); }
  };

  const toggleService = async (svc: Service) => {
    try {
      const res = await fetch(`/api/admin/services/${svc.id}`, { method: "PATCH", headers: { "Content-Type": "application/json", ...authHeader() }, body: JSON.stringify({ isActive: !svc.isActive }) });
      if (res.ok) { const updated = await res.json(); setServices((prev) => prev.map((s) => s.id === svc.id ? updated : s)); }
    } catch {}
  };

  const deleteService = async (id: number) => {
    if (!confirm("Delete this service?")) return;
    try {
      const res = await apiFetch(`/api/admin/services/${id}`, { method: "DELETE", headers: authHeader() });
      if (res.ok) {
        setServices((prev) => prev.filter((s) => s.id !== id));
        flash("success", "Service deleted");
      } else {
        const data = await res.json();
        flash("error", data.error ?? "Failed to delete");
      }
    } catch { flash("error", "Network error"); }
  };

  const deleteAllServices = async () => {
    if (!confirm(`Delete ALL ${services.length} services? This cannot be undone. Add a merchant and sync to get fresh products.`)) return;
    try {
      const res = await fetch("/api/admin/services", { method: "DELETE", headers: authHeader() });
      if (res.ok) { setServices([]); flash("success", "All services deleted. Now add a merchant and sync."); }
      else { const data = await res.json(); flash("error", data.error ?? "Failed to delete all services"); }
    } catch { flash("error", "Network error"); }
  };

  // ── Deposits / Orders ─────────────────────────────────────────────────────

  const updateDeposit = async (id: number, status: "approved" | "rejected") => {
    try {
      const res = await fetch(`/api/admin/deposits/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json", ...authHeader() }, body: JSON.stringify({ status }) });
      if (res.ok) { const updated = await res.json(); setDeposits((prev) => prev.map((d) => d.id === id ? { ...d, status: updated.status } : d)); flash("success", `Deposit #${id} ${status}`); }
      else { const data = await res.json(); flash("error", data.error ?? "Action failed"); }
    } catch { flash("error", "Network error"); }
  };

  const updateOrder = async (id: number, status: string, result?: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json", ...authHeader() }, body: JSON.stringify({ status, result }) });
      if (res.ok) { const updated = await res.json(); setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: updated.status ?? status, result: updated.result ?? result } : o)); flash("success", `Order #${id} → ${status}`); }
      else { const data = await res.json(); flash("error", data.error ?? "Action failed"); }
    } catch { flash("error", "Network error"); }
  };

  const checkOrderStatus = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/orders/${id}/check-status`, { method: "POST", headers: authHeader() });
      const data = await res.json();
      if (res.ok) {
        setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: data.dbStatus ?? o.status } : o));
        flash("success", `Order #${id} API status: ${data.status}`);
      } else { flash("error", data.error ?? "Check failed"); }
    } catch { flash("error", "Network error"); }
  };

  const refundOrder = async (id: number) => {
    if (!confirm("Refund this order? Balance will be returned to the user.")) return;
    try {
      const res = await fetch(`/api/admin/orders/${id}/refund`, { method: "POST", headers: authHeader() });
      const data = await res.json();
      if (res.ok) {
        setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: "refunded", result: "Refunded by admin" } : o));
        flash("success", `Order #${id} refunded — $${data.refunded} returned`);
      } else { flash("error", data.error ?? "Refund failed"); }
    } catch { flash("error", "Network error"); }
  };

  // ── User actions ──────────────────────────────────────────────────────────

  const handleUserAction = async () => {
    if (!userActionModal) return;
    const { user: u, type } = userActionModal;
    setUserActionLoading(true);
    try {
      if (type === "delete") {
        const res = await fetch(`/api/admin/users/${u.id}`, { method: "DELETE", headers: authHeader() });
        const data = await res.json();
        if (res.ok) { setUsers((prev) => prev.filter((x) => x.id !== u.id)); flash("success", `User "${u.name}" deleted`); setUserActionModal(null); }
        else { flash("error", data.error ?? "Delete failed"); }
      } else {
        if (!userActionAmount || parseFloat(userActionAmount) <= 0) { flash("error", "Enter a valid amount"); setUserActionLoading(false); return; }
        const res = await fetch(`/api/admin/users/${u.id}/adjust`, { method: "POST", headers: { "Content-Type": "application/json", ...authHeader() }, body: JSON.stringify({ type, amount: userActionAmount, note: userActionNote }) });
        const data = await res.json();
        if (res.ok) { setUsers((prev) => prev.map((x) => x.id === u.id ? data : x)); flash("success", `$${userActionAmount} ${type === "add" ? "added to" : "deducted from"} ${u.name}'s balance`); setUserActionModal(null); setUserActionAmount(""); setUserActionNote(""); }
        else { flash("error", data.error ?? "Action failed"); }
      }
    } catch { flash("error", "Network error"); }
    finally { setUserActionLoading(false); }
  };

  const handlePasswordChange = async () => {
    if (!pwChange.current || !pwChange.newPw) { flash("error", "All fields required"); return; }
    if (pwChange.newPw.length < 6) { flash("error", "New password must be at least 6 characters"); return; }
    if (pwChange.newPw !== pwChange.confirm) { flash("error", "New passwords do not match"); return; }
    setChangingPw(true);
    try {
      const res = await fetch("/api/admin/change-password", { method: "POST", headers: { "Content-Type": "application/json", ...authHeader() }, body: JSON.stringify({ currentPassword: pwChange.current, newPassword: pwChange.newPw }) });
      const data = await res.json();
      if (res.ok) { flash("success", "Password changed successfully"); setPwChange({ current: "", newPw: "", confirm: "" }); }
      else { flash("error", data.error ?? "Failed to change password"); }
    } catch { flash("error", "Network error"); }
    finally { setChangingPw(false); }
  };

  // ── Computed values ───────────────────────────────────────────────────────

  const METHOD_LABELS: Record<string, string> = { bep20: "BEP20", trc20: "TRC20", binance_c2c: "C2C" };
  const pendingDeposits = deposits.filter((d) => d.status === "pending");
  const waitingOrders = orders.filter((o) => o.status === "pending");
  const processingOrders = orders.filter((o) => o.status === "processing");
  const activeMerchants = merchants.filter((m) => m.isActive).length;

  const handleLogout = () => { localStorage.removeItem("iu_token"); navigate("/login"); };

  // ── Order filter by section ───────────────────────────────────────────────
  const getOrdersForSection = () => {
    let filtered = orders;
    if (adminOrderTypeFilter !== "all") filtered = filtered.filter(o => o.serviceType === adminOrderTypeFilter);
    if (activeSection === "orders-waiting") filtered = filtered.filter(o => o.status === "pending");
    else if (activeSection === "orders-processing") filtered = filtered.filter(o => o.status === "processing");
    else if (activeSection === "orders-completed") filtered = filtered.filter(o => o.status === "completed");
    else if (activeSection === "orders-rejected") filtered = filtered.filter(o => o.status === "failed" || o.status === "rejected");
    return filtered;
  };

  const sectionTitle: Record<string, string> = {
    "orders-all": "All Orders",
    "orders-waiting": "Waiting Action",
    "orders-processing": "In Process",
    "orders-completed": "Completed",
    "orders-rejected": "Rejected",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col overflow-x-hidden w-screen max-w-full">
        <div className="flex-1 flex items-center justify-center text-gray-500">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-x-hidden w-screen max-w-full">
      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen w-full min-w-0">

        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20 px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 text-white text-xs font-medium hover:bg-gray-700 transition-colors">
              ← Back to Site
            </a>
            <span className="text-xs px-2 py-0.5 bg-primary text-white rounded-md font-bold tracking-wide">ADMIN</span>
          </div>
          <div className="flex items-center gap-2">
            {pendingDeposits.length > 0 && (
              <button onClick={() => setActiveSection("deposits")} className="relative text-gray-500 hover:text-gray-800">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{pendingDeposits.length}</span>
              </button>
            )}
            <Button variant="outline" size="sm" onClick={loadAll}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Vertical Tab Nav */}
        <nav className="bg-white border-b border-gray-200 px-3 py-2 flex flex-wrap gap-2">
          {([
            { id: "dashboard", label: "Dashboard", badge: 0 },
            { id: "orders-all", label: "Orders", badge: waitingOrders.length + processingOrders.length },
            { id: "services", label: "Services", badge: 0 },
            { id: "merchants", label: "Merchants", badge: 0 },
            { id: "deposits", label: "Deposits", badge: pendingDeposits.length },
            { id: "users", label: "Users", badge: 0 },
            { id: "settings", label: "Settings", badge: 0 },
          ] as { id: Section; label: string; badge: number }[]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                (tab.id === "orders-all" ? activeSection.startsWith("orders") : activeSection === tab.id)
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
              {tab.badge > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-xs bg-red-500 text-white rounded-full">{tab.badge}</span>
              )}
            </button>
          ))}
        </nav>
        {/* Content */}
        <main className="flex-1 p-3 md:p-6 max-w-5xl w-full mx-auto flex flex-col gap-5 overflow-x-hidden">

          {/* Flash message */}
          {actionMsg && (
            <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-md border ${
              actionMsg.type === "success" ? "text-green-600 bg-green-500/10 border-green-500/20" : "text-destructive bg-destructive/10 border-destructive/20"
            }`}>
              {actionMsg.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              {actionMsg.text}
            </div>
          )}

          {/* ══ DASHBOARD ══════════════════════════════════════════════════════ */}
          {activeSection === "dashboard" && (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { icon: Wallet,       label: "Pending Deposits", value: pendingDeposits.length, color: "text-yellow-600", bg: "bg-yellow-500/10", action: () => setActiveSection("deposits") },
                  { icon: ShoppingBag, label: "Waiting Orders",   value: waitingOrders.length, color: "text-blue-600", bg: "bg-blue-500/10", action: () => setActiveSection("orders-waiting") },
                  { icon: Users,       label: "Total Users",      value: stats?.totalUsers ?? users.length, color: "text-primary", bg: "bg-primary/10", action: () => setActiveSection("users") },
                  { icon: ShoppingBag, label: "Total Orders",     value: stats?.totalOrders ?? orders.length, color: "text-green-600", bg: "bg-green-500/10", action: () => setActiveSection("orders-all") },
                  { icon: Store,       label: "Active Merchants", value: activeMerchants, color: "text-purple-600", bg: "bg-purple-500/10", action: () => setActiveSection("merchants") },
                  { icon: TrendingUp,  label: "Revenue",          value: `$${parseFloat(stats?.totalRevenue ?? "0").toFixed(0)}`, color: "text-primary", bg: "bg-primary/10", action: () => {} },
                ].map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <Card key={stat.label} className="border-border cursor-pointer hover:shadow-md transition-shadow" onClick={stat.action}>
                      <CardContent className="p-4 flex flex-col gap-2">
                        <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                        <p className="text-xl font-bold">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Quick actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <button onClick={() => setActiveSection("merchants")} className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:border-primary hover:shadow transition-all text-sm text-gray-600">
                  <Store className="w-6 h-6 text-purple-500" /><span>Merchants</span>
                </button>
                <button onClick={() => setActiveSection("services")} className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:border-primary hover:shadow transition-all text-sm text-gray-600">
                  <Package className="w-6 h-6 text-blue-500" /><span>Services ({services.length})</span>
                </button>
                <button onClick={() => setActiveSection("deposits")} className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:border-primary hover:shadow transition-all text-sm text-gray-600 relative">
                  <Wallet className="w-6 h-6 text-yellow-500" /><span>Deposits</span>
                  {pendingDeposits.length > 0 && <span className="absolute top-2 right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{pendingDeposits.length}</span>}
                </button>
                <button onClick={() => setActiveSection("users")} className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:border-primary hover:shadow transition-all text-sm text-gray-600">
                  <Users className="w-6 h-6 text-green-500" /><span>Users ({users.length})</span>
                </button>
              </div>
            </div>
          )}

          {/* ══ ORDERS ══════════════════════════════════════════════════════════ */}
          {activeSection.startsWith("orders") && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="font-semibold">{sectionTitle[activeSection] ?? "Orders"}</h2>
                <div className="flex flex-wrap gap-1.5">
                  {["all","imei","server","tool"].map(t => (
                    <button key={t} onClick={() => setAdminOrderTypeFilter(t)} className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${adminOrderTypeFilter === t ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary"}`}>
                      {t === "all" ? "All Types" : t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              {getOrdersForSection().length === 0 ? (
                <p className="text-center py-8 text-muted-foreground text-sm">No orders found.</p>
              ) : getOrdersForSection().map((order) => (
                <OrderRow key={order.id} order={order} onUpdate={updateOrder} onCheckStatus={checkOrderStatus} onRefund={refundOrder} />
              ))}
            </div>
          )}

          {/* ══ SERVICES ════════════════════════════════════════════════════════ */}
          {activeSection === "services" && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground font-medium">{filteredSvcs.length}/{services.length} services · {(services as any[]).filter((s:any) => s.isActive).length} active</p>
                <div className="flex gap-2 flex-wrap">
                  {services.length > 0 && (
                    <Button onClick={deleteAllServices} size="sm" variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4 mr-2" />Delete All
                    </Button>
                  )}
                  <Button onClick={openAddService} size="sm"><Plus className="w-4 h-4 mr-2" />Add Service</Button>
                </div>
              </div>

              {/* ── Filters (appleunlcker style) ── */}
              <div className="flex flex-col gap-2">
                {/* Row 1: Merchant + Category Group dropdown */}
                <div className="flex flex-wrap gap-2">
                  <select value={svcMerchantFilter} onChange={e => setSvcMerchantFilter(e.target.value)} className="flex-1 min-w-[140px] px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:border-primary">
                    {svcMerchantNames.map((m: string) => <option key={m} value={m}>{m === "all" ? "All Merchants" : m}</option>)}
                  </select>
                  <select value={svcCategoryFilter} onChange={e => { setSvcCategoryFilter(e.target.value); setSvcGroupBy(true); }} className="flex-1 min-w-[140px] px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:border-primary">
                    {svcCategories.map((cat: string) => <option key={cat} value={cat}>{cat === "all" ? "All Groups" : cat}</option>)}
                  </select>
                </div>
                {/* Row 2: Search */}
                <input
                  type="text"
                  value={svcSearch}
                  onChange={e => setSvcSearch(e.target.value)}
                  placeholder="Search service..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:border-primary"
                />
              </div>

              {filteredSvcs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">No services match filters.</div>
              ) : svcGrouped.map(({ cat, items }) => (
                <div key={cat ?? "all"} className="flex flex-col gap-2">
                  {cat && (
                    <div className="bg-gray-100 rounded-lg px-3 py-2 mt-1 flex items-center justify-between">
                      <span className="font-bold text-sm text-gray-800">{cat}</span>
                      <span className="text-xs text-gray-500 bg-white rounded-full px-2 py-0.5 border border-gray-200">{items.length} services</span>
                    </div>
                  )}
                  {(items as any[]).map((svc: any) => {
                    const merchant = (merchants as any[]).find((m: any) => m.id === svc.merchantId);
                    return (
                      <Card key={svc.id} className="border-border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm leading-tight truncate">{svc.name}</p>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                {svc.category && <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-medium capitalize">{svc.category}</span>}
                                {merchant && <span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full font-medium">{merchant.name}</span>}
                                <span className="text-xs text-muted-foreground">API ID: {svc.apiServiceId}</span>
                              </div>
                              <p className="text-sm font-bold text-primary mt-1.5">${Number(svc.price ?? 0).toFixed(2)}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button onClick={() => toggleService(svc.id, svc.isActive)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${svc.isActive ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`} title={svc.isActive ? "Active" : "Inactive"}>
                                {svc.isActive ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                              </button>
                              <button onClick={() => openEditService(svc)} className="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-colors">
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button onClick={() => deleteService(svc.id)} className="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-destructive flex items-center justify-center transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* ══ MERCHANTS ═══════════════════════════════════════════════════════ */}
          {activeSection === "merchants" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="font-semibold text-lg">Supplier Merchants</h2>
                  <p className="text-xs text-muted-foreground">Products will be synced from active merchants only.</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={() => handleSync()} disabled={syncing !== null} size="sm" variant="outline">
                    <RefreshCw className={`w-4 h-4 mr-2 ${syncing === "all" ? "animate-spin" : ""}`} />
                    {syncing === "all" ? "Syncing all…" : "Sync All Active"}
                  </Button>
                  <Button onClick={openAddMerchant} size="sm"><Plus className="w-4 h-4 mr-2" />Add Merchant</Button>
                </div>
              </div>

              {syncResult && (
                <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-md border ${
                  syncResult.type === "success" ? "text-green-600 bg-green-500/10 border-green-500/20" : "text-destructive bg-destructive/10 border-destructive/20"
                }`}>
                  {syncResult.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  {syncResult.text}
                </div>
              )}

              {merchants.length === 0 ? (
                <div className="text-center py-16 flex flex-col items-center gap-3 text-muted-foreground">
                  <Store className="w-12 h-12 opacity-20" />
                  <p className="text-sm">No merchants added yet.</p>
                  <Button onClick={openAddMerchant} size="sm"><Plus className="w-4 h-4 mr-2" />Add First Merchant</Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {merchants.map((m) => (
                    <Card key={m.id} className={`border-border ${!m.isActive ? "opacity-60" : ""}`}>
                      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-sm">{m.name}</span>
                            <Badge variant="outline" className={`text-xs ${m.isActive ? "text-green-600 border-green-500/30 bg-green-500/10" : "text-gray-500 border-gray-300"}`}>
                              {m.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono truncate">{m.apiEndpoint}</p>
                          {m.apiUser && <p className="text-xs text-muted-foreground">User: {m.apiUser}</p>}
                          {m.description && <p className="text-xs text-muted-foreground">{m.description}</p>}
                          <p className="text-xs text-muted-foreground">Added {new Date(m.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0 items-end">
                          {testResults[m.id] && (
                            <div className={`text-xs px-2 py-1 rounded border max-w-xs text-right ${testResults[m.id].ok ? "text-green-700 bg-green-50 border-green-200" : "text-red-700 bg-red-50 border-red-200"}`}>
                              {testResults[m.id].message}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={() => testMerchant(m.id)} disabled={testingMerchant === m.id} className="border-blue-400 text-blue-600 hover:bg-blue-50">
                              <RefreshCw className={`w-3 h-3 mr-1 ${testingMerchant === m.id ? "animate-spin" : ""}`} />
                              {testingMerchant === m.id ? "Testing…" : "Test"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => toggleMerchant(m.id)} disabled={togglingMerchant === m.id} className={m.isActive ? "border-red-400 text-red-600 hover:bg-red-50" : "border-green-500 text-green-600 hover:bg-green-50"}>
                              {togglingMerchant === m.id ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : m.isActive ? <ToggleRight className="w-4 h-4 mr-1" /> : <ToggleLeft className="w-4 h-4 mr-1" />}
                              {m.isActive ? "Deactivate" : "Activate"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleSync(m.id)} disabled={syncing !== null || !m.isActive} title={!m.isActive ? "Activate merchant first" : "Sync products"}>
                              <RefreshCw className={`w-3 h-3 mr-1 ${syncing === m.id ? "animate-spin" : ""}`} />
                              {syncing === m.id ? "Syncing…" : "Sync"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => openEditMerchant(m)}>
                              <Pencil className="w-3 h-3 mr-1" />Edit
                            </Button>
                            <Button size="sm" variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={() => deleteMerchant(m.id, m.name)}>
                              <Trash2 className="w-3 h-3 mr-1" />Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ DEPOSITS ════════════════════════════════════════════════════════ */}
          {activeSection === "deposits" && (
            <div className="flex flex-col gap-3">
              <h2 className="font-semibold">Deposits {pendingDeposits.length > 0 && <span className="text-sm text-yellow-600 font-normal">({pendingDeposits.length} pending)</span>}</h2>
              <input type="text" placeholder="Search by order # or email…" value={depositSearch} onChange={(e) => setDepositSearch(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 bg-white" />
              {deposits.filter(d => !depositSearch || String(d.id).includes(depositSearch) || (d.userEmail ?? "").toLowerCase().includes(depositSearch.toLowerCase()) || (d.userName ?? "").toLowerCase().includes(depositSearch.toLowerCase())).length === 0 ? (
                <p className="text-center py-8 text-muted-foreground text-sm">No deposits found.</p>
              ) : deposits.filter(d => !depositSearch || String(d.id).includes(depositSearch) || (d.userEmail ?? "").toLowerCase().includes(depositSearch.toLowerCase()) || (d.userName ?? "").toLowerCase().includes(depositSearch.toLowerCase())).map((dep) => (
                <Card key={dep.id} className="border-border">
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm">#{dep.id}</span>
                        <Badge variant="outline" className="text-xs">{METHOD_LABELS[dep.method] ?? dep.method}</Badge>
                        <StatusBadge status={dep.status} />
                      </div>
                      <p className="text-xs text-muted-foreground">{dep.userEmail ?? dep.userName ?? `User #${dep.userId}`}</p>
                      {dep.txHash && <p className="text-xs text-muted-foreground">Note: {dep.txHash}</p>}
                      <p className="text-xs text-muted-foreground">{new Date(dep.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <p className="text-lg font-bold text-primary">${parseFloat(dep.amount).toFixed(2)}</p>
                      {dep.status === "pending" && (
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs" onClick={() => updateDeposit(dep.id, "approved")}><CheckCircle2 className="w-3 h-3 mr-1" />Approve</Button>
                          <Button size="sm" variant="outline" className="border-destructive text-destructive hover:bg-destructive/10 h-8 text-xs" onClick={() => updateDeposit(dep.id, "rejected")}><XCircle className="w-3 h-3 mr-1" />Reject</Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* ══ USERS ═══════════════════════════════════════════════════════════ */}
          {activeSection === "users" && (
            <div className="flex flex-col gap-3">
              <h2 className="font-semibold">Users ({users.length})</h2>
              <input type="text" placeholder="Search users by name or email…" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 bg-white" />
              {users.filter(u => !userSearch || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())).map((u) => (
                <Card key={u.id} className="border-border">
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-sm">{u.name}</span>
                        {u.role === "admin" && <Badge className="text-xs bg-primary">Admin</Badge>}
                        {!u.isEmailVerified && <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-400">Unverified</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                      <p className="text-xs text-muted-foreground">Joined {new Date(u.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-bold text-primary">${parseFloat(u.balance ?? "0").toFixed(2)}</span>
                      {u.role !== "admin" && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="h-7 text-xs px-2 text-green-600 border-green-400" onClick={() => { setUserActionModal({ user: u, type: "add" }); setUserActionAmount(""); setUserActionNote(""); }}>+$</Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs px-2 text-red-600 border-red-400" onClick={() => { setUserActionModal({ user: u, type: "deduct" }); setUserActionAmount(""); setUserActionNote(""); }}>-$</Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs px-2 text-destructive border-destructive" onClick={() => setUserActionModal({ user: u, type: "delete" })}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* ══ SETTINGS ════════════════════════════════════════════════════════ */}
          {activeSection === "settings" && (
            <div className="flex flex-col gap-4">
              <h2 className="font-semibold">Settings</h2>

              {/* Crypto toggle */}
              <Card className="border-border max-w-md">
                <CardContent className="p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold">Crypto Deposits</h3>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">Global On/Off</p>
                      <p className="text-xs text-muted-foreground">
                        {cryptoEnabled
                          ? "Users can deposit via USDT crypto"
                          : "Crypto deposits suspended for all users"}
                      </p>
                    </div>
                    <button
                      onClick={toggleCrypto}
                      disabled={togglingCrypto}
                      className="shrink-0 transition-colors disabled:opacity-50"
                      title={cryptoEnabled ? "Click to suspend" : "Click to enable"}
                    >
                      {cryptoEnabled
                        ? <ToggleRight className="w-12 h-12 text-green-500" />
                        : <ToggleLeft className="w-12 h-12 text-gray-400" />}
                    </button>
                  </div>
                  {!cryptoEnabled && (
                    <p className="text-xs bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg px-3 py-2">
                      ⚠ Crypto deposits are currently suspended. Users will see "Temporarily Suspended" and be directed to manual payment.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Admin password */}
              <Card className="border-border max-w-md">
                <CardContent className="p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold">Change Admin Password</h3>
                  </div>
                  <div className="grid gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label>Current Password</Label>
                      <Input type="password" value={pwChange.current} onChange={(e) => setPwChange(p => ({ ...p, current: e.target.value }))} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label>New Password</Label>
                      <Input type="password" value={pwChange.newPw} onChange={(e) => setPwChange(p => ({ ...p, newPw: e.target.value }))} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label>Confirm New Password</Label>
                      <Input type="password" value={pwChange.confirm} onChange={(e) => setPwChange(p => ({ ...p, confirm: e.target.value }))} />
                    </div>
                    <Button onClick={handlePasswordChange} disabled={changingPw} className="w-fit">
                      {changingPw ? "Changing…" : "Change Password"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

        </main>
      </div>

      {/* ── User action modal ──────────────────────────────────────────────── */}
      {userActionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm flex flex-col gap-4 p-6">
            <h3 className="font-semibold text-lg capitalize">{userActionModal.type} balance — {userActionModal.user.name}</h3>
            {userActionModal.type === "delete" ? (
              <p className="text-sm text-muted-foreground">Are you sure you want to delete <strong>{userActionModal.user.name}</strong>? This cannot be undone.</p>
            ) : (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label>Amount (USD)</Label>
                  <Input type="number" min="0" step="0.01" placeholder="0.00" value={userActionAmount} onChange={(e) => setUserActionAmount(e.target.value)} autoFocus />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Note (optional)</Label>
                  <Input placeholder="Reason…" value={userActionNote} onChange={(e) => setUserActionNote(e.target.value)} />
                </div>
              </>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setUserActionModal(null)}>Cancel</Button>
              <Button onClick={handleUserAction} disabled={userActionLoading} className={userActionModal.type === "delete" ? "bg-destructive hover:bg-destructive/90" : ""}>
                {userActionLoading ? "Processing…" : userActionModal.type === "delete" ? "Delete" : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Merchant modal ─────────────────────────────────────────────────── */}
      {showMerchantModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col gap-4 p-6">
            <h3 className="font-semibold text-lg">{editingMerchant ? "Edit Merchant" : "Add New Merchant"}</h3>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Merchant Name *</Label>
                <Input placeholder="e.g. DoctorSIM, DirectUnlocks" value={merchantForm.name} onChange={(e) => setMerchantForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>API Endpoint (URL) *</Label>
                <Input placeholder="https://api.merchant.com" value={merchantForm.apiEndpoint} onChange={(e) => setMerchantForm(f => ({ ...f, apiEndpoint: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>API Key {editingMerchant ? "(leave blank to keep current)" : "*"}</Label>
                <Input type="password" placeholder={editingMerchant ? "••••••••" : "Your API key"} value={merchantForm.apiKey} onChange={(e) => setMerchantForm(f => ({ ...f, apiKey: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>API Format *</Label>
                <Select value={merchantForm.apiFormat} onValueChange={(v) => setMerchantForm(f => ({ ...f, apiFormat: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rest">REST API (GET /services + Auth header)</SelectItem>
                    <SelectItem value="form">Form/SMM Panel (POST + key in body)</SelectItem>
                    <SelectItem value="dhru">Dhru Fusion Legacy (GSM Africa, etc)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  {merchantForm.apiFormat === "form"
                    ? "LegitUnlocks, DoctorSIM, SMM panels — sends: key=xxx&action=services"
                    : merchantForm.apiFormat === "dhru"
                    ? "GSM Africa, Dhru Fusion legacy — sends: key=xxx&action=product&username=yyy"
                    : "Modern REST APIs — sends Authorization header"}
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>API User / Partner ID (optional)</Label>
                <Input placeholder="Optional username or partner ID" value={merchantForm.apiUser} onChange={(e) => setMerchantForm(f => ({ ...f, apiUser: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Note (optional)</Label>
                <Textarea placeholder="Internal note about this merchant…" rows={2} value={merchantForm.description} onChange={(e) => setMerchantForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowMerchantModal(false)}>Cancel</Button>
              <Button onClick={saveMerchant} disabled={savingMerchant}>
                {savingMerchant ? "Saving…" : editingMerchant ? "Update" : "Add Merchant"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Service modal ──────────────────────────────────────────────────── */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col gap-4 p-6">
            <h3 className="font-semibold text-lg">{editingService ? "Edit Service" : "Add Service"}</h3>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Service Name *</Label>
                <Input placeholder="e.g. iPhone Unlock — T-Mobile USA" value={serviceForm.name} onChange={(e) => setServiceForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Category *</Label>
                  <Select value={serviceForm.category} onValueChange={(v) => setServiceForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="imei">IMEI Unlock</SelectItem>
                      <SelectItem value="server">Server Unlock</SelectItem>
                      <SelectItem value="tool">Remote / Rent Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Price (USD) *</Label>
                  <Input type="number" min="0" step="0.01" placeholder="0.00" value={serviceForm.price} onChange={(e) => setServiceForm(f => ({ ...f, price: e.target.value }))} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Delivery Time</Label>
                <Input placeholder="e.g. 1-3 hours, 24 hours" value={serviceForm.deliveryTime} onChange={(e) => setServiceForm(f => ({ ...f, deliveryTime: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Description</Label>
                <Textarea placeholder="Brief description…" rows={3} value={serviceForm.description} onChange={(e) => setServiceForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              {/* ── Order Form Fields ── */}
              <div className="border-t pt-3 mt-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Order Form Fields</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label>Identifier Type</Label>
                    <Select value={(serviceForm as any).identifierType ?? "imei"} onValueChange={(v) => setServiceForm(f => ({ ...f, identifierType: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="imei">IMEI (numeric kb)</SelectItem>
                        <SelectItem value="sn">Serial Number</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="username">Username</SelectItem>
                        <SelectItem value="none">No identifier</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Field Label</Label>
                    <Input placeholder="e.g. Enter IMEI" value={(serviceForm as any).fieldLabel ?? ""} onChange={(e) => setServiceForm(f => ({ ...f, fieldLabel: e.target.value }))} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 mt-3">
                  {([["requireQuantity","Quantity"],["requireUsername","Username"],["requireEmail","Email"]] as const).map(([key, lbl]) => (
                    <label key={key} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                      <input type="checkbox" checked={(serviceForm as any)[key] ?? false}
                        onChange={(e) => setServiceForm(f => ({ ...f, [key]: e.target.checked }))}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      {lbl}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowServiceModal(false)}>Cancel</Button>
              <Button onClick={saveService} disabled={savingService}>{savingService ? "Saving…" : editingService ? "Update" : "Create"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helper Components ────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    approved: "bg-green-500/10 text-green-600 border-green-500/20",
    completed: "bg-green-500/10 text-green-600 border-green-500/20",
    rejected: "bg-red-500/10 text-red-600 border-red-500/20",
    failed: "bg-red-500/10 text-red-600 border-red-500/20",
    processing: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    cancelled: "bg-gray-500/10 text-gray-600 border-gray-500/20",
    refunded: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  };
  return <Badge variant="outline" className={`text-xs capitalize ${map[status] ?? ""}`}>{status}</Badge>;
}

function OrderRow({ order, onUpdate, onCheckStatus, onRefund }: {
  order: Order;
  onUpdate: (id: number, status: string, result?: string) => void;
  onCheckStatus: (id: number) => void;
  onRefund: (id: number) => void;
}) {
  const [resultText, setResultText] = useState(order.result ?? "");
  const isActive = order.status === "pending" || order.status === "processing";
  const canRefund = order.status !== "refunded";
  return (
    <Card className="border-border w-full overflow-hidden">
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-sm">#{order.id} — {order.serviceName ?? "Service"}</span>
            <StatusBadge status={order.status} />
            {order.apiOrderId && <Badge variant="outline" className="text-xs text-muted-foreground font-mono">API#{order.apiOrderId.slice(0,8)}</Badge>}
          </div>
          <span className="font-bold text-primary">${parseFloat(order.price).toFixed(2)}</span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>{order.userEmail ?? `User #${order.userId}`}</span>
          <span>·</span>
          <span className="font-mono">{order.identifier}</span>
          <span>·</span>
          <span>{new Date(order.createdAt).toLocaleString()}</span>
        </div>
        {order.result && (
          <div className="px-3 py-2 bg-green-500/5 border border-green-500/20 rounded text-xs text-green-700">
            <strong>Result:</strong> {order.result}
          </div>
        )}
        {isActive && (
          <div className="flex flex-col sm:flex-row gap-2 pt-1 border-t border-border">
            <Input placeholder="Unlock result / code (optional)" value={resultText} onChange={(e) => setResultText(e.target.value)} className="flex-1 h-8 text-xs" />
            <div className="flex gap-2 shrink-0 flex-wrap">
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs" onClick={() => onUpdate(order.id, "completed", resultText || undefined)}><CheckCircle2 className="w-3 h-3 mr-1" />Complete</Button>
              <Button size="sm" variant="outline" className="border-blue-500 text-blue-600 h-8 text-xs" onClick={() => onUpdate(order.id, "processing")}><Clock className="w-3 h-3 mr-1" />Processing</Button>
              <Button size="sm" variant="outline" className="border-destructive text-destructive h-8 text-xs" onClick={() => onUpdate(order.id, "failed")}><XCircle className="w-3 h-3 mr-1" />Fail</Button>
            </div>
          </div>
        )}
        <div className="flex gap-2 flex-wrap pt-1 border-t border-border">
          {order.apiOrderId && (
            <Button size="sm" variant="outline" className="border-blue-400 text-blue-600 hover:bg-blue-50 h-7 text-xs" onClick={() => onCheckStatus(order.id)}>
              <RefreshCw className="w-3 h-3 mr-1" />Check API Status
            </Button>
          )}
          {canRefund && (
            <Button size="sm" variant="outline" className="border-purple-400 text-purple-600 hover:bg-purple-50 h-7 text-xs" onClick={() => onRefund(order.id)}>
              <Wallet className="w-3 h-3 mr-1" />Refund
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
