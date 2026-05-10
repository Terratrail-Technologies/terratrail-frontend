import { Outlet, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import s from "../styles/onboarding.module.css";

const Logo = () => (
  <div className={s.logoWrap}>
    <div className={s.logoIcon}>
      <img src="/logo.png" alt="TerraTrail" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 7 }}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
          (e.currentTarget.parentElement as HTMLElement).innerHTML =
            '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 5h12M9 5v8" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>';
        }}
      />
    </div>
    <span className={s.logoText}>TerraTrail</span>
  </div>
);

const pageVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -10 },
};

export function OnboardingLayout() {
  const location = useLocation();

  return (
    <div className={s.page}>
      {/* Dark architectural background */}
      <div className={s.bg} aria-hidden="true" />

      {/* Scroll area containing card */}
      <div className={s.scrollArea}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            className={[s.card, location.pathname === "/auth/select-plan" ? s.cardWide : ""].join(" ")}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            <Logo />
            <Outlet />
          </motion.div>
        </AnimatePresence>

        {/* Marketing copy – below card, on dark bg */}
        <motion.div
          className={s.marketing}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          {/* <p className={s.marketingHeading}>Master Your Cash Flow.</p>
          <p className={s.marketingBody}>
            Automate installment subscriptions and monitor revenue growth
            with precision. Never lose track of a payment plan again.
          </p> */}
        </motion.div>
      </div>
    </div>
  );
}
