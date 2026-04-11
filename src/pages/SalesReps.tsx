import { Link2, Settings, TrendingUp } from "lucide-react";
import { salesReps, dashboardStats } from "../utils/mockData";
import { Badge } from "../components/ui/badge";

export function SalesReps() {
  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString("en-NG")}`;
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "Legend":
        return "bg-purple-100 text-purple-700 hover:bg-purple-100";
      case "Senior":
        return "bg-blue-100 text-blue-700 hover:bg-blue-100";
      case "Starter":
        return "bg-neutral-100 text-neutral-700 hover:bg-neutral-100";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Sales Representatives</h1>
            <p className="text-sm text-neutral-500 mt-1">Sales agent and commission tracking</p>
          </div>
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50 transition-colors">
              <Link2 className="w-4 h-4" />
              Open Invite Links
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50 transition-colors">
              <Settings className="w-4 h-4" />
              Commission Settings
            </button>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Summary Metrics */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-neutral-500 mb-1">Pending to Earn</div>
                <div className="text-3xl font-semibold text-neutral-900">
                  {formatCurrency(dashboardStats.commission.pendingPayouts)}
                </div>
                <div className="text-xs text-amber-600 mt-2">From unpaid referral payments</div>
              </div>
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-neutral-500 mb-1">Total Earned</div>
                <div className="text-3xl font-semibold text-neutral-900">
                  {formatCurrency(
                    dashboardStats.commission.payouts + dashboardStats.commission.pendingPayouts
                  )}
                </div>
                <div className="text-xs text-neutral-500 mt-2">Paid + pending payout</div>
              </div>
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-neutral-500 mb-1">Total Earning Potential</div>
                <div className="text-3xl font-semibold text-neutral-900">
                  {formatCurrency(dashboardStats.commission.potentialReferralPayments)}
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
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200">
            <h3 className="font-medium text-neutral-900">All Sales Representatives</h3>
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
                {salesReps.map((rep) => (
                  <tr key={rep.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-neutral-900">{rep.name}</div>
                        <div className="text-sm text-neutral-500">{rep.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getTierColor(rep.tier)}>{rep.tier}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-mono text-sm text-neutral-900">{rep.referralCode}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        <span className="font-medium text-neutral-900">{rep.referrals}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-neutral-900">{formatCurrency(rep.totalEarned)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-amber-600">{formatCurrency(rep.pendingPayout)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button className="p-2 hover:bg-neutral-100 rounded-md transition-colors" title="View Details">
                        <Settings className="w-4 h-4 text-neutral-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sales Rep Tiers Info */}
        <div className="mt-8 bg-white rounded-lg border border-neutral-200 p-6">
          <h3 className="font-medium text-neutral-900 mb-4">Sales Rep Tiers</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 border border-neutral-200 rounded-md">
              <Badge className="bg-neutral-100 text-neutral-700 mb-2">Starter</Badge>
              <p className="text-sm text-neutral-600">Entry-level sales representatives</p>
              <div className="mt-3 text-xs text-neutral-500">
                Invite link: app.TerraTrail.com/invites/starter-token
              </div>
            </div>
            <div className="p-4 border border-neutral-200 rounded-md">
              <Badge className="bg-blue-100 text-blue-700 mb-2">Senior</Badge>
              <p className="text-sm text-neutral-600">Experienced sales representatives</p>
              <div className="mt-3 text-xs text-neutral-500">
                Invite link: app.TerraTrail.com/invites/senior-token
              </div>
            </div>
            <div className="p-4 border border-neutral-200 rounded-md">
              <Badge className="bg-purple-100 text-purple-700 mb-2">Legend</Badge>
              <p className="text-sm text-neutral-600">Top-tier sales representatives</p>
              <div className="mt-3 text-xs text-neutral-500">
                Invite link: app.TerraTrail.com/invites/legend-token
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
