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

export function useDashboard(dateRange: DateRange) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [revenueBreakdown, setRevenueBreakdown] = useState<any>(null);
  const [propertyLeaderboard, setPropertyLeaderboard] = useState<any>(null);
  const [customerLeaderboard, setCustomerLeaderboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        statsData,
        leaderboardData,
        revenueData,
        propertiesData,
        customersData
      ] = await Promise.all([
        api.dashboard.getStats(dateRange),
        api.dashboard.getLeaderboard(dateRange),
        api.dashboard.getRevenueBreakdown(dateRange),
        api.dashboard.getProperties(dateRange),
        api.dashboard.getCustomers(dateRange)
      ]);

      setStats(statsData);
      setLeaderboard(leaderboardData.leaderboard);
      setRevenueBreakdown(revenueData.breakdown);
      setPropertyLeaderboard(propertiesData);
      setCustomerLeaderboard(customersData);
    } catch (err: any) {
      console.warn('Failed to fetch dashboard data, using mock fallback', err);
      setError(err.message);
      
      // Fallback to mock data if API fails
      setStats({
        revenue: "5420000.00",
        net_revenue: "5120000.00",
        outstanding_balance: "12400000.00",
        potential_revenue: "28000000.00",
        commission_earned: "300000.00",
        commission_pending: "120000.00",
        commission_potential: "420000.00",
        active_subscriptions: 52,
        total_customers: 68,
        overdue_installments: 5,
        pending_payments: 2,
        filters: { date_from: dateRange.from, date_to: dateRange.to }
      });
      setLeaderboard([
        { id: '1', name: 'James Wilson', tier: 'LEGEND', total_earned: '150000', total_pending: '25000', total_referrals: 12 },
        { id: '2', name: 'Sarah Miller', tier: 'SENIOR', total_earned: '95000', total_pending: '12000', total_referrals: 8 },
      ]);
      setRevenueBreakdown([
        { property: 'Green Valley Estate', total_revenue: '3000000.00', payment_count: 24 },
        { property: 'Hillview Gardens', total_revenue: '2420000.00', payment_count: 18 },
      ]);
      setPropertyLeaderboard({
        top_by_subscriptions: [{ id: '1', name: 'Green Valley', subscription_count: 15 }],
        top_by_revenue: [{ id: '1', name: 'Green Valley', total_revenue: '3000000.00' }]
      });
      setCustomerLeaderboard({
        top_by_revenue: [{ id: '1', full_name: 'John Doe', total_paid: '500000' }],
        top_by_subscriptions: [{ id: '1', full_name: 'Jane Smith', subscription_count: 2 }]
      });
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchDashboardData();
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
