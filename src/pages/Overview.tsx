import { useState } from "react";
import { Link } from "react-router";
import { usePageTitle } from "../hooks/usePageTitle";
import { useWorkspaceRole } from "../hooks/useWorkspaceRole";
import {
  Users, FileText,
  TrendingUp, TrendingDown,
  UserPlus, LayoutDashboard,
  Eye, EyeOff, Loader2,
  Building2, MapPin, Plus,
} from "lucide-react";
import { motion } from "motion/react";
import { Skeleton } from "../components/ui/skeleton";
import { DateRangeFilter } from "../components/ui/DateRangeFilter";
import {
  useDashboard,
  type DatePreset,
  type DateRange,
} from "../hooks/useDashboard";

// ─── Animation variants ────────────────────────────────────────────
const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } } as const;
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 320, damping: 26 } } } as const;

// ─── Helpers ──────────────────────────────────────────────────────
const fmt = (n: number) => `₦${n.toLocaleString("en-NG")}`;
const HIDDEN = "₦ ••••••";
const rankColors = [
  "bg-amber-400 text-amber-900",
  "bg-neutral-300 text-neutral-700",
  "bg-orange-300 text-orange-900",
  "bg-neutral-100 text-neutral-500",
  "bg-neutral-100 text-neutral-500",
];
const DEFAULT_RANGE: DateRange = { from: null, to: null };

