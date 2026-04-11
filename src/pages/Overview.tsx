import { Link } from "react-router";
import { Building2, Users, FileText, TrendingUp, TrendingDown, Plus, UserPlus, LayoutDashboard } from "lucide-react";
import { dashboardStats, properties, salesReps, customers } from "../utils/mockData";
import { motion } from "motion/react";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export function Overview() {
  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString("en-NG")}`;
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] w-full">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 sticky top-0 z-10 hidden md:block">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900">Overview</h1>
            <p className="text-sm text-neutral-500 mt-1">Analytics dashboard</p>
          </div>
          <div className="text-sm text-neutral-600 bg-neutral-100 px-3 py-1.5 rounded-full inline-flex md:flex items-center w-fit">
            Last 24h: <span className="font-medium ml-1">{dashboardStats.recentPayments} payments</span>
          </div>
        </div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 flex-1"
      >
        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <motion.div variants={itemVariants} className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium text-neutral-500 mb-1">Properties</div>
                <div className="text-3xl font-bold text-neutral-900">{dashboardStats.properties.total}</div>
                <div className="text-xs text-neutral-500 mt-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  {dashboardStats.properties.active} active properties
                </div>
              </div>
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium text-neutral-500 mb-1">Customers</div>
                <div className="text-3xl font-bold text-neutral-900">{dashboardStats.customers.total}</div>
                <div className="text-xs text-neutral-500 mt-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  {dashboardStats.customers.active} active customers
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium text-neutral-500 mb-1">Subscriptions</div>
                <div className="text-3xl font-bold text-neutral-900">{dashboardStats.subscriptions.total}</div>
                <div className="text-xs text-neutral-500 mt-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  {dashboardStats.subscriptions.active} active subscriptions
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Financial Panel */}
        <motion.div variants={itemVariants} className="bg-neutral-900 rounded-xl p-6 sm:p-8 shadow-lg text-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="space-y-2">
              <div className="text-sm font-medium text-neutral-400">Total Revenue</div>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight">
                {formatCurrency(dashboardStats.financial.totalRevenue)}
              </div>
              <div className="text-xs text-neutral-500">From paid subscriptions</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-neutral-400">Outstanding Balance</div>
                <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <TrendingDown className="w-3 h-3 text-amber-500" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight">
                {formatCurrency(dashboardStats.financial.outstandingBalance)}
              </div>
              <div className="text-xs text-neutral-500">Unpaid installments</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-neutral-400">Potential Revenue</div>
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <TrendingUp className="w-3 h-3 text-blue-500" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight">
                {formatCurrency(dashboardStats.financial.potentialRevenue)}
              </div>
              <div className="text-xs text-neutral-500">If all subscriptions complete</div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-neutral-400">Net Revenue</div>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-400">
                {formatCurrency(dashboardStats.financial.netRevenue)}
              </div>
              <div className="text-xs text-neutral-500">Revenue minus commissions</div>
            </div>
          </div>
        </motion.div>

        {/* Commission Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <motion.div variants={itemVariants} className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-sm font-medium text-neutral-500 mb-2">Approved Referral Payments</div>
            <div className="text-xl sm:text-2xl font-bold text-neutral-900">
              {formatCurrency(dashboardStats.commission.approvedReferralPayments)}
            </div>
            <div className="flex items-center gap-1.5 mt-3 text-xs font-medium text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded-md">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>From approved payments</span>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-sm font-medium text-neutral-500 mb-2">Payouts</div>
            <div className="text-xl sm:text-2xl font-bold text-neutral-900">
              {formatCurrency(dashboardStats.commission.payouts)}
            </div>
            <div className="text-xs text-neutral-500 mt-3 pt-3 border-t border-dashed border-neutral-200">Paid to realtors</div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-sm font-medium text-neutral-500 mb-2">Pending Payouts</div>
            <div className="text-xl sm:text-2xl font-bold text-neutral-900">
              {formatCurrency(dashboardStats.commission.pendingPayouts)}
            </div>
            <div className="text-xs font-medium text-amber-600 mt-3 bg-amber-50 w-fit px-2 py-1 rounded-md flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
              Awaiting payout
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-sm font-medium text-neutral-500 mb-2">Potential Referral Payments</div>
            <div className="text-xl sm:text-2xl font-bold text-neutral-900">
              {formatCurrency(dashboardStats.commission.potentialReferralPayments)}
            </div>
            <div className="text-xs text-neutral-500 mt-3 pt-3 border-t border-dashed border-neutral-200">If all payments complete</div>
          </motion.div>
        </div>

        {/* Analytics Leaderboards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Properties Leaderboards */}
          <motion.div variants={itemVariants} className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
              <h3 className="font-semibold text-neutral-900">Top Properties by Revenue</h3>
            </div>
            <div className="p-6 space-y-4 flex-1">
              {properties
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5)
                .map((property, index) => (
                  <div key={property.id} className="flex items-center justify-between group hover:bg-neutral-50 p-2 -mx-2 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center text-xs font-medium text-neutral-600 group-hover:bg-white transition-colors border border-transparent group-hover:border-neutral-200">
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-neutral-900">{property.name}</div>
                        <div className="text-xs text-neutral-500">{property.subscriptions} subscriptions</div>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-neutral-900">{formatCurrency(property.revenue)}</div>
                  </div>
                ))}
            </div>
          </motion.div>

          {/* Sales Reps Leaderboard */}
          <motion.div variants={itemVariants} className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
              <h3 className="font-semibold text-neutral-900">Top Sales Reps</h3>
            </div>
            <div className="p-6 space-y-4 flex-1">
              {salesReps
                .sort((a, b) => b.referrals - a.referrals)
                .slice(0, 5)
                .map((rep, index) => (
                  <div key={rep.id} className="flex items-center justify-between group hover:bg-neutral-50 p-2 -mx-2 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center text-xs font-medium text-neutral-600 group-hover:bg-white transition-colors border border-transparent group-hover:border-neutral-200">
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-neutral-900">{rep.name}</div>
                        <div className="text-xs text-neutral-500">{rep.tier}</div>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-neutral-900">{rep.referrals} referrals</div>
                  </div>
                ))}
            </div>
          </motion.div>

          {/* Customers by Revenue */}
          <motion.div variants={itemVariants} className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
              <h3 className="font-semibold text-neutral-900">Top Customers by Revenue</h3>
            </div>
            <div className="p-6 space-y-4 flex-1">
              {customers
                .sort((a, b) => b.totalRevenue - a.totalRevenue)
                .slice(0, 5)
                .map((customer, index) => (
                  <div key={customer.id} className="flex items-center justify-between group hover:bg-neutral-50 p-2 -mx-2 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center text-xs font-medium text-neutral-600 group-hover:bg-white transition-colors border border-transparent group-hover:border-neutral-200">
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-neutral-900">{customer.name}</div>
                        <div className="text-xs text-neutral-500">{customer.subscriptions} subscriptions</div>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-neutral-900">{formatCurrency(customer.totalRevenue)}</div>
                  </div>
                ))}
            </div>
          </motion.div>

          {/* Customers by Subscriptions */}
          <motion.div variants={itemVariants} className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
              <h3 className="font-semibold text-neutral-900">Top Customers by Subscriptions</h3>
            </div>
            <div className="p-6 space-y-4 flex-1">
              {customers
                .sort((a, b) => b.subscriptions - a.subscriptions)
                .slice(0, 5)
                .map((customer, index) => (
                  <div key={customer.id} className="flex items-center justify-between group hover:bg-neutral-50 p-2 -mx-2 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center text-xs font-medium text-neutral-600 group-hover:bg-white transition-colors border border-transparent group-hover:border-neutral-200">
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-neutral-900">{customer.name}</div>
                        <div className="text-xs text-neutral-500">{formatCurrency(customer.totalRevenue)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="text-sm font-bold text-neutral-900">{customer.subscriptions} subs</div>
                    </div>
                  </div>
                ))}
            </div>
          </motion.div>
        </div>

        {/* Quick Links */}
        <motion.div variants={itemVariants} className="bg-emerald-50 rounded-xl border border-emerald-100 p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none hidden sm:block">
             <LayoutDashboard className="w-32 h-32 text-emerald-900" />
          </div>
          <div className="relative z-10">
            <h3 className="font-semibold text-emerald-900 mb-2 text-lg">Quick Actions</h3>
            <p className="text-sm text-emerald-700/80 mb-6 max-w-xl">
              Get started quickly with your most frequent tasks or explore new ways to manage your workspace efficiently.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/properties/new"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-medium shadow-sm hover:shadow-emerald-600/20 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                Add a Property
              </Link>
              <Link
                to="/customers"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-emerald-200 text-emerald-800 rounded-lg hover:bg-emerald-100 transition-all font-medium w-full sm:w-auto"
              >
                <Users className="w-4 h-4" />
                Manage Customers
              </Link>
              <Link
                to="/settings/people"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-emerald-200 text-emerald-800 rounded-lg hover:bg-emerald-100 transition-all font-medium w-full sm:w-auto"
              >
                <UserPlus className="w-4 h-4" />
                Invite Team Member
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
