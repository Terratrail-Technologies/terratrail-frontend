import { useState, useEffect } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../services/api";
import { usePageTitle } from "../../../hooks/usePageTitle";

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${checked ? "bg-emerald-500" : "bg-neutral-200"}`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

interface TriggerRow {
  key: string;
  label: string;
  recipients: string;
  channels?: string;
}

function NotifSection({ title, rows, values, onChange }: {
  title: string;
  rows: TriggerRow[];
  values: Record<string, boolean>;
  onChange: (key: string, val: boolean) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200">
      <div className="px-5 py-3.5 border-b border-neutral-100">
        <h3 className="font-semibold text-neutral-900 text-sm">{title}</h3>
      </div>
      <div className="divide-y divide-neutral-100">
        {rows.map((row) => (
          <div key={row.key} className="flex items-start justify-between gap-4 px-5 py-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-neutral-900">{row.label}</p>
              <p className="text-xs text-neutral-500 mt-0.5">
                Sent to: {row.recipients}
                {row.channels && <span className="ml-1.5 text-neutral-400">· {row.channels}</span>}
              </p>
            </div>
            <Toggle checked={!!values[row.key]} onChange={(v) => onChange(row.key, v)} />
          </div>
        ))}
      </div>
    </div>
  );
}

const SECTIONS: { title: string; rows: TriggerRow[] }[] = [
  {
    title: "Bookings",
    rows: [
      { key: "notify_customer_on_booking_status", label: "Booking Approved",        recipients: "Customer",             channels: "Email + SMS" },
      { key: "notify_booking_rejected",           label: "Booking Rejected",        recipients: "Customer",             channels: "Email + SMS" },
      { key: "notify_admin_on_new_booking",       label: "New Booking Submitted",   recipients: "Admin + Customer Rep", channels: "Email" },
    ],
  },
  {
    title: "Payments & Subscriptions",
    rows: [
      { key: "notify_customer_on_payment_receipt", label: "Payment Receipt Recorded",  recipients: "Admin + Assigned Customer Rep", channels: "Email + In-app" },
      { key: "notify_payment_approved",            label: "Payment Approved",          recipients: "Customer",                      channels: "Email + SMS" },
      { key: "notify_payment_rejected",            label: "Payment Rejected",          recipients: "Customer",                      channels: "Email + SMS" },
      { key: "notify_payment_reminder_7d",         label: "Payment Reminder — 7 days before", recipients: "Customer",              channels: "Email + SMS" },
      { key: "notify_payment_reminder_2d",         label: "Payment Reminder — 2 days before", recipients: "Customer",              channels: "Email + SMS" },
      { key: "notify_payment_due_today",           label: "Payment Due Today",         recipients: "Customer",                      channels: "Email + SMS" },
      { key: "notify_payment_overdue",             label: "Payment Overdue — 2 days after",   recipients: "Customer + Admin",      channels: "Email + SMS" },
      { key: "notify_subscription_completed",      label: "Subscription Completed",    recipients: "Customer + Admin",              channels: "Email + SMS" },
    ],
  },
  {
    title: "Properties",
    rows: [
      { key: "notify_property_published", label: "New Property Published", recipients: "All customers + All sales reps", channels: "Email" },
    ],
  },
  {
    title: "Realtors",
    rows: [
      { key: "notify_realtor_added",      label: "Realtor Added (Welcome)", recipients: "Realtor",  channels: "Email + SMS" },
      { key: "notify_commission_paid",    label: "Commission Paid",         recipients: "Realtor",  channels: "Email + SMS" },
    ],
  },
  {
    title: "Plot Allocation",
    rows: [
      { key: "notify_plot_allocated", label: "Plot Allocated", recipients: "Customer", channels: "Email + SMS" },
    ],
  },
];

export function EmailNotifications() {
  usePageTitle("Email Notifications");
  const [values,  setValues]  = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    api.workspaces.getSettings()
      .then((cfg: any) => {
        const defaults: Record<string, boolean> = {};
        SECTIONS.forEach((s) => s.rows.forEach((r) => { defaults[r.key] = true; }));
        setValues({ ...defaults, ...cfg });
      })
      .catch(() => {
        const defaults: Record<string, boolean> = {};
        SECTIONS.forEach((s) => s.rows.forEach((r) => { defaults[r.key] = true; }));
        setValues(defaults);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key: string, val: boolean) =>
    setValues((prev) => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.workspaces.updateSettings(values);
      toast.success("Notification preferences saved.");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-7 h-7 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">Email Notifications</h2>
        <p className="text-sm text-neutral-500 mt-1">
          Control which automated emails and SMS are sent. Each trigger is independently toggleable.
          Turning one off disables both Email and SMS for that trigger.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-[12.5px] text-amber-700 leading-relaxed">
        Already-queued reminders for today's system check are not cancelled retroactively when a trigger is turned off.
      </div>

      {SECTIONS.map((section) => (
        <NotifSection
          key={section.title}
          title={section.title}
          rows={section.rows}
          values={values}
          onChange={handleChange}
        />
      ))}

      <div className="flex justify-end pb-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-60 transition-colors text-sm font-semibold shadow-sm shadow-emerald-200"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
