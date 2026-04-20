import { useState } from "react";
import { Check, AlertCircle } from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { usePageTitle } from "../../../hooks/usePageTitle";

export function PermissionsSettings() {
  usePageTitle("Permissions");
  const [approveBookings, setApproveBookings] = useState(false);
  const [manageSubscriptions, setManageSubscriptions] = useState(false);
  const [manageSalesReps, setManageSalesReps] = useState(false);

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-neutral-900">Permissions</h2>
          <p className="text-sm text-neutral-500 mt-1">
            Control what customer reps and other roles can do in this workspace
          </p>
        </div>
        <Badge variant="secondary">Not Started</Badge>
      </div>

      {/* Customer Representatives Permissions */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6 space-y-6">
        <h3 className="font-medium text-neutral-900">Customer Representatives Permissions</h3>

        <div className="space-y-6">
          {/* Permission 1 */}
          <div className="flex items-start gap-4">
            <input
              type="checkbox"
              id="approve-bookings"
              checked={approveBookings}
              onChange={(e) => {
                setApproveBookings(e.target.checked);
                if (!e.target.checked) {
                  setManageSubscriptions(false);
                }
              }}
              className="mt-1 w-4 h-4 text-emerald-600 border-neutral-300 rounded focus:ring-emerald-500"
            />
            <div className="flex-1">
              <label htmlFor="approve-bookings" className="font-medium text-neutral-900 cursor-pointer">
                Allow Customer Representatives to Approve/Reject Bookings
              </label>
              <p className="text-sm text-neutral-600 mt-1">
                Customer reps can approve or reject bookings (same as admin for that action)
              </p>
            </div>
          </div>

          {/* Permission 2 - Dependent */}
          <div className="flex items-start gap-4">
            <input
              type="checkbox"
              id="manage-subscriptions"
              checked={manageSubscriptions}
              onChange={(e) => setManageSubscriptions(e.target.checked)}
              disabled={!approveBookings}
              className="mt-1 w-4 h-4 text-emerald-600 border-neutral-300 rounded focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div className="flex-1">
              <label
                htmlFor="manage-subscriptions"
                className={`font-medium cursor-pointer ${
                  approveBookings ? "text-neutral-900" : "text-neutral-400"
                }`}
              >
                Allow Customer Representatives to Manage Subscriptions
              </label>
              <p className={`text-sm mt-1 ${approveBookings ? "text-neutral-600" : "text-neutral-400"}`}>
                Requires "Approve/Reject Bookings" to be enabled first
              </p>
              {!approveBookings && (
                <div className="mt-2 flex items-start gap-2 text-xs text-amber-600">
                  <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>This permission is locked until the parent permission is enabled</span>
                </div>
              )}
            </div>
          </div>

          {/* Permission 3 */}
          <div className="flex items-start gap-4">
            <input
              type="checkbox"
              id="manage-sales-reps"
              checked={manageSalesReps}
              onChange={(e) => setManageSalesReps(e.target.checked)}
              className="mt-1 w-4 h-4 text-emerald-600 border-neutral-300 rounded focus:ring-emerald-500"
            />
            <div className="flex-1">
              <label htmlFor="manage-sales-reps" className="font-medium text-neutral-900 cursor-pointer">
                Allow Customer Representatives to Manage Sales Reps and Commission
              </label>
              <p className="text-sm text-neutral-600 mt-1">
                Customer reps can see all sales representatives and manage them (same permission as admin for
                sales-reps area)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors">
          <Check className="w-4 h-4" />
          Save Changes
        </button>
      </div>
    </div>
  );
}
