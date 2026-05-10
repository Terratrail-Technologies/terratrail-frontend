import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { motion } from "motion/react";
import { Check, Star, Building2, Users, Loader2, MessageCircle } from "lucide-react";
import { api } from "../../services/api";
import s from "../styles/onboarding.module.css";

function limitLabel(val: number | null | undefined): string {
  return val == null || val >= 9999 ? "Unlimited" : val.toLocaleString();
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

const FALLBACK_PLANS = [
  {
    key: "FREE", name: "Free", price_monthly: 0, price_yearly: 0, currency: "NGN",
    contact_sales: false, description: "Get started at no cost.", recommended: false,
    features: ["1 property", "2 customers", "Basic tracking"],
    limits: { properties: 1, customers: 2, team_members: 1 },
  },
  {
    key: "STARTER", name: "Starter", price_monthly: 50000, price_yearly: 500000, currency: "NGN",
    contact_sales: false, description: "For growing agencies.", recommended: false,
    features: ["Commission tracking", "Audit logs", "Custom subdomain"],
    limits: { properties: 5, customers: 500, team_members: null },
  },
  {
    key: "GROWTH", name: "Growth", price_monthly: 100000, price_yearly: 1000000, currency: "NGN",
    contact_sales: false, description: "Best value for growing teams.", recommended: true,
    features: ["Priority support", "Advanced reports", "All Starter features"],
    limits: { properties: 10, customers: 2000, team_members: null },
  },
  {
    key: "SCALE", name: "Scale", price_monthly: 200000, price_yearly: 2000000, currency: "NGN",
    contact_sales: false, description: "For large operations.", recommended: false,
    features: ["All Growth features", "Dedicated onboarding"],
    limits: { properties: 30, customers: 5000, team_members: null },
  },
  {
    key: "ENTERPRISE", name: "Enterprise", price_monthly: 0, price_yearly: 0, currency: "NGN",
    contact_sales: true, description: "Custom SLA and unlimited scale.", recommended: false,
    features: ["Unlimited everything", "Dedicated account manager", "Custom SLA"],
    limits: { properties: null, customers: null, team_members: null },
  },
];

export function SelectPlan() {
  const navigate = useNavigate();
  const [plans, setPlans]           = useState<any[]>([]);
  const [selected, setSelected]     = useState("FREE");
  const [loading, setLoading]       = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [billing, setBilling]       = useState<"monthly" | "yearly">("monthly");

  useEffect(() => {
    setLoading(true);
    api.workspaces.billingPlans()
      .then((data: any) => setPlans(Array.isArray(data?.plans) ? data.plans : FALLBACK_PLANS))
      .catch(() => setPlans(FALLBACK_PLANS))
      .finally(() => setLoading(false));
  }, []);

  const displayPlans = plans.length ? plans : FALLBACK_PLANS;

  const handleContinue = async () => {
    setSubmitting(true);
    try {
      if (selected !== "FREE") {
        await api.workspaces.selectPlan({ plan: selected });
        const planName = displayPlans.find((p) => p.key === selected)?.name ?? selected;
        toast.success(`${planName} plan selected!`);
      }
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Could not apply plan. Continuing with Free.");
      navigate("/");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPlan = displayPlans.find((p) => p.key === selected);

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
        <h1 className={s.heading}>Choose your plan</h1>
        <p className={s.subtext}>Start free and upgrade as you grow. No credit card required.</p>

        {/* Billing toggle */}
        <div className={s.billingToggle}>
          <button
            type="button"
            onClick={() => setBilling("monthly")}
            className={[s.billingBtn, billing === "monthly" ? s.billingBtnActive : ""].join(" ")}
          >Monthly</button>
          <button
            type="button"
            onClick={() => setBilling("yearly")}
            className={[s.billingBtn, billing === "yearly" ? s.billingBtnActive : ""].join(" ")}
          >
            Yearly <span className={s.discountBadge}>Save 17%</span>
          </button>
        </div>
      </motion.div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <Loader2 style={{ width: 20, height: 20, color: "#94a3b8", display: "inline-block", animation: "spin 0.65s linear infinite" }} />
        </div>
      ) : (
        <motion.div
          className={s.planGrid}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.22 }}
        >
          {displayPlans.map((plan, i) => {
            const price = billing === "yearly" ? plan.price_yearly : plan.price_monthly;
            const isSelected = selected === plan.key;
            const isEnterprise = plan.key === "ENTERPRISE";
            const limits = plan.limits ?? {};

            return (
              <motion.div
                key={plan.key}
                className={[
                  s.planCardNew,
                  isSelected ? s.planCardNewActive : "",
                  isEnterprise ? s.planCardEnterprise : "",
                ].join(" ")}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.2 }}
                onClick={() => !isEnterprise && setSelected(plan.key)}
              >
                {plan.recommended && (
                  <span className={s.planBadge} style={{ display: "flex", alignItems: "center", gap: 4, width: "fit-content", marginBottom: 6 }}>
                    <Star width={9} height={9} fill="#fff" stroke="none" /> Popular
                  </span>
                )}
                {isSelected && !isEnterprise && (
                  <div className={s.planCheck}>
                    <Check width={10} height={10} stroke="#fff" strokeWidth={3.5} />
                  </div>
                )}

                <span className={s.planName} style={{ color: isEnterprise ? "#fff" : "#0f172a" }}>
                  {plan.name}
                </span>

                <span
                  className={s.planPrice}
                  style={{ color: isEnterprise ? "#93c5fd" : price === 0 ? "#16a34a" : "#1c2268" }}
                >
                  {plan.contact_sales ? "Contact sales" : price === 0 ? "Free" : `${fmt(price)}/mo`}
                </span>

                {billing === "yearly" && plan.price_monthly > 0 && !plan.contact_sales && (
                  <span style={{ fontSize: 10, color: isEnterprise ? "rgba(255,255,255,0.6)" : "#16a34a", marginBottom: 4, display: "block" }}>
                    Save {fmt((plan.price_monthly * 12) - plan.price_yearly)} vs monthly
                  </span>
                )}

                <span className={s.planDesc} style={{ color: isEnterprise ? "rgba(255,255,255,0.6)" : "#64748b" }}>
                  {plan.description}
                </span>

                {/* Resource limits */}
                {(limits.properties != null || limits.customers != null) && (
                  <div className={s.planLimits}>
                    {limits.properties != null && (
                      <span className={s.planLimitRow} style={{ color: isEnterprise ? "rgba(255,255,255,0.75)" : "#374151" }}>
                        <Building2 width={10} height={10} style={{ flexShrink: 0 }} />
                        {limitLabel(limits.properties)} properties
                      </span>
                    )}
                    {limits.customers != null && (
                      <span className={s.planLimitRow} style={{ color: isEnterprise ? "rgba(255,255,255,0.75)" : "#374151" }}>
                        <Users width={10} height={10} style={{ flexShrink: 0 }} />
                        {limitLabel(limits.customers)} customers
                      </span>
                    )}
                  </div>
                )}

                {/* Features */}
                {plan.features?.slice(0, 3).length > 0 && (
                  <div className={s.planFeatureList}>
                    {plan.features.slice(0, 3).map((f: string, fi: number) => (
                      <span key={fi} className={s.planFeature} style={{ color: isEnterprise ? "rgba(255,255,255,0.7)" : "#475569" }}>
                        <span className={s.planFeatureDot} style={{ background: isEnterprise ? "#60a5fa" : "#1c2268" }} />
                        {f}
                      </span>
                    ))}
                  </div>
                )}

                {isEnterprise && (
                  <button
                    className={s.planContactBtn}
                    onClick={(e) => { e.stopPropagation(); toast.info("Contact: hello@terratrail.app"); }}
                  >
                    <MessageCircle width={10} height={10} style={{ display: "inline", marginRight: 4 }} />
                    Contact Sales
                  </button>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Info + CTA */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.22 }}
        className={s.form}
        style={{ marginTop: 16 }}
      >
        {selectedPlan && selectedPlan.key !== "FREE" && (
          <div className={s.infoBox}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="13" r="1" fill="currentColor" stroke="none"/>
            </svg>
            <span>
              After selecting <strong>{selectedPlan.name}</strong>, our team will reach out with payment details to activate your plan.
            </span>
          </div>
        )}

        <button type="button" className={s.btn} disabled={submitting} onClick={handleContinue}>
          <span className={s.btnInner}>
            {submitting && <span className={s.spinner} />}
            {submitting
              ? "Setting up…"
              : selected === "FREE"
              ? "Continue with Free →"
              : `Continue with ${selectedPlan?.name ?? selected} →`}
          </span>
        </button>

        <button type="button" className={s.btnSecondary} onClick={() => navigate("/")}>
          Skip — decide later
        </button>
      </motion.div>
    </>
  );
}
