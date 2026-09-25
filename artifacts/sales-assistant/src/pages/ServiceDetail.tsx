import { useEffect, useState, type ChangeEvent, type SyntheticEvent } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useSEO } from "@/lib/seo";
import { AlertCircle, ArrowLeft, CheckCircle2, Clock, Minus, Plus, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface OrderField {
  name: string;
  label?: string;
  type?: string;
  required?: boolean;
  min?: number;
  max?: number;
  options?: string[];
}

interface Service {
  slug?: string;
  name: string;
  description?: string | null;
  price: string;
  deliveryTime?: string | null;
  processingTime?: string | null;
  serviceType?: string | null;
  category?: string | null;
  identifierType?: string | null;
  fieldLabel?: string | null;
  requireQuantity?: boolean;
  requireUsername?: boolean;
  requireEmail?: boolean;
  orderFields?: OrderField[];
}

function fieldMatches(field: OrderField, expression: RegExp) {
  return expression.test(`${field.name} ${field.label ?? ""}`);
}

function displayFieldLabel(field: OrderField) {
  return field.label?.trim() || field.name.replace(/[-_]/g, " ");
}

export default function ServiceDetail() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadAttempt, setReloadAttempt] = useState(0);
  const [identifier, setIdentifier] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [orderUsername, setOrderUsername] = useState("");
  const [orderEmail, setOrderEmail] = useState("");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const seoDescription = service?.description?.trim() ||
    "Place a secure device service order with clear requirements and reliable processing from iUnlockd.";
  useSEO(
    service ? `${service.name} | iUnlockd` : "Service details | iUnlockd",
    seoDescription,
    { canonicalUrl: slug ? location.pathname : "/services" },
  );

  useEffect(() => {
    let cancelled = false;

    async function loadService() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/services/slug/${encodeURIComponent(slug ?? "")}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Service not found");
        const nextService = (data.service ?? data) as Service;
        if (!cancelled) {
          setService({
            ...nextService,
            orderFields: Array.isArray(nextService.orderFields) ? nextService.orderFields : [],
          });
          setFieldValues({});
          setIdentifier("");
          setQuantity(1);
          setOrderUsername("");
          setOrderEmail("");
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load this service.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadService();
    return () => {
      cancelled = true;
    };
  }, [slug, reloadAttempt]);

  const identType = service?.identifierType?.trim().toLowerCase() || "none";
  const isIMEI = identType === "imei";
  const isSN = identType === "sn" || identType === "serial";
  const isEmailIdent = identType === "email";
  const hasIdentifier = identType !== "none";
  const dynamicFields = service?.orderFields ?? [];
  const hasDynamicFields = dynamicFields.length > 0;
  const quantityField = dynamicFields.find((field) => /^quantity$/i.test(field.name));
  const dynamicIdentifierField = dynamicFields.find((field) => fieldMatches(field, /\b(imei|serial|sn|email|username)\b/i));
  const dynamicUsernameField = dynamicFields.find((field) => fieldMatches(field, /\busername\b/i));
  const dynamicEmailField = dynamicFields.find((field) => fieldMatches(field, /\bemail\b/i));
  const shouldRenderLegacyQuantity = Boolean(service?.requireQuantity && !quantityField);
  const shouldRenderLegacyIdentifier = Boolean(hasIdentifier && !dynamicIdentifierField);
  const shouldRenderLegacyUsername = Boolean(service?.requireUsername && !dynamicUsernameField);
  const shouldRenderLegacyEmail = Boolean(service?.requireEmail && !dynamicEmailField);
  const requiresQuantity = Boolean(quantityField || service?.requireQuantity);
  const hasOrderFields = Boolean(
    hasDynamicFields ||
    shouldRenderLegacyIdentifier ||
    shouldRenderLegacyQuantity ||
    shouldRenderLegacyUsername ||
    shouldRenderLegacyEmail,
  );
  const fieldLabel = service?.fieldLabel?.trim() ||
    (isIMEI ? "IMEI number" : isSN ? "Serial number" : isEmailIdent ? "Email address" : identType === "username" ? "Username" : "Identifier");
  const imeiValid = !isIMEI || /^\d{15}$/.test(identifier.replace(/\s/g, ""));

  function setFieldValue(name: string, value: string) {
    setFieldValues((previous) => ({ ...previous, [name]: value }));
  }

  function setQuantityValue(value: string, field?: OrderField) {
    const parsed = Number(value);
    const minimum = field?.min ?? 1;
    const maximum = field?.max;
    const next = Number.isFinite(parsed) ? Math.max(minimum, maximum === undefined ? parsed : Math.min(parsed, maximum)) : minimum;
    setQuantity(Math.max(1, next));
  }

  const handleOrder = async (event?: SyntheticEvent) => {
    event?.preventDefault();
    if (!user) {
      navigate("/login", { state: { from: `/services/${slug}` } });
      return;
    }

    setError("");
    if (!service) return;

    if (shouldRenderLegacyIdentifier && isIMEI && !imeiValid) {
      setError("IMEI must be exactly 15 digits.");
      return;
    }
    if (shouldRenderLegacyIdentifier && !identifier.trim()) {
      setError(`${fieldLabel} is required.`);
      return;
    }
    if (shouldRenderLegacyEmail && !orderEmail.trim()) {
      setError("Email is required.");
      return;
    }
    if (shouldRenderLegacyUsername && !orderUsername.trim()) {
      setError("Username is required.");
      return;
    }

    const submittedFields: Record<string, string> = { ...fieldValues };
    if (quantityField) submittedFields[quantityField.name] = String(quantity);

    if (hasDynamicFields) {
      const requiredField = dynamicFields.find((field) => field.required && !submittedFields[field.name]?.trim());
      if (requiredField) {
        setError(`${displayFieldLabel(requiredField)} is required.`);
        return;
      }
      const dynamicImeiField = dynamicFields.find((field) => fieldMatches(field, /\bimei\b/i));
      if (dynamicImeiField && submittedFields[dynamicImeiField.name] && !/^\d{15}$/.test(submittedFields[dynamicImeiField.name].replace(/\s/g, ""))) {
        setError(`${displayFieldLabel(dynamicImeiField)} must be exactly 15 digits.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("iu_token");
      const body: Record<string, unknown> = { serviceSlug: service.slug ?? slug };

      if (hasDynamicFields) {
        body.formFields = submittedFields;
        if (dynamicIdentifierField && submittedFields[dynamicIdentifierField.name]) {
          body.identifier = submittedFields[dynamicIdentifierField.name];
        }
        if (shouldRenderLegacyIdentifier) body.identifier = identifier.trim();
        if (shouldRenderLegacyQuantity) body.quantity = quantity;
        if (shouldRenderLegacyUsername) body.orderUsername = orderUsername.trim();
        if (shouldRenderLegacyEmail) body.orderEmail = orderEmail.trim();
      } else {
        if (hasIdentifier) body.identifier = identifier.trim();
        if (service.requireQuantity) body.quantity = quantity;
        if (service.requireUsername) body.orderUsername = orderUsername.trim();
        if (service.requireEmail) body.orderEmail = orderEmail.trim();
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Order failed. Please try again.");
        return;
      }

      setSuccess(true);
      await refreshUser();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[40vh] max-w-2xl flex-col gap-4 px-4 py-8" aria-label="Loading service">
        <div className="h-5 w-20 animate-pulse rounded bg-muted" />
        <div className="h-72 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="mb-4 text-muted-foreground">{error || "Service not found."}</p>
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={() => navigate(-1)} data-testid="button-go-back">
            <ArrowLeft className="mr-2 h-4 w-4" />Go back
          </Button>
          <Button onClick={() => setReloadAttempt((attempt) => attempt + 1)} data-testid="button-retry-service">Try again</Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold">Order placed</h2>
        <p className="text-sm text-muted-foreground">Your order has been submitted and is being processed.</p>
        <div className="mt-2 flex gap-3">
          <Button onClick={() => navigate("/orders")} data-testid="button-view-orders">View orders</Button>
          <Button
            variant="outline"
            onClick={() => {
              setSuccess(false);
              setError("");
              setIdentifier("");
              setQuantity(1);
              setOrderUsername("");
              setOrderEmail("");
              setFieldValues({});
            }}
            data-testid="button-new-order"
          >
            New order
          </Button>
        </div>
      </div>
    );
  }

  const balance = Number.parseFloat(user?.balance ?? "0") || 0;
  const price = Number.parseFloat(service.price) || 0;
  const totalPrice = price * (requiresQuantity ? quantity : 1);
  const canAfford = balance >= totalPrice;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <Button variant="ghost" size="sm" className="-ml-2 w-fit" onClick={() => navigate(-1)} data-testid="button-back-service">
        <ArrowLeft className="mr-2 h-4 w-4" />Back
      </Button>
      <Card className="border-border">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <Badge variant="secondary" className="w-fit text-xs capitalize">{service.serviceType ?? "Device"} service</Badge>
              <CardTitle className="text-xl">{service.name}</CardTitle>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">${price.toFixed(2)}</p>
              {requiresQuantity && quantity > 1 && <p className="text-sm text-muted-foreground">Total: ${totalPrice.toFixed(2)}</p>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {service.description && <p className="text-sm leading-relaxed text-muted-foreground">{service.description}</p>}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />Processing time: {service.deliveryTime ?? service.processingTime ?? "Varies"}
          </div>
          {user && (
            <div className="flex items-center gap-2 text-sm">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Your balance:</span>
              <span className={`font-semibold ${canAfford ? "text-emerald-600" : "text-destructive"}`}>${balance.toFixed(2)}</span>
              {!canAfford && <Button variant="link" size="sm" className="h-auto p-0 text-primary" onClick={() => navigate("/deposit")} data-testid="link-add-funds">Add funds</Button>}
            </div>
          )}
          <div className="border-t border-border pt-4">
            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert" data-testid="status-order-error">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}
              </div>
            )}
            {!hasOrderFields ? (
              <>
                {!user ? (
                  <Button type="button" className="w-full" onClick={() => navigate("/login", { state: { from: `/services/${slug}` } })} data-testid="button-login-purchase">
                    Login to purchase
                  </Button>
                ) : (
                  <Button type="button" className="w-full" disabled={submitting || !canAfford} onClick={() => void handleOrder()} data-testid="button-purchase-service">
                    {submitting ? "Processing..." : `Purchase — $${totalPrice.toFixed(2)}`}
                  </Button>
                )}
                {!canAfford && user && <p className="mt-2 text-center text-xs text-muted-foreground">Insufficient balance. Please <button type="button" className="text-primary underline" onClick={() => navigate("/deposit")} data-testid="link-deposit-service">deposit funds</button> first.</p>}
              </>
            ) : (
              <form onSubmit={handleOrder} className="flex flex-col gap-4">
                <p className="text-sm font-semibold">Order details</p>
                {shouldRenderLegacyQuantity && (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="quantity">Quantity</Label>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center overflow-hidden rounded-md border border-border">
                        <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="border-r border-border px-3 py-2 hover:bg-accent" aria-label="Decrease quantity" data-testid="button-decrease-quantity"><Minus className="h-4 w-4" /></button>
                        <span className="min-w-[3rem] px-5 py-2 text-center font-semibold" data-testid="text-quantity">{quantity}</span>
                        <button type="button" onClick={() => setQuantity(quantity + 1)} className="border-l border-border px-3 py-2 hover:bg-accent" aria-label="Increase quantity" data-testid="button-increase-quantity"><Plus className="h-4 w-4" /></button>
                      </div>
                      <span className="text-sm text-muted-foreground">${price.toFixed(2)} each</span>
                    </div>
                  </div>
                )}
                {shouldRenderLegacyIdentifier && (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="identifier">{fieldLabel}<span className="ml-1 text-destructive">*</span></Label>
                    <Input
                      id="identifier"
                      placeholder={isIMEI ? "Enter 15-digit IMEI number" : isSN ? "Enter serial number" : isEmailIdent ? "Enter email address" : `Enter ${fieldLabel}`}
                      value={identifier}
                      inputMode={isIMEI ? "numeric" : isEmailIdent ? "email" : "text"}
                      type={isEmailIdent ? "email" : "text"}
                      pattern={isIMEI ? "[0-9]*" : undefined}
                      onChange={(event) => setIdentifier(isIMEI ? event.target.value.replace(/\D/g, "").slice(0, 15) : event.target.value)}
                      maxLength={isIMEI ? 15 : undefined}
                      required
                      className={isIMEI && identifier.length > 0 && !imeiValid ? "border-destructive" : ""}
                      data-testid="input-service-identifier"
                    />
                    {isIMEI && <p className={`text-xs ${identifier.length === 15 ? "text-emerald-600" : "text-muted-foreground"}`}>{identifier.length}/15 digits</p>}
                  </div>
                )}
                {shouldRenderLegacyUsername && (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="orderUsername">Username<span className="ml-1 text-destructive">*</span></Label>
                    <Input id="orderUsername" placeholder="Enter username" value={orderUsername} onChange={(event) => setOrderUsername(event.target.value)} required data-testid="input-service-username" />
                  </div>
                )}
                {shouldRenderLegacyEmail && (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="orderEmail">Email<span className="ml-1 text-destructive">*</span></Label>
                    <Input id="orderEmail" type="email" inputMode="email" placeholder="Enter email address" value={orderEmail} onChange={(event) => setOrderEmail(event.target.value)} required data-testid="input-service-email" />
                  </div>
                )}
                {hasDynamicFields && dynamicFields.map((field) => {
                  const fieldId = `field-${field.name}`;
                  const label = displayFieldLabel(field);
                  const fieldType = field.type?.toLowerCase() ?? "text";
                  const value = fieldValues[field.name] ?? "";
                  const required = Boolean(field.required);
                  const inputType: "email" | "number" | "password" | "tel" | "text" | "url" | "date" =
                    fieldType === "email" || fieldType === "number" || fieldType === "password" ||
                    fieldType === "tel" || fieldType === "url" || fieldType === "date" ? fieldType : "text";
                  const onChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setFieldValue(field.name, event.target.value);

                  if (/^quantity$/i.test(field.name)) {
                    return (
                      <div key={field.name} className="flex flex-col gap-1.5">
                        <Label htmlFor={fieldId}>{label}{required && <span className="ml-1 text-destructive">*</span>}</Label>
                        <Input id={fieldId} name={field.name} type="number" min={field.min ?? 1} max={field.max} value={quantity} onChange={(event) => setQuantityValue(event.target.value, field)} required={required} data-testid={`input-service-${field.name}`} />
                      </div>
                    );
                  }

                  return (
                    <div key={field.name} className="flex flex-col gap-1.5">
                      <Label htmlFor={fieldId}>{label}{required && <span className="ml-1 text-destructive">*</span>}</Label>
                      {fieldType === "textarea" ? (
                        <Textarea id={fieldId} name={field.name} value={value} required={required} minLength={field.min} maxLength={field.max} onChange={onChange} placeholder={`Enter ${label}`} data-testid={`input-service-${field.name}`} />
                      ) : fieldType === "select" && field.options?.length ? (
                        <select id={fieldId} name={field.name} value={value} required={required} onChange={onChange} className="h-10 rounded-md border border-input bg-background px-3 text-sm" data-testid={`input-service-${field.name}`}>
                          <option value="">Select {label}</option>
                          {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      ) : (
                        <Input id={fieldId} name={field.name} value={value} required={required} minLength={fieldType === "number" ? undefined : field.min} maxLength={fieldType === "number" ? undefined : field.max} min={fieldType === "number" ? field.min : undefined} max={fieldType === "number" ? field.max : undefined} type={inputType} inputMode={fieldMatches(field, /\bimei\b/i) ? "numeric" : fieldType === "email" ? "email" : fieldType === "tel" ? "tel" : undefined} pattern={fieldMatches(field, /\bimei\b/i) ? "[0-9]*" : undefined} onChange={onChange} placeholder={`Enter ${label}`} data-testid={`input-service-${field.name}`} />
                      )}
                    </div>
                  );
                })}
                {!user ? (
                  <Button type="button" onClick={() => navigate("/login", { state: { from: `/services/${slug}` } })} data-testid="button-login-order">Login to order</Button>
                ) : (
                  <Button type="submit" disabled={submitting || !canAfford || (shouldRenderLegacyIdentifier && isIMEI && !imeiValid)} className="w-full" data-testid="button-submit-order">
                    {submitting ? "Placing order..." : `Order — $${totalPrice.toFixed(2)}`}
                  </Button>
                )}
                {!canAfford && user && <p className="text-center text-xs text-muted-foreground">Insufficient balance. Please <button type="button" className="text-primary underline" onClick={() => navigate("/deposit")} data-testid="link-deposit-order">deposit funds</button> first.</p>}
              </form>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}