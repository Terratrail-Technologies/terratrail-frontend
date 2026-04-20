import { useState, useEffect } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../services/api";
import { usePageTitle } from "../../../hooks/usePageTitle";

const inputCls =
  "w-full px-4 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent";
const labelCls = "block text-sm font-medium text-neutral-700 mb-1.5";

export function GeneralSettings() {
  usePageTitle("General Settings");
  const [ws,      setWs]      = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    Promise.all([api.workspaces.detail(), api.workspaces.getSettings()])
      .then(([detail, cfg]) => { setWs(detail); setSettings(cfg); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const setWsField  = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setWs((p: any) => ({ ...p, [k]: e.target.value }));
  const setCfgField = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setSettings((p: any) => ({ ...p, [k]: e.target.checked }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const detailPayload: any = {};
      if (ws?.name)              detailPayload.name             = ws.name;
      if (ws?.timezone)          detailPayload.timezone         = ws.timezone;
      if (ws?.region)            detailPayload.region           = ws.region;
      if (ws?.support_email)     detailPayload.support_email    = ws.support_email;
      if (ws?.support_whatsapp)  detailPayload.support_whatsapp = ws.support_whatsapp;

      await api.workspaces.updateDetail(detailPayload);

      if (settings) {
        await api.workspaces.updateSettings({
          can_reps_approve_bookings:      settings.can_reps_approve_bookings,
          can_reps_manage_subscriptions:  settings.can_reps_manage_subscriptions,
          notify_customer_on_booking_status: settings.notify_customer_on_booking_status,
          notify_admin_on_new_booking:    settings.notify_admin_on_new_booking,
          notify_customer_on_payment_receipt: settings.notify_customer_on_payment_receipt,
        });
      }

      toast.success("Workspace settings saved.");
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
    <div className="max-w-3xl space-y-8">
      {/* Workspace Details */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h3 className="font-medium text-neutral-900 mb-1">Workspace Details</h3>
        <p className="text-sm text-neutral-500 mb-6">Basic information about your workspace</p>

        <div className="space-y-4">
          <div>
            <label className={labelCls}>Workspace Name</label>
            <input
              className={inputCls}
              value={ws?.name ?? ""}
              onChange={setWsField("name")}
              placeholder="My Estate Company"
            />
          </div>

          <div>
            <label className={labelCls}>Workspace Slug <span className="text-neutral-400 font-normal">(read-only)</span></label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-400">app.terratrail.com/</span>
              <input
                className={inputCls + " flex-1 bg-neutral-50 text-neutral-500 cursor-not-allowed"}
                value={ws?.slug ?? ""}
                disabled
                readOnly
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h3 className="font-medium text-neutral-900 mb-1">Preferences</h3>
        <p className="text-sm text-neutral-500 mb-6">Workspace timezone and region</p>

        <div className="space-y-4">
          <div>
            <label className={labelCls}>Timezone</label>
            <select className={inputCls} value={ws?.timezone ?? "Africa/Lagos"} onChange={setWsField("timezone")}>
              <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
              <option value="Africa/Accra">Africa/Accra (GMT)</option>
              <option value="Africa/Cairo">Africa/Cairo (EET)</option>
              <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
            </select>
          </div>

          <div>
            <label className={labelCls}>Region</label>
            <select className={inputCls} value={ws?.region ?? "Nigeria"} onChange={setWsField("region")}>
              <option value="Nigeria">Nigeria</option>
              <option value="Ghana">Ghana</option>
              <option value="Kenya">Kenya</option>
            </select>
          </div>
        </div>
      </div>

      {/* Support / Help Center */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h3 className="font-medium text-neutral-900 mb-1">Help Center</h3>
        <p className="text-sm text-neutral-500 mb-6">Customer support channels for your portal</p>

        <div className="space-y-4">
          <div>
            <label className={labelCls}>WhatsApp Number</label>
            <input
              className={inputCls}
              value={ws?.support_whatsapp ?? ""}
              onChange={setWsField("support_whatsapp")}
              placeholder="+234 800 000 0000"
              type="tel"
            />
          </div>

          <div>
            <label className={labelCls}>Support Email</label>
            <input
              className={inputCls}
              value={ws?.support_email ?? ""}
              onChange={setWsField("support_email")}
              placeholder="support@yourcompany.com"
              type="email"
            />
          </div>
        </div>
      </div>

      {/* Notification Toggles */}
      {settings && (
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <h3 className="font-medium text-neutral-900 mb-1">Notification Settings</h3>
          <p className="text-sm text-neutral-500 mb-6">Control automated emails sent by the platform</p>

          <div className="space-y-4">
            {[
              { key: "notify_customer_on_booking_status",    label: "Notify customer on booking status change" },
              { key: "notify_admin_on_new_booking",          label: "Notify admin on new booking" },
              { key: "notify_customer_on_payment_receipt",   label: "Notify customer on payment receipt" },
              { key: "can_reps_approve_bookings",            label: "Allow reps to approve bookings" },
              { key: "can_reps_manage_subscriptions",        label: "Allow reps to manage subscriptions" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-emerald-600 border-neutral-300 rounded focus:ring-emerald-500"
                  checked={!!settings[key]}
                  onChange={setCfgField(key)}
                />
                <span className="text-sm text-neutral-700 group-hover:text-neutral-900">{label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-60 transition-colors text-sm font-medium"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
