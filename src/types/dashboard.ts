export interface DashboardStats {
  revenue: string;
  net_revenue: string;
  outstanding_balance: string;
  potential_revenue: string;
  commission_earned: string;
  commission_pending: string;
  commission_potential: string;
  active_subscriptions: number;
  completed_subscriptions: number;
  defaulting_subscriptions: number;
  pending_allocation: number;
  allocated: number;
  total_customers: number;
  total_properties: number;
  overdue_installments: number;
  pending_payments: number;
  filters: {
    date_from: string | null;
    date_to: string | null;
  };
}

export interface SalesRepLeaderboardEntry {
  id: string;
  name: string;
  tier: 'STARTER' | 'SENIOR' | 'LEGEND';
  referral_code: string;
  total_earned: string;
  total_pending: string;
  total_referrals: number;
}

export interface PropertyRevenueBreakdown {
  property: string;
  total_revenue: string;
  payment_count: number;
}

export interface PropertyLeaderboardEntry {
  id: string;
  name: string;
  subscription_count?: number;
  total_revenue?: string;
}

export interface PropertyLeaderboard {
  top_by_subscriptions: PropertyLeaderboardEntry[];
  top_by_revenue: PropertyLeaderboardEntry[];
}

export interface CustomerLeaderboardEntry {
  id: string;
  full_name: string;
  email: string;
  total_paid?: string;
  subscription_count?: number;
}

export interface CustomerLeaderboard {
  top_by_revenue: CustomerLeaderboardEntry[];
  top_by_subscriptions: CustomerLeaderboardEntry[];
}

export type DatePreset = 'today' | '7d' | '30d' | 'this_month' | 'last_month' | 'this_year' | 'all_time' | 'custom';

export interface DateRange {
  from: string | null;
  to: string | null;
}
