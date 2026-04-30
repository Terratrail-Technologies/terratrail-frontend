import { useState, useEffect } from "react";
import { Check, Loader2, Star, Building2, Users, UserCheck, MessageCircle, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../services/api";
import { Badge } from "../../../components/ui/badge";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { cn } from "../../../components/ui/utils";

const fmt = (n: number) => `₦${n.toLocaleString("en-NG")}`;

const PLAN_RING: Record<string, string> = {
  Free:       "border-neutral-200",
  Starter:    "border-blue-300",
  Growth:     "border-emerald-400",
  Scale:      "border-violet-400",
  Enterprise: "border-amber-400",
};

const PLAN_BADGE: Record<string, string> = {
  Free:       "bg-neutral-100 text-neutral-600",
  Starter:    "bg-blue-50 text-blue-700",
  Growth:     "bg-emerald-50 text-emerald-700",
  Scale:      "bg-violet-50 text-violet-700",
  Enterprise: "bg-amber-50 text-amber-700",
};

function limitLabel(val: number | null): string {
  return val == null ? "Unlimited" : val.toLocaleString();
}

export function BillingSettings() {
  usePageTitle("Billing");
  const [plans,          setPlans]         = useState<any[]>([]);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [usage,          setUsage]         = useState<any>(null);
  const [ws,             setWs]            = useState<any>(null);
  const [loading,        setLoading]       = useState(true);
  const [selecting,      setSelecting]     = useState<string | null>(null);
  const [billing,        setBilling]       = useState<"monthly" | "yearly">("monthly");

  useEffect(() => {
    Promise.all([
      api.workspaces.billingPlans(),
      api.workspaces.billingUsage(),
      api.workspaces.detail(),
    ])
      .then(([p, u, d]) => {
        setPlans(Array.isArray(p?.plans) ? p.plans : []);
        setPaymentDetails(p?.payment_details ?? null);
        setUsage(u);
        setWs(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = async (planKey: string) => {
    setSelecting(planKey);
    try {
      await api.workspaces.selectPlan({ plan: planKey });
      const updated = await api.workspaces.detail();
      setWs(updated);
      const plan = plans.find((p) => p.key === planKey);
      toast.success(`Switched to ${plan?.name ?? planKey} plan.`);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to change plan.");
    } finally {
      setSelecting(null);
    }
  };

  const currentPlan  = ws?.billing_plan ?? "FREE";
  const currentPlanName = plans.find((p) => p.key === currentPlan)?.name ?? currentPlan;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-7 h-7 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-8">

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
      {usage && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <h3 className="font-semibold text-neutral-900 mb-5">Usage</h3>
          <div className="space-y-4">
            {Object.entries(usage).map(([key, val]: any) => {
              if (typeof val !== "object" || val === null) return null;
              const used  = val.used  ?? 0;
              const limit = val.limit ?? 0;
              const pct   = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
              const label = key.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[13px] text-neutral-700 font-medium">{label}</span>
                    <span className="text-[12px] text-neutral-500">{used} / {limit === 9999 ? "∞" : limit}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500")}
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
            {/* Billing cycle toggle */}
            <div className="flex items-center gap-1 bg-neutral-100 rounded-xl p-1 text-[12px] font-semibold">
              <button
                onClick={() => setBilling("monthly")}
                className={cn("px-3 py-1.5 rounded-lg transition-colors",
                  billing === "monthly" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700")}
              >Monthly</button>
              <button
                onClick={() => setBilling("yearly")}
                className={cn("px-3 py-1.5 rounded-lg transition-colors",
                  billing === "yearly" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700")}
              >
                Yearly
                <span className="ml-1.5 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">Save 17%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {plans.map((plan: any) => {
              const isCurrent = plan.key === currentPlan;
              const price = billing === "yearly" ? plan.price_yearly : plan.price_monthly;
              const limits = plan.limits ?? {};

              return (
                <div
                  key={plan.key}
                  className={cn(
                    "bg-white rounded-xl border p-5 flex flex-col gap-4 relative",
                    isCurrent ? "ring-2 ring-emerald-500/40 border-emerald-400" : (PLAN_RING[plan.name] ?? "border-neutral-200"),
                    plan.recommended && !isCurrent && "border-emerald-300"
                  )}
                >
                  {plan.recommended && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                      <Star className="w-2.5 h-2.5" /> Most Popular
                    </div>
                  )}

                  {/* Plan name + current badge */}
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-neutral-900 text-[15px]">{plan.name}</h4>
                    {isCurrent && <Badge className="bg-emerald-50 text-emerald-700 text-[11px]">Current</Badge>}
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
                        <span className="text-[12px] text-neutral-400 ml-1">/ {billing === "yearly" ? "year" : "month"}</span>
                        {billing === "yearly" && plan.price_monthly > 0 && (
                          <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
                            Save {fmt((plan.price_monthly * 12) - plan.price_yearly)} vs monthly
                          </p>
                        )}
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
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
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
                    ) : (
                      <button
                        onClick={() => handleSelect(plan.key)}
                        disabled={!!selecting}
                        className="mt-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-lg text-[13px] font-semibold transition-colors"
                      >
                        {selecting === plan.key && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        {selecting === plan.key ? "Switching…" : "Switch to this plan"}
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
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-emerald-600" />
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
