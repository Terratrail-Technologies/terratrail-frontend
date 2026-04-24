import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { motion } from "motion/react";
import { api } from "../../services/api";
import s from "../styles/onboarding.module.css";

// ─── Icons ────────────────────────────────────────────────────────────────────

const CheckIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const StarIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const InfoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="13" r="1" fill="currentColor" stroke="none"/>
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(price: number, currency = "NGN") {
  if (!price) return "Free";
  return new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(price) + "/mo";
}

// ─── Fallback catalogue (shown when API is unavailable) ──────────────────────

const FALLBACK_PLANS = [
  {
    key: "FREE", name: "Free", price_monthly: 0, currency: "NGN", contact_sales: false,
    description: "Get started at no cost. One estate, two customers.", recommended: false,
    features: ["1 workspace", "1 estate", "2 customers", "Basic tracking"],
  },
  {
    key: "STARTER", name: "Starter", price_monthly: 50000, currency: "NGN", contact_sales: false,
    description: "For growing agencies managing multiple properties.", recommended: false,
    features: ["5 estates", "500 customers", "Commission tracking", "Audit logs"],
  },
  {
    key: "GROWTH", name: "Growth", price_monthly: 100000, currency: "NGN", contact_sales: false,
    description: "For established companies scaling across offices.", recommended: true,
    features: ["10 estates/workspace", "2,000 customers", "Priority support", "All Starter features"],
  },
  {
    key: "SCALE", name: "Scale", price_monthly: 200000, currency: "NGN", contact_sales: false,
    description: "For large operations with multiple regional offices.", recommended: false,
    features: ["30 estates/workspace", "5,000 customers", "All Growth features"],
  },
  {
    key: "ENTERPRISE", name: "Enterprise", price_monthly: null, currency: "NGN", contact_sales: true,
    description: "Custom SLA, integrations, and unlimited scale.", recommended: false,
    features: ["Unlimited everything", "Dedicated account manager", "Custom SLA"],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

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
      .then((data) => setPlans(Array.isArray(data) ? data : FALLBACK_PLANS))
      .catch(() => setPlans(FALLBACK_PLANS))
      .finally(() => setLoading(false));
  }, []);

  const displayPlans = plans.length ? plans : FALLBACK_PLANS;

  const handleSelect = async (key: string) => {
    if (key === "ENTERPRISE") {
      toast.info("Contact our sales team for Enterprise pricing.");
      return;
    }
    setSelected(key);
  };

  const handleContinue = async () => {
    setSubmitting(true);
    try {
      if (selected !== "FREE") {
        await api.workspaces.selectPlan({ plan: selected });
        toast.success(`${selected.charAt(0) + selected.slice(1).toLowerCase()} plan selected!`);
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
      {/* Header */}
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
            Yearly
            <span className={s.discountBadge}>
              Save 17%
            </span>
          </button>
        </div>
      </motion.div>

      {/* Plan cards – horizontal scroll */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "24px 0", color: "#94a3b8", fontSize: 13 }}>
          <span className={s.spinner} style={{ display: "inline-block", borderTopColor: "#1c2268", borderColor: "#e2e8f0", width: 20, height: 20 }} />
        </div>
      ) : (
        <motion.div
          className={s.planScrollArea}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.22 }}
        >
          <div className={s.planRow}>
            {displayPlans.map((plan, i) => {
              const price = billing === "yearly" ? plan.price_yearly : plan.price_monthly;
              const isActive = selected === plan.key;
              const isEnterprise = plan.key === "ENTERPRISE";

              return (
                <motion.div
                  key={plan.key}
                  className={[
                    s.planCard,
                    isActive ? s.planCardActive : "",
                    isEnterprise ? s.enterpriseCard : "",
                  ].join(" ")}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.2 }}
                  onClick={() => handleSelect(plan.key)}
                >
                  {plan.recommended && (
                    <span className={s.planBadge} style={{ display: "flex", alignItems: "center", gap: 4, width: "fit-content" }}>
                      <StarIcon /> Popular
                    </span>
                  )}

                  {isActive && !isEnterprise && (
                    <div className={s.planCheck}><CheckIcon /></div>
                  )}

                  <span className={s.planName}>{plan.name}</span>

                  <span className={[s.planPrice, price === 0 ? s.planFree : ""].join(" ")}>
                    {plan.contact_sales ? "Contact sales" : formatPrice(price ?? 0, plan.currency)}
                  </span>

                  <span className={s.planDesc}>{plan.description}</span>

                  {plan.features?.slice(0, 4).length > 0 && (
                    <div className={s.planFeatureList}>
                      {plan.features.slice(0, 4).map((f: string, fi: number) => (
                        <span key={fi} className={s.planFeature}>
                          <span className={s.planFeatureDot} />
                          {f}
                        </span>
                      ))}
                    </div>
                  )}

                  {isEnterprise && (
                    <button className={s.planContactBtn} onClick={(e) => { e.stopPropagation(); toast.info("Contact: hello@terratrail.app"); }}>
                      Contact Sales
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
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
            <InfoIcon />
            <span>
              After selecting <strong>{selectedPlan.name}</strong>, our team will reach out with payment details to activate your plan.
            </span>
          </div>
        )}

        <button
          type="button"
          className={s.btn}
          disabled={submitting}
          onClick={handleContinue}
        >
          <span className={s.btnInner}>
            {submitting && <span className={s.spinner} />}
            {submitting
              ? "Setting up…"
              : selected === "FREE"
              ? "Continue with Free →"
              : `Continue with ${selectedPlan?.name ?? selected} →`}
          </span>
        </button>

        <button
          type="button"
          className={s.btnSecondary}
          onClick={() => navigate("/")}
        >
          Skip — decide later
        </button>
      </motion.div>
    </>
  );
}
