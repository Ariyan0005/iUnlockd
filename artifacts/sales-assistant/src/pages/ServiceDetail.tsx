import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Clock, Wallet, AlertCircle, ArrowLeft, CheckCircle2, Minus, Plus } from "lucide-react";

interface Service {
  id: number; name: string; description: string; price: string;
  deliveryTime: string; processingTime: string; serviceType: string; category: string;
  identifierType: string; fieldLabel: string | null;
  requireQuantity: boolean; requireUsername: boolean; requireEmail: boolean;
}

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [identifier, setIdentifier] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [orderUsername, setOrderUsername] = useState("");
  const [orderEmail, setOrderEmail] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ orderId: number } | null>(null);

  useEffect(() => {
    fetch(`/api/services/${id}`)
      .then((r) => r.json())
      .then((data) => setService(data.service ?? data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const identType = service?.identifierType ?? "imei";
  const isIMEI = identType === "imei";
  const isSN = identType === "sn";
  const isEmailIdent = identType === "email";
  const hasIdentifier = identType !== "none";
  const fieldLabel = service?.fieldLabel ||
    (isIMEI ? "IMEI Number" : isSN ? "Serial Number" : isEmailIdent ? "Email Address" : identType === "username" ? "Username" : "Identifier");
  const imeiValid = !isIMEI || /^\d{15}$/.test(identifier.replace(/\s/g, ""));

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate("/login", { state: { from: `/services/${id}` } }); return; }
    setError("");
    if (isIMEI && !imeiValid) { setError("IMEI must be exactly 15 digits."); return; }
    if (hasIdentifier && !identifier.trim()) { setError(`${fieldLabel} is required.`); return; }
    if (service?.requireEmail && !orderEmail.trim()) { setError("Email is required."); return; }
    if (service?.requireUsername && !orderUsername.trim()) { setError("Username is required."); return; }
    setSubmitting(true);
    try {
      const token = localStorage.getItem("iu_token");
      const body: Record<string, unknown> = { serviceId: Number(id) };
      if (hasIdentifier) body.identifier = identifier.trim();
      if (additionalInfo) body.additionalInfo = additionalInfo;
      if (service?.requireQuantity) body.quantity = quantity;
      if (service?.requireUsername) body.orderUsername = orderUsername.trim();
      if (service?.requireEmail) body.orderEmail = orderEmail.trim();
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Order failed"); return; }
      setSuccess({ orderId: data.order?.id ?? data.id });
      refreshUser();
    } catch { setError("Network error. Please try again."); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground">Loading…</div>;
  if (!service) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <p className="text-muted-foreground mb-4">Service not found.</p>
      <Button variant="outline" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4 mr-2" />Go Back</Button>
    </div>
  );
  if (success) return (
    <div className="max-w-md mx-auto px-4 py-16 text-center flex flex-col items-center gap-4">
      <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
        <CheckCircle2 className="w-8 h-8 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold">Order Placed!</h2>
      <p className="text-muted-foreground text-sm">Your order #{success.orderId} has been submitted and is being processed.</p>
      <div className="flex gap-3 mt-2">
        <Button onClick={() => navigate("/orders")}>View Orders</Button>
        <Button variant="outline" onClick={() => { setSuccess(null); setIdentifier(""); setQuantity(1); setOrderUsername(""); setOrderEmail(""); setAdditionalInfo(""); }}>New Order</Button>
      </div>
    </div>
  );

  const balance = parseFloat(user?.balance ?? "0");
  const price = parseFloat(service.price);
  const qty = service.requireQuantity ? quantity : 1;
  const totalPrice = price * qty;
  const canAfford = balance >= totalPrice;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">
      <Button variant="ghost" size="sm" className="w-fit -ml-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4 mr-2" />Back
      </Button>
      <Card className="border-border">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <Badge variant="secondary" className="w-fit text-xs capitalize">{service.serviceType} Service</Badge>
              <CardTitle className="text-xl">{service.name}</CardTitle>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">${price.toFixed(2)}</p>
              {service.requireQuantity && qty > 1 && <p className="text-sm text-muted-foreground">Total: ${totalPrice.toFixed(2)}</p>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {service.description && <p className="text-muted-foreground text-sm leading-relaxed">{service.description}</p>}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />Processing time: {service.deliveryTime ?? service.processingTime ?? "Varies"}
          </div>
          {user && (
            <div className="flex items-center gap-2 text-sm">
              <Wallet className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Your balance:</span>
              <span className={`font-semibold ${canAfford ? "text-green-600" : "text-destructive"}`}>${balance.toFixed(2)}</span>
              {!canAfford && <Button variant="link" size="sm" className="p-0 h-auto text-primary" onClick={() => navigate("/deposit")}>Add funds</Button>}
            </div>
          )}
          <div className="border-t border-border pt-4">
            <p className="text-sm font-semibold mb-4">Order form</p>
            <form onSubmit={handleOrder} className="flex flex-col gap-4">
              {error && (
                <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
                </div>
              )}
              {service.requireQuantity && (
                <div className="flex flex-col gap-1.5">
                  <Label>Quantity</Label>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-border rounded-md overflow-hidden">
                      <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-2 hover:bg-accent transition-colors border-r border-border"><Minus className="w-4 h-4" /></button>
                      <span className="px-5 py-2 font-semibold min-w-[3rem] text-center">{quantity}</span>
                      <button type="button" onClick={() => setQuantity(quantity + 1)} className="px-3 py-2 hover:bg-accent transition-colors border-l border-border"><Plus className="w-4 h-4" /></button>
                    </div>
                    <span className="text-sm text-muted-foreground">${price.toFixed(2)} each</span>
                  </div>
                </div>
              )}
              {hasIdentifier && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="identifier">{fieldLabel}<span className="text-destructive ml-1">*</span></Label>
                  <Input id="identifier"
                    placeholder={isIMEI ? "Enter 15-digit IMEI number" : isSN ? "Enter serial number" : isEmailIdent ? "Enter email address" : `Enter ${fieldLabel}`}
                    value={identifier}
                    inputMode={isIMEI ? "numeric" : isEmailIdent ? "email" : "text"}
                    type={isEmailIdent ? "email" : "text"}
                    pattern={isIMEI ? "[0-9]*" : undefined}
                    onChange={(e) => setIdentifier(isIMEI ? e.target.value.replace(/\D/g, "").slice(0, 15) : e.target.value)}
                    maxLength={isIMEI ? 15 : undefined}
                    required
                    className={isIMEI && identifier.length > 0 && !imeiValid ? "border-destructive" : ""}
                  />
                  {isIMEI && <p className={`text-xs ${identifier.length === 15 ? "text-green-600" : "text-muted-foreground"}`}>{identifier.length}/15 digits {identifier.length === 15 ? "✓ Valid" : ""}</p>}
                </div>
              )}
              {service.requireUsername && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="orderUsername">Username<span className="text-destructive ml-1">*</span></Label>
                  <Input id="orderUsername" placeholder="Enter username" value={orderUsername} onChange={(e) => setOrderUsername(e.target.value)} required />
                </div>
              )}
              {service.requireEmail && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="orderEmail">Email<span className="text-destructive ml-1">*</span></Label>
                  <Input id="orderEmail" type="email" inputMode="email" placeholder="Enter email address" value={orderEmail} onChange={(e) => setOrderEmail(e.target.value)} required />
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="additionalInfo">Comments (optional)</Label>
                <Input id="additionalInfo" placeholder="Additional notes…" value={additionalInfo} onChange={(e) => setAdditionalInfo(e.target.value)} />
              </div>
              {!user ? (
                <Button type="button" onClick={() => navigate("/login", { state: { from: `/services/${id}` } })}>Login to Order</Button>
              ) : (
                <Button type="submit" disabled={submitting || !canAfford || (isIMEI && !imeiValid)} className="w-full">
                  {submitting ? "Placing order…" : `Order — $${totalPrice.toFixed(2)}`}
                </Button>
              )}
              {!canAfford && user && (
                <p className="text-xs text-center text-muted-foreground">
                  Insufficient balance. Please <button type="button" className="text-primary underline" onClick={() => navigate("/deposit")}>deposit funds</button> first.
                </p>
              )}
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
