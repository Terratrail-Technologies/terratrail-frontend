import { useRef, useState } from "react";
import { Link } from "react-router";
import {
  Building2, ArrowRight, CheckCircle2, Star, Shield,
  Users, BarChart3, Zap, Globe, ChevronDown, Menu, X,
  MapPin, CreditCard, Bell, FileText, UserCheck,
} from "lucide-react";
import {
  motion, AnimatePresence, useScroll, useTransform, useInView,
} from "motion/react";

// ── Motion helpers ────────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 22 } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}>
      {children}
    </motion.div>
  );
}

// ── Navbar ─────────────────────────────────────────────────────────────────────
function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const ref = useRef<boolean>(false);

  if (!ref.current) {
    ref.current = true;
    if (typeof window !== "undefined") {
      const handler = () => setScrolled(window.scrollY > 20);
      window.addEventListener("scroll", handler, { passive: true });
    }
  }

  const links = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how" },
    { label: "Pricing", href: "#pricing" },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-lg shadow-sm border-b border-neutral-100" : "bg-transparent"}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#1a3d8f] to-[#0a2260] shadow-md shadow-[#1a3d8f]/30">
            <Building2 className="size-4 text-white" />
          </div>
          <span className={`text-[16px] font-extrabold tracking-tight transition-colors ${scrolled ? "text-neutral-900" : "text-white"}`}>
            Terratrail
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {links.map(({ label, href }) => (
            <a key={label} href={href}
              className={`text-[13.5px] font-medium transition-colors ${scrolled ? "text-neutral-600 hover:text-[#0E2C72]" : "text-white/80 hover:text-white"}`}>
              {label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/auth/sign-in"
            className={`text-[13px] font-semibold transition-colors ${scrolled ? "text-neutral-700 hover:text-[#0E2C72]" : "text-white/90 hover:text-white"}`}>
            Sign In
          </Link>
          <Link to="/auth/sign-up"
            className="px-4 py-2 bg-[#0E2C72] hover:bg-[#0a2260] text-white text-[13px] font-bold rounded-xl transition-colors shadow-sm">
            Get Started Free
          </Link>
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setOpen(o => !o)}
          className={`md:hidden p-2 rounded-lg transition-colors ${scrolled ? "text-neutral-700 hover:bg-neutral-100" : "text-white hover:bg-white/10"}`}>
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-neutral-100 overflow-hidden">
            <div className="px-4 py-4 space-y-1">
              {links.map(({ label, href }) => (
                <a key={label} href={href} onClick={() => setOpen(false)}
                  className="block px-3 py-2.5 text-[13.5px] font-medium text-neutral-700 hover:bg-neutral-50 hover:text-[#0E2C72] rounded-lg transition-colors">
                  {label}
                </a>
              ))}
              <div className="pt-3 flex flex-col gap-2 border-t border-neutral-100">
                <Link to="/auth/sign-in" className="px-3 py-2.5 text-[13.5px] font-semibold text-neutral-700 hover:bg-neutral-50 rounded-lg text-center transition-colors">Sign In</Link>
                <Link to="/auth/sign-up" className="px-3 py-2.5 bg-[#0E2C72] hover:bg-[#0a2260] text-white text-[13.5px] font-bold rounded-xl text-center transition-colors">Get Started Free</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={containerRef} className="relative min-h-screen flex items-center overflow-hidden bg-[#05231a]">
      {/* Animated bg */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, rgba(16,185,129,0.15) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(6,78,59,0.3) 0%, transparent 50%)" }} />
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <motion.div style={{ y }} className="absolute inset-0">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="absolute top-20 right-[15%] w-64 h-64 border border-[#0E2C72]/10 rounded-full" />
          <motion.div animate={{ rotate: -360 }} transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
            className="absolute top-40 right-[15%] w-40 h-40 border border-[#2a52a8]/10 rounded-full" />
          <motion.div animate={{ y: [0, -20, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[20%] right-[12%] w-16 h-16 bg-[#1a3d8f]/20 rounded-2xl rotate-12 blur-sm" />
          <motion.div animate={{ y: [0, 15, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-[30%] left-[8%] w-12 h-12 bg-teal-400/20 rounded-xl rotate-45 blur-sm" />
        </motion.div>
      </div>

      <motion.div style={{ opacity }} className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-20 w-full">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0E2C72]/10 border border-[#0E2C72]/20 text-[#6b8fd4] text-[12px] font-bold tracking-wide mb-6">
            <Zap className="size-3" fill="currentColor" />
            The #1 Real Estate Management Platform in Nigeria
          </motion.div>

          {/* Headline */}
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
            className="text-[44px] sm:text-[60px] lg:text-[72px] font-black text-white leading-[1.05] tracking-tight mb-6">
            Manage Your
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2a52a8] via-teal-300 to-[#6b8fd4]">
              Real Estate Empire
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[16px] sm:text-[18px] text-white/60 leading-relaxed mb-10 max-w-xl mx-auto">
            Terratrail gives real estate companies a complete platform — property listings, customer management, payment tracking, and team collaboration in one place.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/auth/sign-up"
              className="flex items-center gap-2 px-7 py-3.5 bg-[#1a3d8f] hover:bg-[#2a52a8] active:scale-[0.98] text-white text-[15px] font-bold rounded-2xl transition-all shadow-lg shadow-[#1a3d8f]/30">
              Start for Free
              <ArrowRight className="size-4" />
            </Link>
            <Link to="/auth/sign-in"
              className="flex items-center gap-2 px-7 py-3.5 bg-white/8 hover:bg-white/12 border border-white/10 text-white text-[15px] font-semibold rounded-2xl transition-all backdrop-blur-sm">
              Sign In
            </Link>
          </motion.div>

          {/* Trust badges */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="flex items-center justify-center gap-6 mt-12 flex-wrap">
            {[
              { icon: Shield, label: "Bank-level security" },
              { icon: Star, label: "Loved by 100+ companies" },
              { icon: Zap, label: "Setup in minutes" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-white/40 text-[12px] font-medium">
                <Icon className="size-3.5 text-[#6b8fd4]" />
                {label}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll cue */}
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/30">
          <ChevronDown className="size-5" />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ── Features ──────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Building2, color: "bg-[#d6e0f5] text-[#0E2C72]",
    title: "Property Management",
    desc: "List, publish, and manage all your properties with rich details — images, documents, pricing plans, and amenities.",
  },
  {
    icon: Users, color: "bg-blue-100 text-blue-700",
    title: "Customer CRM",
    desc: "Track every customer subscription, installment schedule, payment history, and outstanding balance in one view.",
  },
  {
    icon: CreditCard, color: "bg-violet-100 text-violet-700",
    title: "Payment Tracking",
    desc: "Record, approve, and track payments. Auto-generate installment schedules with flexible payment spread methods.",
  },
  {
    icon: UserCheck, color: "bg-amber-100 text-amber-700",
    title: "Sales Rep Commissions",
    desc: "Manage your sales team, assign commission tiers, and automatically calculate earnings per transaction.",
  },
  {
    icon: MapPin, color: "bg-rose-100 text-rose-700",
    title: "Site Inspections",
    desc: "Schedule and track site inspection requests from prospective buyers with configurable meeting points and slots.",
  },
  {
    icon: Globe, color: "bg-teal-100 text-teal-700",
    title: "Public Estate Pages",
    desc: "Each workspace gets a branded public listing page so buyers can browse and request inspections directly.",
  },
  {
    icon: Bell, color: "bg-orange-100 text-orange-700",
    title: "Smart Notifications",
    desc: "Get instant alerts for new inspection requests, new customers, and pending payments — nothing slips through.",
  },
  {
    icon: BarChart3, color: "bg-indigo-100 text-indigo-700",
    title: "Analytics Dashboard",
    desc: "Track revenue, commissions, subscription counts, and leaderboard rankings with date-range filtering.",
  },
  {
    icon: FileText, color: "bg-cyan-100 text-cyan-700",
    title: "Document Management",
    desc: "Attach C of O, Survey Plans, Deeds of Assignment, and more to each property with status tracking.",
  },
];

function Features() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <Reveal className="text-center mb-16">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#0E2C72] mb-3 block">Everything You Need</span>
          <h2 className="text-[36px] sm:text-[44px] font-black text-neutral-900 leading-tight tracking-tight mb-4">
            Built for Real Estate<br />Professionals
          </h2>
          <p className="text-[15px] text-neutral-500 max-w-lg mx-auto leading-relaxed">
            From your first property listing to managing hundreds of active subscriptions — Terratrail scales with you.
          </p>
        </Reveal>

        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, color, title, desc }) => (
            <motion.div key={title} variants={fadeUp}
              className="group p-6 rounded-2xl border border-neutral-100 hover:border-[#8aaad8] hover:shadow-lg hover:shadow-[#eef2fb] transition-all duration-300 bg-white relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#1a3d8f] to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                <Icon className="size-5" />
              </div>
              <h3 className="font-bold text-neutral-900 text-[15px] mb-2">{title}</h3>
              <p className="text-[13px] text-neutral-500 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ── How It Works ──────────────────────────────────────────────────────────────
const STEPS = [
  { n: "01", title: "Create your workspace", desc: "Sign up and set up your real estate company workspace in under 2 minutes. Choose your plan and configure your settings." },
  { n: "02", title: "Add your properties", desc: "Create detailed property listings with images, pricing plans, amenities, documents, and location data." },
  { n: "03", title: "Onboard customers", desc: "Add customers, create subscriptions, and auto-generate installment schedules based on their chosen payment plan." },
  { n: "04", title: "Track & grow", desc: "Monitor payments, commissions, inspection requests, and analytics — all from your dashboard." },
];

function HowItWorks() {
  return (
    <section id="how" className="py-24 bg-neutral-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <Reveal className="text-center mb-16">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#0E2C72] mb-3 block">Simple to Start</span>
          <h2 className="text-[36px] sm:text-[44px] font-black text-neutral-900 leading-tight tracking-tight mb-4">
            Up and Running in Minutes
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {STEPS.map(({ n, title, desc }, i) => (
            <Reveal key={n} delay={i * 0.1}>
              <div className="bg-white rounded-2xl p-6 border border-neutral-100 hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-4 right-4 text-[48px] font-black text-neutral-50 select-none leading-none">{n}</div>
                <div className="w-8 h-8 rounded-xl bg-[#0E2C72] flex items-center justify-center mb-4">
                  <span className="text-white text-[12px] font-black">{n}</span>
                </div>
                <h3 className="font-bold text-neutral-900 text-[16px] mb-2">{title}</h3>
                <p className="text-[13px] text-neutral-500 leading-relaxed">{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Stats ─────────────────────────────────────────────────────────────────────
function Stats() {
  const stats = [
    { value: "100+", label: "Real estate companies" },
    { value: "₦2B+", label: "Tracked in payments" },
    { value: "10k+", label: "Customer subscriptions" },
    { value: "99.9%", label: "Uptime guarantee" },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-[#064e3b] to-[#065f46]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map(({ value, label }) => (
            <motion.div key={label} variants={fadeUp}>
              <p className="text-[36px] sm:text-[42px] font-black text-white mb-1">{value}</p>
              <p className="text-[12px] text-[#6b8fd4] font-semibold uppercase tracking-wide">{label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ── Pricing ───────────────────────────────────────────────────────────────────
const PLANS = [
  {
    name: "Free", price: "₦0", period: "/month",
    desc: "Perfect for getting started",
    features: ["1 workspace", "Up to 2 properties", "Basic customer management", "Public estate page", "Email support"],
    cta: "Start Free", highlight: false,
  },
  {
    name: "Starter", price: "₦15,000", period: "/month",
    desc: "For growing real estate agencies",
    features: ["1 workspace", "Up to 10 properties", "Unlimited customers", "Sales rep commissions", "Site inspection management", "Priority support"],
    cta: "Get Started", highlight: true,
  },
  {
    name: "Growth", price: "₦35,000", period: "/month",
    desc: "For established companies",
    features: ["Unlimited properties", "Unlimited customers", "Advanced analytics", "Multiple admin users", "Data export (CSV/PDF)", "Dedicated support"],
    cta: "Get Growth", highlight: false,
  },
];

function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <Reveal className="text-center mb-16">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#0E2C72] mb-3 block">Simple Pricing</span>
          <h2 className="text-[36px] sm:text-[44px] font-black text-neutral-900 leading-tight tracking-tight mb-4">
            Plans That Grow With You
          </h2>
          <p className="text-[15px] text-neutral-500 max-w-md mx-auto">Start free, upgrade as you scale. No hidden fees.</p>
        </Reveal>

        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map(({ name, price, period, desc, features, cta, highlight }) => (
            <motion.div key={name} variants={fadeUp}
              className={`relative rounded-2xl p-7 border ${highlight ? "border-[#0E2C72] shadow-xl shadow-[#0E2C72]/10 bg-gradient-to-b from-[#0E2C72] to-[#0a2260]" : "border-neutral-100 bg-white hover:shadow-md"} transition-all`}>
              {highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-amber-400 text-neutral-900 text-[10px] font-black uppercase tracking-wide rounded-full">
                  Most Popular
                </div>
              )}
              <div className="mb-5">
                <h3 className={`font-bold text-[17px] mb-0.5 ${highlight ? "text-white" : "text-neutral-900"}`}>{name}</h3>
                <p className={`text-[12px] mb-4 ${highlight ? "text-[#8aaad8]" : "text-neutral-500"}`}>{desc}</p>
                <div className="flex items-baseline gap-1">
                  <span className={`text-[36px] font-black ${highlight ? "text-white" : "text-neutral-900"}`}>{price}</span>
                  <span className={`text-[13px] ${highlight ? "text-[#6b8fd4]" : "text-neutral-400"}`}>{period}</span>
                </div>
              </div>
              <ul className="space-y-2.5 mb-7">
                {features.map((f) => (
                  <li key={f} className={`flex items-start gap-2 text-[13px] ${highlight ? "text-[#d6e0f5]" : "text-neutral-600"}`}>
                    <CheckCircle2 className={`size-4 shrink-0 mt-0.5 ${highlight ? "text-[#6b8fd4]" : "text-[#1a3d8f]"}`} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/auth/sign-up"
                className={`block w-full py-3 rounded-xl text-[14px] font-bold text-center transition-all ${highlight ? "bg-white text-[#0E2C72] hover:bg-[#0E2C72]/6" : "bg-[#0E2C72] hover:bg-[#0a2260] text-white"}`}>
                {cta}
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ── CTA ───────────────────────────────────────────────────────────────────────
function CTA() {
  return (
    <section className="py-24 bg-neutral-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <Reveal>
          <div className="bg-gradient-to-br from-[#064e3b] via-[#065f46] to-[#047857] rounded-3xl p-10 sm:p-14 relative overflow-hidden">
            <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
              className="absolute top-[-20px] right-[-20px] w-40 h-40 border border-white/5 rounded-full" />
            <div className="relative">
              <div className="flex items-center justify-center gap-2 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                  <Building2 className="size-5 text-white" />
                </div>
                <span className="text-white/60 text-[13px] font-semibold">Terratrail</span>
              </div>
              <h2 className="text-[30px] sm:text-[40px] font-black text-white leading-tight mb-4">
                Ready to transform your real estate business?
              </h2>
              <p className="text-[15px] text-[#8aaad8] mb-8 max-w-md mx-auto leading-relaxed">
                Join hundreds of companies already using Terratrail to manage properties, customers, and payments.
              </p>
              <Link to="/auth/sign-up"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-[#0E2C72] text-[15px] font-black rounded-2xl hover:bg-[#0E2C72]/6 active:scale-[0.98] transition-all shadow-xl">
                Get Started — It's Free
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-[#05231a] border-t border-white/5 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#1a3d8f] to-[#0a2260]">
              <Building2 className="size-4 text-white" />
            </div>
            <span className="text-[15px] font-extrabold text-white">Terratrail</span>
          </div>
          <p className="text-[12px] text-white/30">© {new Date().getFullYear()} Terratrail. All rights reserved.</p>
          <div className="flex items-center gap-5 text-[12px] text-white/40">
            <a href="#" className="hover:text-white/70 transition-colors">Privacy</a>
            <a href="#" className="hover:text-white/70 transition-colors">Terms</a>
            <a href="mailto:hello@terratrail.io" className="hover:text-white/70 transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="overflow-x-hidden">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Stats />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
}