// ── Role-specific dashboard for non-admin users ───────────────────────────────
function RoleDashboard({ role }: { role: "SALES_REP" | "CUSTOMER" }) {
  const isSalesRep = role === "SALES_REP";
  return (
    <div className="flex flex-col min-h-[calc(100vh-60px)] w-full">
      <div className="bg-white border-b border-neutral-100 px-6 lg:px-8 py-4">
        <h1 className="text-[18px] font-semibold text-neutral-900">
          {isSalesRep ? "My Dashboard" : "My Account"}
        </h1>
        <p className="text-[12px] text-neutral-400 mt-0.5">
          {isSalesRep ? "Your sales performance overview" : "Your account overview"}
        </p>
      </div>
      <div className="p-6 lg:p-8 flex-1">
        <div className="max-w-2xl mx-auto mt-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 mb-5">
            <LayoutDashboard className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">
            {isSalesRep ? "Sales Rep Dashboard" : "Customer Dashboard"}
          </h2>
          <p className="text-neutral-500 text-sm max-w-sm mx-auto">
            {isSalesRep
              ? "Your commission reports, property pipeline, and client activity will appear here."
              : "Your subscriptions, payment history, and property details will appear here."}
          </p>
          {isSalesRep && (
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              <Link to="/properties" className="p-5 bg-white rounded-xl border border-neutral-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-sm font-medium text-neutral-700 mb-1">Browse Properties</div>
                <div className="text-xs text-neutral-400">View available listings to share with clients</div>
              </Link>
              <Link to="/site-inspection" className="p-5 bg-white rounded-xl border border-neutral-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-sm font-medium text-neutral-700 mb-1">Site Inspections</div>
                <div className="text-xs text-neutral-400">Manage your inspection requests</div>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Overview() {
  usePageTitle("Dashboard");
  const { role, loading: roleLoading } = useWorkspaceRole();
  const isAdmin = role === "OWNER" || role === "ADMIN" || role === null; // null = likely owner with missing membership

  // ── Date filter state ──────────────────────────────────────────
  const [preset,      setPreset]      = useState<DatePreset>("all_time");
  const [customRange, setCustomRange] = useState<DateRange | null>(null);
  const [range,       setRange]       = useState<DateRange | null>(null);

  const handlePresetChange = (p: DatePreset, r: DateRange | null) => {
    setPreset(p);
    setCustomRange(p === "custom" ? r : null);
    setRange(r);
  };

  // ── Visibility toggle ──────────────────────────────────────────
  const [valuesHidden, setValuesHidden] = useState(false);

  // ── Data ───────────────────────────────────────────────────────
  const {
    stats,
    leaderboard,
    revenueBreakdown,
    propertyLeaderboard,
    customerLeaderboard,
    loading,
    isFiltered
  } = useDashboard(range || DEFAULT_RANGE, isAdmin && !roleLoading);

  // ── Non-admin role dashboard ──────────────────────────────────
  if (!roleLoading && (role === "SALES_REP" || role === "CUSTOMER")) {
    return <RoleDashboard role={role} />;
  }

  // Skeleton scaffold — shown on first load before any data arrives
  if (!stats && loading) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-60px)] w-full">
        {/* Header skeleton */}
        <div className="bg-white border-b border-neutral-100 px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-28 bg-neutral-100" />
              <Skeleton className="h-3.5 w-40 bg-neutral-100 hidden sm:block" />
            </div>
            <Skeleton className="h-8 w-8 sm:w-52 rounded-lg bg-neutral-100" />
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
          {/* 4 stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-neutral-100 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-3.5 w-28 bg-neutral-100" />
                    <Skeleton className="h-8 w-16 bg-neutral-100" />
                    <Skeleton className="h-3 w-20 bg-neutral-100" />
                  </div>
                  <Skeleton className="w-10 h-10 rounded-xl bg-neutral-100 shrink-0" />
                </div>
              </div>
            ))}
          </div>

          {/* Financial panel skeleton */}
          <div className="rounded-xl p-6 sm:p-8" style={{ background: "linear-gradient(135deg,#0f172a,#1e293b,#0f172a)" }}>
            <Skeleton className="h-3.5 w-40 mb-6 bg-slate-700" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-24 bg-slate-700" />
                  <Skeleton className="h-7 w-32 bg-slate-700" />
                  <Skeleton className="h-2.5 w-28 bg-slate-800" />
                </div>
              ))}
            </div>
          </div>

          {/* 4 commission cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-neutral-100 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                <Skeleton className="h-3.5 w-32 mb-2 bg-neutral-100" />
                <Skeleton className="h-6 w-28 mb-3 bg-neutral-100" />
                <Skeleton className="h-5 w-20 rounded-md bg-neutral-100" />
              </div>
            ))}
          </div>

          {/* 2 leaderboard panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-neutral-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
                <div className="px-5 py-3.5 border-b border-neutral-50">
                  <Skeleton className="h-4 w-40 bg-neutral-100" />
                </div>
                <div className="p-3 space-y-1">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="flex items-center justify-between px-2 py-2">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-6 h-6 rounded-full bg-neutral-100 shrink-0" />
                        <div className="space-y-1">
                          <Skeleton className="h-3.5 w-28 bg-neutral-100" />
                          <Skeleton className="h-3 w-16 bg-neutral-100" />
                        </div>
                      </div>
                      <Skeleton className="h-3.5 w-20 bg-neutral-100" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Safety fallback if stats is still null
  const safeStats = stats || {
    revenue: "0",
    net_revenue: "0",
    outstanding_balance: "0",
    potential_revenue: "0",
    commission_earned: "0",
    commission_pending: "0",
    commission_potential: "0",
    active_subscriptions: 0,
    total_customers: 0,
    overdue_installments: 0,
    pending_payments: 0,
    filters: { date_from: null, date_to: null }
  };

  const maskStr = (val: string | number) => (valuesHidden ? HIDDEN : (typeof val === 'number' ? fmt(val) : `₦${parseFloat(val).toLocaleString("en-NG")}`));
  const fmtNum = (val: string | number) => (typeof val === 'number' ? val : parseFloat(val));

  return (
    <div className="flex flex-col min-h-[calc(100vh-60px)] w-full">
      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="bg-white border-b border-neutral-100 px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col gap-3">
          {/* Title row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-[17px] font-semibold text-neutral-900 tracking-tight">Overview</h1>
                  {loading && <Loader2 className="w-3.5 h-3.5 text-emerald-500 animate-spin shrink-0" />}
                </div>
                <p className="text-[12px] text-neutral-400 mt-0.5 hidden sm:block">Analytics dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Pending payments badge — clickable link to payments page */}
              {!isFiltered && (
                <Link
                  to="/payments?status=pending"
                  className="hidden sm:flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full whitespace-nowrap hover:bg-amber-100 transition-colors font-medium"
                >
                  Pending payments:
                  <span className="font-bold ml-0.5">{safeStats.pending_payments}</span>
                </Link>
              )}
              {/* Visibility toggle */}
              <button
                type="button"
                onClick={() => setValuesHidden((v) => !v)}
                title={valuesHidden ? "Show values" : "Hide sensitive values"}
                className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50 transition-all text-[12px] font-medium"
              >
                {valuesHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{valuesHidden ? "Show" : "Hide"}</span>
              </button>
            </div>
          </div>

          {/* Date filter row — scrollable on mobile */}
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <DateRangeFilter
              preset={preset}
              customRange={customRange}
              onPresetChange={handlePresetChange}
            />
          </div>
        </div>
      </div>

      <motion.div variants={container} initial="hidden" animate="show"
        className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1">

        {/* ── Stat cards ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: `Active Subscriptions`,
              value: safeStats.active_subscriptions,
              accentBg: "bg-emerald-500",
              dot: "bg-emerald-500", icon: FileText, iconBg: "bg-emerald-50", iconColor: "text-emerald-600",
              note: isFiltered ? "overall" : undefined,
            },
            {
              label: `Total Customers`,
              value: safeStats.total_customers,
              accentBg: "bg-blue-500",
              dot: "bg-blue-500", icon: Users, iconBg: "bg-blue-50", iconColor: "text-blue-600",
              note: isFiltered ? "overall" : undefined,
            },
            {
              label: `Overdue`,
              value: safeStats.overdue_installments,
              accentBg: "bg-red-500",
              dot: "bg-red-500", icon: TrendingDown, iconBg: "bg-red-50", iconColor: "text-red-600",
              note: "action required",
            },
            {
              label: `Pending Payments`,
              value: safeStats.pending_payments,
              accentBg: "bg-amber-500",
              dot: "bg-amber-500", icon: LayoutDashboard, iconBg: "bg-amber-50", iconColor: "text-amber-600",
              note: "awaiting review",
            },
          ].map((s) => (
            <motion.div key={s.label} variants={item}
              className="relative bg-white rounded-xl border border-neutral-100 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.09)] transition-all duration-200 overflow-hidden">
              <div className={`absolute top-0 left-0 right-0 h-0.5 ${s.accentBg}`} />
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[12px] font-medium text-neutral-400 mb-1.5">{s.label}</div>
                  <div className="text-[28px] font-bold text-neutral-900 leading-none tracking-tight">{s.value}</div>
                  <div className="text-[11.5px] text-neutral-400 mt-2.5 flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                    {s.note}
                  </div>
                </div>
                <div className={`w-10 h-10 ${s.iconBg} rounded-xl flex items-center justify-center shrink-0`}>
                  <s.icon className={`w-5 h-5 ${s.iconColor}`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Financial panel (always shows overall; hide toggle controls visibility) ─ */}
        <motion.div variants={item}
          className="rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
          style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)" }}>
          <div className="px-6 pt-5 pb-1 flex items-center justify-between">
            <span className="text-[11.5px] font-semibold text-slate-400 uppercase tracking-wider">
              Financial Summary{isFiltered ? " · filtered" : ""}
            </span>
          </div>
          <div className="p-6 sm:p-8 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {/* Total Revenue */}
              <div className="space-y-1.5">
                <div className="text-[11.5px] font-medium text-slate-400">Total Revenue</div>
                <div className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-none">
                  {maskStr(safeStats.revenue)}
                </div>
                <div className="text-[10.5px] text-slate-500">All money received</div>
              </div>

              {/* Outstanding Balance */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="text-[11.5px] font-medium text-slate-400">Outstanding Balance</div>
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <TrendingDown className="w-2.5 h-2.5 text-amber-500" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-amber-400 tracking-tight leading-none">
                  {maskStr(safeStats.outstanding_balance)}
                </div>
                <div className="text-[10.5px] text-slate-500">Unpaid subscribed properties</div>
              </div>

              {/* Contract Value */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="text-[11.5px] font-medium text-slate-400">Contract Value</div>
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <TrendingUp className="w-2.5 h-2.5 text-blue-500" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-blue-400 tracking-tight leading-none">
                  {maskStr(safeStats.potential_revenue)}
                </div>
                <div className="text-[10.5px] text-slate-500">Active & completed subscriptions</div>
              </div>

              {/* Net Income */}
              <div className="space-y-1.5">
                <div className="text-[11.5px] font-medium text-slate-400">Net Income</div>
                <div className="text-xl sm:text-2xl font-bold text-emerald-400 tracking-tight leading-none">
                  {maskStr(safeStats.net_revenue)}
                </div>
                <div className="text-[10.5px] text-slate-500">Total revenue minus commission</div>
              </div>
            </div>
          </div>
          <div className="h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500/40 to-emerald-500/0" />
        </motion.div>

        {/* ── Commission cards – FILTERABLE + HIDEABLE ─────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Approved Referral Payments",
              value: String(fmtNum(safeStats.commission_earned) + fmtNum(safeStats.commission_pending)),
              accentBg: "bg-emerald-500",
              badge: { text: "Approved", color: "bg-emerald-50 text-emerald-700" },
              badgeIcon: TrendingUp,
              footer: "Total from approved payments",
            },
            {
              label: "Payouts",
              value: safeStats.commission_earned,
              accentBg: "bg-blue-500",
              badge: { text: "Disbursed", color: "bg-blue-50 text-blue-700" },
              footer: "Paid to realtors",
            },
            {
              label: "Pending Payouts",
              value: safeStats.commission_pending,
              accentBg: "bg-amber-500",
              badge: { text: "Awaiting payout", color: "bg-amber-50 text-amber-700" },
              footer: "Earned but not yet paid",
            },
            {
              label: "Potential Referral Payments",
              value: safeStats.commission_potential,
              accentBg: "bg-violet-500",
              badge: { text: "All subs complete", color: "bg-violet-50 text-violet-700" },
              footer: "If all subscriptions complete",
            },
          ].map((c) => (
            <motion.div key={c.label} variants={item}
              className="relative bg-white rounded-xl border border-neutral-100 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.09)] transition-all duration-200 overflow-hidden">
              <div className={`absolute top-0 left-0 right-0 h-0.5 ${c.accentBg}`} />
              <div className="text-[12px] font-medium text-neutral-400 mb-2 leading-snug">{c.label}</div>
              <div className="text-[20px] font-bold text-neutral-900 tracking-tight leading-none">
                {maskStr(c.value)}
              </div>
              <div className={`inline-flex items-center gap-1.5 mt-3 text-[11px] font-medium ${c.badge.color} px-2 py-1 rounded-md`}>
                {"badgeIcon" in c && c.badgeIcon && <c.badgeIcon className="w-3 h-3" />}
                {c.badge.text}
              </div>
              <div className="text-[11px] text-neutral-400 mt-2">
                {c.footer}
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Properties Overview ───────────────────────────────── */}
        <motion.div variants={item}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold text-neutral-800 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-neutral-400" />
              Properties Overview
            </h3>
            <Link to="/properties" className="text-[11.5px] text-emerald-600 hover:underline font-medium">View all →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { label: "Total Properties", value: safeStats.total_properties ?? 0, color: "text-neutral-900", accent: "bg-neutral-500" },
              { label: "Active Subs", value: safeStats.active_subscriptions, color: "text-emerald-700", accent: "bg-emerald-500" },
              { label: "Completed", value: safeStats.completed_subscriptions ?? 0, color: "text-blue-700", accent: "bg-blue-500" },
              { label: "Pending Allocation", value: safeStats.pending_allocation ?? 0, color: "text-amber-700", accent: "bg-amber-500" },
              { label: "Allocated", value: safeStats.allocated ?? 0, color: "text-violet-700", accent: "bg-violet-500" },
            ].map((stat) => (
              <div key={stat.label} className="relative bg-white rounded-xl border border-neutral-100 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
                <div className={`absolute top-0 left-0 right-0 h-0.5 ${stat.accent}`} />
                <div className={`text-[22px] font-bold leading-tight ${stat.color}`}>{stat.value}</div>
                <div className="text-[11px] font-medium text-neutral-400 mt-0.5 leading-tight">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Customer Overview ─────────────────────────────────── */}
        <motion.div variants={item}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold text-neutral-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-neutral-400" />
              Customer Overview
            </h3>
            <Link to="/customers" className="text-[11.5px] text-emerald-600 hover:underline font-medium">View all →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Customers", value: safeStats.total_customers, color: "text-neutral-900", accent: "bg-neutral-500" },
              { label: "Active Subscriptions", value: safeStats.active_subscriptions, color: "text-emerald-700", accent: "bg-emerald-500" },
              { label: "Completed Subs", value: safeStats.completed_subscriptions ?? 0, color: "text-blue-700", accent: "bg-blue-500" },
              { label: "Defaulting Subs", value: safeStats.defaulting_subscriptions ?? 0, color: "text-red-700", accent: "bg-red-500" },
            ].map((stat) => (
              <div key={stat.label} className="relative bg-white rounded-xl border border-neutral-100 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
                <div className={`absolute top-0 left-0 right-0 h-0.5 ${stat.accent}`} />
                <div className={`text-[22px] font-bold leading-tight ${stat.color}`}>{stat.value}</div>
                <div className="text-[11px] font-medium text-neutral-400 mt-0.5 leading-tight">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Leaderboards – FILTERABLE ──────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[
            {
              title: "Top Properties by Revenue",
              empty: "No approved payments recorded yet.",
              rows: (revenueBreakdown || []).slice(0, 5).map((p: any, i: number) => ({
                key: p.property || i, rank: i + 1, name: p.property || "—",
                sub: `${p.payment_count} payment${p.payment_count !== 1 ? "s" : ""}`,
                right: maskStr(p.total_revenue),
              })),
            },
            {
              title: "Top Sales Reps",
              empty: "No sales reps with commissions yet.",
              rows: (leaderboard || []).slice(0, 5).map((r: any, i: number) => ({
                key: r.id, rank: i + 1, name: r.name,
                sub: r.tier,
                right: maskStr(r.total_earned),
              })),
            },
            {
              title: "Top Customers by Revenue",
              empty: "No customer payment data yet.",
              rows: (customerLeaderboard?.top_by_revenue || []).slice(0, 5).map((c: any, i: number) => ({
                key: c.id, rank: i + 1, name: c.full_name,
                sub: c.email,
                right: maskStr(c.total_paid),
              })),
            },
            {
              title: "Properties by Active Units",
              empty: "No properties with active subscriptions.",
              rows: (propertyLeaderboard?.top_by_subscriptions || []).slice(0, 5).map((p: any, i: number) => ({
                key: p.id, rank: i + 1, name: p.name,
                sub: "Active units",
                right: `${p.subscription_count} units`,
              })),
            },
          ].map((board) => (
            <motion.div key={board.title} variants={item}
              className="bg-white rounded-xl border border-neutral-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow duration-200 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-neutral-50 flex items-center justify-between">
                <h3 className="text-[13px] font-semibold text-neutral-800">{board.title}</h3>
                {isFiltered && (
                  <span className="text-[10.5px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">filtered</span>
                )}
              </div>
              <div className="p-3 space-y-0.5">
                {board.rows.length === 0 ? (
                  <p className="text-[12px] text-neutral-400 text-center py-6">{board.empty}</p>
                ) : board.rows.map((row: any) => (
                  <div key={row.key}
                    className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-neutral-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${rankColors[row.rank - 1]}`}>
                        {row.rank}
                      </div>
                      <div>
                        <div className="text-[12.5px] font-semibold text-neutral-900">{row.name}</div>
                        <div className="text-[11px] text-neutral-400">{row.sub}</div>
                      </div>
                    </div>
                    <div className="text-[12.5px] font-bold text-neutral-800">{row.right}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Quick Actions ────────────────────────────────────────── */}
        <motion.div variants={item}
          className="relative overflow-hidden rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-50 p-6 sm:p-8">
          <div className="absolute -top-4 -right-4 opacity-[0.06] pointer-events-none hidden sm:block">
            <LayoutDashboard className="w-36 h-36 text-emerald-800" />
          </div>
          <div className="relative">
            <h3 className="text-[15px] font-semibold text-emerald-900 mb-1">Quick Actions</h3>
            <p className="text-[12.5px] text-emerald-700/70 mb-5 max-w-lg leading-relaxed">
              Get started quickly with your most frequent tasks.
            </p>
            <div className="flex flex-wrap gap-2.5">
              <Link to="/properties/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all text-[13px] font-medium shadow-sm">
                <Plus className="w-3.5 h-3.5" />
                Add a Property
              </Link>
              <Link to="/customers"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-emerald-200 text-emerald-800 rounded-lg hover:bg-emerald-50 transition-all text-[13px] font-medium">
                <Users className="w-3.5 h-3.5" />
                Manage Customers
              </Link>
              <Link to="/payments?status=pending"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-amber-200 text-amber-800 rounded-lg hover:bg-amber-50 transition-all text-[13px] font-medium">
                <MapPin className="w-3.5 h-3.5" />
                Review Pending Payments
              </Link>
              <Link to="/settings/people"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-all text-[13px] font-medium">
                <UserPlus className="w-3.5 h-3.5" />
                Invite Team Member
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
