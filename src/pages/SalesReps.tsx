import { useState } from "react";
import { usePolling } from "../hooks/usePolling";
import { Link2, Settings, TrendingUp, Loader2 } from "lucide-react";
import { Skeleton } from "../components/ui/skeleton";
import { api } from "../services/api";
import { Badge } from "../components/ui/badge";

export function SalesReps() {
  const [reps, setReps] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [list, performance] = await Promise.all([
        api.salesReps.list(),
        api.salesReps.getStats()
      ]);
      setReps(list);
      setStats(performance);
    } catch (err) {
      console.error("Failed to load sales reps:", err);
    } finally {
      setLoading(false);
    }
  };

  usePolling(fetchData, 30_000);

  const formatCurrency = (amount: number | string) => {
    return `₦${Number(amount).toLocaleString("en-NG")}`;
  };

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "legend":
        return "bg-purple-100 text-purple-700 hover:bg-purple-100";
      case "senior":
        return "bg-blue-100 text-blue-700 hover:bg-blue-100";
      case "starter":
        return "bg-neutral-100 text-neutral-700 hover:bg-neutral-100";
      default:
        return "bg-neutral-50 text-neutral-600";
    }
  };

  const safeStats = stats || {};

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">Sales Representatives</h1>
              <p className="text-sm text-neutral-500 mt-1">Sales agent and commission tracking</p>
            </div>
            {loading && <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />}
          </div>
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50 transition-colors shadow-sm text-sm font-medium">
              <Link2 className="w-4 h-4" />
              Open Invite Links
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50 transition-colors shadow-sm text-sm font-medium">
              <Settings className="w-4 h-4" />
              Commission Settings
            </button>
          </div>
        </div>
      </div>

      <div className="p-8">
        {loading && reps.length === 0 ? (
          /* Skeleton scaffold */
          <>
            {/* 3 summary metric cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg border border-neutral-200 p-6 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-3.5 w-28 bg-neutral-100" />
                      <Skeleton className="h-8 w-36 bg-neutral-100" />
                      <Skeleton className="h-3 w-24 bg-neutral-100" />
                    </div>
                    <Skeleton className="w-10 h-10 rounded-lg bg-neutral-100 shrink-0" />
                  </div>
                </div>
              ))}
            </div>

            {/* Table skeleton */}
            <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-neutral-200">
                <Skeleton className="h-4 w-48 bg-neutral-100" />
              </div>
              <div className="divide-y divide-neutral-200">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="px-6 py-4 flex items-center gap-4">
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-36 bg-neutral-100" />
                      <Skeleton className="h-3 w-24 bg-neutral-100" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full bg-neutral-100" />
                    <Skeleton className="h-6 w-20 rounded bg-neutral-100" />
                    <Skeleton className="h-4 w-8 bg-neutral-100" />
                    <Skeleton className="h-4 w-24 bg-neutral-100" />
                    <Skeleton className="h-4 w-20 bg-neutral-100" />
                    <Skeleton className="h-7 w-7 rounded-md bg-neutral-100 ml-auto" />
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
        <>
        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-neutral-200 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-neutral-500 mb-1">Pending to Earn</div>
                <div className="text-3xl font-semibold text-neutral-900">
                  {formatCurrency(safeStats.pendingPayouts ?? safeStats.pending_payout ?? 0)}
                </div>
                <div className="text-xs text-amber-600 mt-2">From unpaid referral payments</div>
              </div>
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-neutral-200 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-neutral-500 mb-1">Total Earned</div>
                <div className="text-3xl font-semibold text-neutral-900">
                  {formatCurrency(
                    (safeStats.payouts ?? safeStats.total_paid ?? 0) + 
                    (safeStats.pendingPayouts ?? safeStats.pending_payout ?? 0)
                  )}
                </div>
                <div className="text-xs text-neutral-500 mt-2">Paid + pending payout</div>
              </div>
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-neutral-200 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-neutral-500 mb-1">Total Earning Potential</div>
                <div className="text-3xl font-semibold text-neutral-900">
                  {formatCurrency(safeStats.potentialReferralPayments ?? safeStats.total_potential ?? 0)}
                </div>
                <div className="text-xs text-neutral-500 mt-2">If all referral payments made</div>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Sales Reps Table */}
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
            <h3 className="font-medium text-neutral-900">All Sales Representatives</h3>
            <span className="text-xs text-neutral-400 font-medium">{reps.length} active agents</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Sales Representative
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Tier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Referral Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Referrals
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Total Earned
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Pending Payout
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {reps.map((rep) => (
                  <tr key={rep.id} className="hover:bg-neutral-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-neutral-900 group-hover:text-emerald-600 transition-colors">{rep.name}</div>
                        <div className="text-sm text-neutral-500">{rep.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getTierColor(rep.tier)}>{rep.tier || "Starter"}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-mono text-xs text-neutral-500 bg-neutral-100 px-2 py-1 rounded w-fit">{rep.referralCode || rep.referral_code || "N/A"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        <span className="font-medium text-neutral-900">{rep.referrals ?? rep.referral_count ?? 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-neutral-900">{formatCurrency(rep.totalEarned ?? rep.total_earned ?? 0)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-amber-600">{formatCurrency(rep.pendingPayout ?? rep.pending_payout ?? 0)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button className="p-2 hover:bg-neutral-100 rounded-md transition-colors" title="View Details">
                        <Settings className="w-4 h-4 text-neutral-600" />
                      </button>
                    </td>
                  </tr>
                ))}
                {reps.length === 0 && !loading && (
                   <tr>
                   <td colSpan={7} className="px-6 py-12 text-center text-neutral-400 text-sm italic">
                     No sales representatives found.
                   </td>
                 </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sales Rep Tiers Info */}
        <div className="mt-8 bg-white rounded-lg border border-neutral-200 p-6 shadow-sm">
          <h3 className="font-medium text-neutral-900 mb-4">Sales Rep Tiers</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-neutral-200 rounded-md hover:border-neutral-300 transition-colors">
              <Badge className="bg-neutral-100 text-neutral-700 mb-2">Starter</Badge>
              <p className="text-sm text-neutral-600">Entry-level sales representatives</p>
              <div className="mt-3 text-[11px] text-neutral-400 font-mono">
                app.TerraTrail.com/invites/starter
              </div>
            </div>
            <div className="p-4 border border-neutral-200 rounded-md hover:border-neutral-300 transition-colors">
              <Badge className="bg-blue-100 text-blue-700 mb-2">Senior</Badge>
              <p className="text-sm text-neutral-600">Experienced sales representatives</p>
              <div className="mt-3 text-[11px] text-neutral-400 font-mono">
                app.TerraTrail.com/invites/senior
              </div>
            </div>
            <div className="p-4 border border-neutral-200 rounded-md hover:border-neutral-300 transition-colors">
              <Badge className="bg-purple-100 text-purple-700 mb-2">Legend</Badge>
              <p className="text-sm text-neutral-600">Top-tier sales representatives</p>
              <div className="mt-3 text-[11px] text-neutral-400 font-mono">
                app.TerraTrail.com/invites/legend
              </div>
            </div>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
}
