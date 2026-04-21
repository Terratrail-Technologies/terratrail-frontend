import { useState, useEffect, useCallback } from 'react';
import { api, DashboardStats, type DateRange } from '../services/api';
export type { DateRange };
import { format, subDays, startOfMonth, startOfYear, endOfMonth, endOfYear, subMonths } from 'date-fns';

export type DatePreset = 'today' | '7d' | '30d' | 'this_month' | 'last_month' | 'this_year' | 'all_time' | 'custom';

export const PRESET_LABELS: Record<DatePreset, string> = {
  today: 'Today',
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
  this_month: 'This Month',
  last_month: 'Last Month',
  this_year: 'This Year',
  all_time: 'All Time',
  custom: 'Custom Range'
};

export function presetToRange(preset: DatePreset): DateRange {
  const now = new Date();
  const fmt = (d: Date) => format(d, 'yyyy-MM-dd');

  switch (preset) {
    case 'today':
      return { from: fmt(now), to: fmt(now) };
    case '7d':
      return { from: fmt(subDays(now, 7)), to: fmt(now) };
    case '30d':
      return { from: fmt(subDays(now, 30)), to: fmt(now) };
    case 'this_month':
      return { from: fmt(startOfMonth(now)), to: fmt(now) }; // Or endOfMonth if we want full month
    case 'last_month': {
      const last = subMonths(now, 1);
      return { from: fmt(startOfMonth(last)), to: fmt(endOfMonth(last)) };
    }
    case 'this_year':
      return { from: fmt(startOfYear(now)), to: fmt(now) };
    case 'all_time':
    default:
      return { from: null, to: null };
  }
}

export function useDashboard(dateRange: DateRange, enabled = true) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [revenueBreakdown, setRevenueBreakdown] = useState<any>(null);
  const [propertyLeaderboard, setPropertyLeaderboard] = useState<any>(null);
  const [customerLeaderboard, setCustomerLeaderboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const [statsRes, leaderboardRes, revenueRes, propertiesRes, customersRes] =
        await Promise.allSettled([
          api.dashboard.getStats(dateRange),
          api.dashboard.getLeaderboard(dateRange),
          api.dashboard.getRevenueBreakdown(dateRange),
          api.dashboard.getProperties(dateRange),
          api.dashboard.getCustomers(dateRange),
        ]);

      if (statsRes.status === "fulfilled")       setStats(statsRes.value);
      if (leaderboardRes.status === "fulfilled") setLeaderboard(leaderboardRes.value?.leaderboard ?? null);
      if (revenueRes.status === "fulfilled")     setRevenueBreakdown(revenueRes.value?.breakdown ?? null);
      if (propertiesRes.status === "fulfilled")  setPropertyLeaderboard(propertiesRes.value);
      if (customersRes.status === "fulfilled")   setCustomerLeaderboard(customersRes.value);
    } catch (err: any) {
      setError(err.message ?? "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [dateRange, enabled]);

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 30s + on tab focus
    const interval = setInterval(fetchDashboardData, 30_000);
    const onFocus  = () => fetchDashboardData();
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(interval); window.removeEventListener("focus", onFocus); };
  }, [fetchDashboardData]);

  return {
    stats,
    leaderboard,
    revenueBreakdown,
    propertyLeaderboard,
    customerLeaderboard,
    isFiltered: Boolean(dateRange && (dateRange.from || dateRange.to)),
    loading,
    error,
    refresh: fetchDashboardData
  };
}
