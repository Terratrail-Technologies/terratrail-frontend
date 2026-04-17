import { useState, useEffect } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../services/api";
import { Badge } from "../../../components/ui/badge";

const PLAN_COLORS: Record<string, string> = {
  FREE:       "bg-neutral-100 text-neutral-600",
  STARTER:    "bg-blue-50 text-blue-700",
  GROWTH:     "bg-emerald-50 text-emerald-700",
  SCALE:      "bg-violet-50 text-violet-700",
  ENTERPRISE: "bg-amber-50 text-amber-700",
};

export function BillingSettings() {
  const [plans,   setPlans]   = useState<any[]>([]);
  const [usage,   setUsage]   = useState<any>(null);
  const [ws,      setWs]      = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.workspaces.billingPlans(),
      api.workspaces.billingUsage(),
      api.workspaces.detail(),
    ])
      .then(([p, u, d]) => { setPlans(Array.isArray(p) ? p : []); setUsage(u); setWs(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = async (plan: string) => {
    setSelecting(plan);
    try {
      await api.workspaces.selectPlan({ plan });
      const updated = await api.workspaces.detail();
      setWs(updated);
      toast.success(`Switched to ${plan} plan.`);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to change plan.");
    } finally {
      setSelecting(null);
    }
  };

  const currentPlan = ws?.billing_plan ?? "FREE";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-7 h-7 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-8">
      {/* Current Plan */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-neutral-900">Current Plan</h3>
            <p className="text-sm text-neutral-500 mt-0.5">Your workspace is on the <strong>{currentPlan}</strong> plan</p>
          </div>
          <Badge className={PLAN_COLORS[currentPlan] ?? "bg-neutral-100 text-neutral-600"}>
            {currentPlan}
          </Badge>
        </div>
      </div>

      {/* Usage */}
      {usage && (
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <h3 className="font-medium text-neutral-900 mb-5">Usage</h3>
          <div className="space-y-4">
            {Object.entries(usage).map(([key, val]: any) => {
              if (typeof val !== "object" || val === null) return null;
              const used  = val.used  ?? 0;
              const limit = val.limit ?? 0;
              const pct   = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
              const label = key.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-neutral-700">{label}</span>
                    <span className="text-xs text-neutral-500">{used} / {limit === 9999 ? "∞" : limit}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Plans */}
      {plans.length > 0 && (
        <div>
          <h3 className="font-medium text-neutral-900 mb-4">Available Plans</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {plans.map((plan: any) => {
              const isCurrent = plan.name === currentPlan;
              return (
                <div
                  key={plan.name}
                  className={`bg-white rounded-xl border p-5 flex flex-col gap-4 ${isCurrent ? "border-emerald-400 ring-1 ring-emerald-400/30" : "border-neutral-200"}`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-neutral-900">{plan.name}</h4>
                    {isCurrent && <Badge className="bg-emerald-50 text-emerald-700 text-[11px]">Current</Badge>}
                  </div>

                  {plan.description && (
                    <p className="text-xs text-neutral-500 leading-relaxed">{plan.description}</p>
                  )}

                  <ul className="text-xs text-neutral-600 space-y-1.5">
                    {plan.max_properties  != null && <li className="flex gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-px" />{plan.max_properties === 9999 ? "Unlimited" : plan.max_properties} properties</li>}
                    {plan.max_customers   != null && <li className="flex gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-px" />{plan.max_customers  === 9999 ? "Unlimited" : plan.max_customers} customers</li>}
                    {plan.max_sales_reps  != null && <li className="flex gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-px" />{plan.max_sales_reps === 9999 ? "Unlimited" : plan.max_sales_reps} sales reps</li>}
                  </ul>

                  {!isCurrent && (
                    <button
                      onClick={() => handleSelect(plan.name)}
                      disabled={!!selecting}
                      className="mt-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-60 transition-colors text-sm font-medium"
                    >
                      {selecting === plan.name ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      {selecting === plan.name ? "Switching…" : "Switch to this plan"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
