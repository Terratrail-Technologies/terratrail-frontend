import { useState, useEffect } from "react";
import { Check, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../services/api";
import { usePageTitle } from "../../../hooks/usePageTitle";

function Toggle({ checked, disabled, onChange }: { checked: boolean; disabled?: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
      } ${checked ? "bg-[#1a3d8f]" : "bg-neutral-200"}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export function PermissionsSettings() {
  usePageTitle("Permissions");
  const [settings, setSettings] = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    api.workspaces.getSettings()
      .then(setSettings)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (key: string, value: boolean) => {
    setSettings((prev: any) => {
      const next = { ...prev, [key]: value };
      // Cascade: turning off approve_bookings also turns off manage_subscriptions
      if (key === "can_reps_approve_bookings" && !value) {
        next.can_reps_manage_subscriptions = false;
      }
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.workspaces.updateSettings({
        can_reps_approve_bookings:      settings.can_reps_approve_bookings,
        can_reps_manage_subscriptions:  settings.can_reps_manage_subscriptions,
        can_reps_manage_sales_reps:     settings.can_reps_manage_sales_reps,
      });
      toast.success("Permissions saved. Changes take effect immediately.");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save permissions.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-7 h-7 animate-spin text-[#1a3d8f]" />
      </div>
    );
  }

  const approveBookings     = !!settings?.can_reps_approve_bookings;
  const manageSubscriptions = !!settings?.can_reps_manage_subscriptions;
  const manageSalesReps     = !!settings?.can_reps_manage_sales_reps;

  const PERMISSIONS = [
    {
      key:   "can_reps_approve_bookings",
      value: approveBookings,
      title: "Allow Customer Representatives to Approve / Reject Bookings",
      desc:  "Customer reps can approve or reject booking requests — the same permission as admin for that specific action. When ON, reps see Approve and Reject buttons on pending bookings assigned to them.",
      locked: false,
      lockReason: null,
    },
    {
      key:   "can_reps_manage_subscriptions",
      value: manageSubscriptions,
      title: "Allow Customer Representatives to Manage Subscriptions",
      desc:  "Customer reps can record payments, approve payment receipts, view installment schedules, and update customer profiles.",
      locked: !approveBookings,
      lockReason: 'Enable "Approve/Reject Bookings" above to unlock this permission.',
    },
    {
      key:   "can_reps_manage_sales_reps",
      value: manageSalesReps,
      title: "Allow Customer Representatives to Manage Sales Reps and Commission",
      desc:  "Customer reps can access the Sales Reps module, add / edit / deactivate realtors, view commissions, and mark commissions as paid.",
      locked: false,
      lockReason: null,
    },
  ];

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">Permissions</h2>
        <p className="text-sm text-neutral-500 mt-1">
          Control what customer representatives can do. Settings apply to every customer rep simultaneously and take effect immediately.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100">
        {PERMISSIONS.map((perm) => (
          <div key={perm.key} className="flex items-start gap-4 p-5">
            <div className="flex-1">
              <p className={`text-sm font-semibold mb-1 ${perm.locked ? "text-neutral-400" : "text-neutral-900"}`}>
                {perm.title}
              </p>
              <p className={`text-sm leading-relaxed ${perm.locked ? "text-neutral-400" : "text-neutral-600"}`}>
                {perm.desc}
              </p>
              {perm.locked && perm.lockReason && (
                <div className="mt-2 flex items-start gap-1.5 text-[12px] text-amber-600 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  {perm.lockReason}
                </div>
              )}
            </div>
            <div className="pt-0.5 shrink-0">
              <Toggle
                checked={perm.value}
                disabled={perm.locked}
                onChange={(v) => set(perm.key, v)}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-[12.5px] text-blue-700 leading-relaxed">
        Owner and Admin roles are never affected by these permission settings — they always retain full access.
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || !settings}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0E2C72] text-white rounded-xl hover:bg-[#0a2260] disabled:opacity-60 transition-colors text-sm font-semibold shadow-sm shadow-[#0E2C72]/20"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}


