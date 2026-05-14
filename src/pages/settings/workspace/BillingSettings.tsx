import { useState, useEffect, useCallback, useRef } from "react";
import { Check, Loader2, Star, Building2, Users, UserCheck, MessageCircle, CreditCard, Upload, X, Clock } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../services/api";
import { Badge } from "../../../components/ui/badge";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { cn } from "../../../components/ui/utils";

const fmt = (n: number) => `₦${n.toLocaleString("en-NG")}`;

const PLAN_RING: Record<string, string> = {
  Free:       "border-neutral-200",
  Starter:    "border-blue-300",
  Growth:     "border-[#2a52a8]",
  Scale:      "border-violet-400",
  Enterprise: "border-amber-400",
};

const PLAN_BADGE: Record<string, string> = {
  Free:       "bg-neutral-100 text-neutral-600",
  Starter:    "bg-blue-50 text-blue-700",
  Growth:     "bg-[#0E2C72]/6 text-[#0E2C72]",
  Scale:      "bg-violet-50 text-violet-700",
  Enterprise: "bg-amber-50 text-amber-700",
};

function limitLabel(val: number | null): string {
  return val == null ? "Unlimited" : val.toLocaleString();
}

// ── Plan Switch Modal ──────────────────────────────────────────────────────────

function PlanSwitchModal({
  plan,
  paymentDetails,
  onClose,
  onSubmitted,
}: {
  plan: any;
  paymentDetails: any;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [receipt, setReceipt] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const price = plan.price_quarterly ?? plan.price_monthly ?? 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setReceipt(file);
  };

  const handleSubmit = async () => {
    if (!receipt) { toast.error("Please upload a payment receipt."); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("plan", plan.key);
      fd.append("receipt", receipt);
      await api.workspaces.submitPlanReceipt(fd);
      setDone(true);
      onSubmitted();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to submit receipt.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h2 className="font-semibold text-neutral-900">Switch to {plan.name}</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-neutral-100 transition-colors">
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {done ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
                <Clock className="w-7 h-7 text-amber-500" />
              </div>
              <h3 className="font-semibold text-neutral-900">Receipt Submitted</h3>
              <p className="text-[13px] text-neutral-500 leading-relaxed">
                Your receipt has been submitted and will be verified within 24 hours.
              </p>
            </div>
          ) : (
            <>
              {/* Plan summary */}
              <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-neutral-800">{plan.name} Plan</span>
                  <span className="text-[14px] font-bold text-[#0E2C72]">
                    {price === 0 ? "Free" : `${fmt(price)} / quarter`}
                  </span>
                </div>
                {plan.features?.length > 0 && (
                  <ul className="space-y-1 text-[12px] text-neutral-600 pt-1">
                    {plan.features.slice(0, 4).map((f: string) => (
                      <li key={f} className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-[#1a3d8f] shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Payment details */}
              {paymentDetails?.bank_name && (
                <div className="space-y-2">
                  <p className="text-[12px] font-semibold text-neutral-500 uppercase tracking-wider">Make payment to</p>
                  <div className="bg-[#0E2C72]/4 rounded-xl border border-[#0E2C72]/10 p-4 text-[13px] space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Bank</span>
                      <span className="font-medium text-neutral-800">{paymentDetails.bank_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Account Name</span>
                      <span className="font-medium text-neutral-800">{paymentDetails.account_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Account Number</span>
                      <span className="font-mono font-bold text-neutral-900 text-[14px]">{paymentDetails.account_number}</span>
                    </div>
                  </div>
                  {paymentDetails.instructions && (
                    <p className="text-[12px] text-neutral-500 leading-relaxed">{paymentDetails.instructions}</p>
                  )}
                </div>
              )}

              {/* Receipt upload */}
              <div>
                <p className="text-[12px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">Upload Payment Receipt</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed text-[13px] font-medium transition-colors",
                    receipt
                      ? "border-[#0E2C72]/30 bg-[#0E2C72]/4 text-[#0E2C72]"
                      : "border-neutral-200 hover:border-neutral-300 text-neutral-500 hover:text-neutral-700"
                  )}
                >
                  <Upload className="w-4 h-4" />
                  {receipt ? receipt.name : "Click to upload receipt (image or PDF)"}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-100 flex gap-3">
          {done ? (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-[#0E2C72] hover:bg-[#0a2260] text-white rounded-lg text-[13px] font-semibold transition-colors"
            >
              Done
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg text-[13px] font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!receipt || submitting}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#0E2C72] hover:bg-[#0a2260] disabled:opacity-60 text-white rounded-lg text-[13px] font-semibold transition-colors"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {submitting ? "Submitting…" : "Submit Receipt"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── BillingSettings ────────────────────────────────────────────────────────────

export function BillingSettings() {
  usePageTitle("Billing");
  const [plans,          setPlans]         = useState<any[]>([]);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [usage,          setUsage]         = useState<any>(null);
  const [ws,             setWs]            = useState<any>(null);
  const [loading,        setLoading]       = useState(true);
  const [switchingPlan,  setSwitchingPlan] = useState<any | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [p, u, d] = await Promise.all([
        api.workspaces.billingPlans(),
        api.workspaces.billingUsage(),
        api.workspaces.detail(),
      ]);
      setPlans(Array.isArray(p?.plans) ? p.plans : []);
      setPaymentDetails(p?.payment_details ?? null);
      setUsage(u);
      setWs(d);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const id = setInterval(() => {
      Promise.all([api.workspaces.billingUsage(), api.workspaces.detail()])
        .then(([u, d]) => { setUsage(u); setWs(d); })
        .catch(() => {});
    }, 60_000);
    return () => clearInterval(id);
  }, [loadData]);

  const handleReceiptSubmitted = async () => {
    // Refresh workspace to get the new pending state
    try {
      const d = await api.workspaces.detail();
      setWs(d);
    } catch { /* ignore */ }
  };

  const currentPlan     = ws?.billing_plan ?? "FREE";
  const pendingPlan     = ws?.billing_pending_plan ?? "";
  const pendingAt       = ws?.billing_pending_at ? new Date(ws.billing_pending_at) : null;
  const isPending       = !!pendingPlan;
  const currentPlanName = plans.find((p) => p.key === currentPlan)?.name ?? currentPlan;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-7 h-7 animate-spin text-[#1a3d8f]" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-8">

      {/* Plan Switch Modal */}
      {switchingPlan && (
        <PlanSwitchModal
          plan={switchingPlan}
          paymentDetails={paymentDetails}
          onClose={() => setSwitchingPlan(null)}
          onSubmitted={handleReceiptSubmitted}
        />
      )}

      {/* ── Pending Verification Banner ──────────────────────────────────────── */}
      {isPending && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-semibold text-amber-800">Plan Switch Under Review</p>
            <p className="text-[12.5px] text-amber-700 mt-0.5 leading-relaxed">
              Your receipt has been submitted and will be verified within 24 hours.
              {pendingAt && ` Submitted on ${pendingAt.toLocaleDateString()}.`}
            </p>
          </div>
        </div>
      )}

      {/* ── Current Plan Banner ───────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="font-semibold text-neutral-900">Current Plan</h3>
            <p className="text-sm text-neutral-500 mt-0.5">
              Your workspace is on the <strong>{currentPlanName}</strong> plan
            </p>
          </div>
          <Badge className={PLAN_BADGE[currentPlanName] ?? "bg-neutral-100 text-neutral-600"}>
            {currentPlanName}
          </Badge>
        </div>
      </div>

      {/* ── Usage ─────────────────────────────────────────────────────────── */}
      {usage?.resources && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <h3 className="font-semibold text-neutral-900 mb-5">Usage</h3>
          <div className="space-y-4">
            {Object.entries(usage.resources).map(([key, val]: any) => {
              if (typeof val !== "object" || val === null) return null;
              const used  = val.used  ?? 0;
              const limit = val.limit ?? null;
              const isUnlimited = limit == null || limit >= 9999;
              const pct   = !isUnlimited && limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
              const label = key.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[13px] text-neutral-700 font-medium">{label}</span>
                    <span className="text-[12px] text-neutral-500">{used} / {isUnlimited ? "∞" : limit}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-[#1a3d8f]")}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Plan Selector ─────────────────────────────────────────────────── */}
      {plans.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="font-semibold text-neutral-900">Available Plans</h3>
            <span className="text-[11.5px] text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-full font-medium">
              Billed quarterly (every 3 months)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {plans.map((plan: any) => {
              const isCurrent = plan.key === currentPlan;
              const isTargetPending = plan.key === pendingPlan;
              const price = plan.price_quarterly ?? plan.price_monthly ?? 0;
              const limits = plan.limits ?? {};

              return (
                <div
                  key={plan.key}
                  className={cn(
                    "bg-white rounded-xl border p-5 flex flex-col gap-4 relative",
                    isCurrent ? "ring-2 ring-[#1a3d8f]/40 border-[#2a52a8]" : (PLAN_RING[plan.name] ?? "border-neutral-200"),
                    plan.recommended && !isCurrent && "border-[#4a6fc0]"
                  )}
                >
                  {plan.recommended && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-[#0E2C72] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                      <Star className="w-2.5 h-2.5" /> Most Popular
                    </div>
                  )}

                  {/* Plan name + badge */}
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-neutral-900 text-[15px]">{plan.name}</h4>
                    {isCurrent && <Badge className="bg-[#0E2C72]/6 text-[#0E2C72] text-[11px]">Current</Badge>}
                    {isTargetPending && !isCurrent && (
                      <Badge className="bg-amber-50 text-amber-700 text-[11px]">
                        <Clock className="w-2.5 h-2.5 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </div>

                  {/* Price */}
                  <div>
                    {plan.contact_sales ? (
                      <p className="text-[22px] font-bold text-neutral-900">Custom</p>
                    ) : price === 0 ? (
                      <p className="text-[22px] font-bold text-neutral-900">Free</p>
                    ) : (
                      <div>
                        <span className="text-[22px] font-bold text-neutral-900">{fmt(price)}</span>
                        <span className="text-[12px] text-neutral-400 ml-1">/ quarter</span>
                      </div>
                    )}
                    {plan.description && (
                      <p className="text-[12px] text-neutral-500 mt-1.5 leading-relaxed">{plan.description}</p>
                    )}
                  </div>

                  {/* Limits */}
                  <div className="space-y-1.5 text-[12.5px] text-neutral-600">
                    {limits.properties   != null && (
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span><strong>{limitLabel(limits.properties)}</strong> properties</span>
                      </div>
                    )}
                    {limits.customers    != null && (
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span><strong>{limitLabel(limits.customers)}</strong> customers</span>
                      </div>
                    )}
                    {limits.team_members != null && (
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span><strong>{limitLabel(limits.team_members)}</strong> team members</span>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  {plan.features?.length > 0 && (
                    <ul className="space-y-1.5 text-[12px] text-neutral-600">
                      {plan.features.map((f: string) => (
                        <li key={f} className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-[#1a3d8f] shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* CTA */}
                  {!isCurrent && (
                    plan.contact_sales ? (
                      <a
                        href="mailto:sales@terratrail.io"
                        className="mt-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[13px] font-semibold transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> Contact Sales
                      </a>
                    ) : isTargetPending ? (
                      <div className="mt-auto flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-[12.5px] text-amber-700">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        Receipt under review
                      </div>
                    ) : (
                      <button
                        onClick={() => setSwitchingPlan(plan)}
                        disabled={isPending}
                        className="mt-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#0E2C72] hover:bg-[#0a2260] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-[13px] font-semibold transition-colors"
                      >
                        Switch to this plan
                      </button>
                    )
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Payment Details ───────────────────────────────────────────────── */}
      {paymentDetails?.bank_name && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 bg-[#0E2C72]/6 rounded-lg flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-[#0E2C72]" />
            </div>
            <h3 className="font-semibold text-neutral-900">Payment Details</h3>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[13px]">
              <div>
                <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-0.5">Bank</p>
                <p className="font-medium text-neutral-800">{paymentDetails.bank_name}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-0.5">Account Name</p>
                <p className="font-medium text-neutral-800">{paymentDetails.account_name}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-0.5">Account Number</p>
                <p className="font-mono font-bold text-neutral-900 text-[14px]">{paymentDetails.account_number}</p>
              </div>
            </div>
            {paymentDetails.instructions && (
              <p className="text-[12.5px] text-neutral-500 bg-neutral-50 rounded-lg px-4 py-3 border border-neutral-100 leading-relaxed">
                {paymentDetails.instructions}
              </p>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
