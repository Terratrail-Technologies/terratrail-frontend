import { useState, useEffect, useRef } from "react";
import { Check, Loader2, Upload, X, Globe, Instagram, Facebook, Twitter, Linkedin, Youtube, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../services/api";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { BASE_URL } from "../../../services/api";

const inputCls =
  "w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3d8f] focus:border-transparent bg-white transition-colors";
const labelCls = "block text-sm font-semibold text-neutral-700 mb-1.5";

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-[#1a3d8f]" : "bg-neutral-200"}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`}
      />
    </button>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6">
      <h3 className="font-semibold text-neutral-900 mb-0.5">{title}</h3>
      {description && <p className="text-sm text-neutral-500 mb-5">{description}</p>}
      {!description && <div className="mb-5" />}
      {children}
    </div>
  );
}

export function GeneralSettings() {
  usePageTitle("General Settings");
  const [ws,       setWs]       = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile,    setLogoFile]    = useState<File | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([api.workspaces.detail(), api.workspaces.getSettings()])
      .then(([detail, cfg]) => { setWs(detail); setSettings(cfg); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const setWsField = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setWs((p: any) => ({ ...p, [k]: e.target.value }));

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Logo must be under 2 MB"); return; }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Logo upload if changed
      if (logoFile) {
        const fd = new FormData();
        fd.append("logo", logoFile);
        await (api.workspaces as any).uploadLogo?.(fd) ?? api.workspaces.updateDetail({ logo: logoFile });
      }

      // 2. Workspace detail fields
      await api.workspaces.updateDetail({
        name:                           ws?.name,
        timezone:                       ws?.timezone,
        region:                         ws?.region,
        support_email:                  ws?.support_email,
        support_whatsapp:               ws?.support_whatsapp,
        intercom_app_id:                ws?.intercom_app_id,
        initial_payment_as_first_month: ws?.initial_payment_as_first_month,
        create_estate_public_pages:     ws?.create_estate_public_pages,
        website_url:                    ws?.website_url ?? "",
        instagram_url:                  ws?.instagram_url ?? "",
        facebook_url:                   ws?.facebook_url ?? "",
        twitter_url:                    ws?.twitter_url ?? "",
        linkedin_url:                   ws?.linkedin_url ?? "",
        youtube_url:                    ws?.youtube_url ?? "",
      });

      // 3. Workspace settings (permissions / notifications handled in their own pages)
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
      setLogoFile(null);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save.");
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

  const publicSlug = ws?.slug ?? "";
  const publicUrl  = publicSlug ? `https://terra-trail.vercel.app/${publicSlug}/estates` : null;
  const currentLogoUrl = logoPreview ?? (ws?.logo ? `${BASE_URL.replace("/api/v1", "")}${ws.logo}` : null);

  return (
    <div className="max-w-3xl space-y-6">

      {/* ── 1. Workspace Details ──────────────────────────────────────────── */}
      <Section title="Workspace Details" description="Your company identity across the platform and public pages.">
        {/* Logo upload */}
        <div className="mb-5">
          <label className={labelCls}>Logo</label>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl border-2 border-dashed border-neutral-200 flex items-center justify-center overflow-hidden bg-neutral-50 shrink-0">
              {currentLogoUrl ? (
                <img src={currentLogoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Upload className="w-5 h-5 text-neutral-300" />
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                {currentLogoUrl ? "Change logo" : "Upload logo"}
              </button>
              {logoFile && (
                <button
                  type="button"
                  onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                  className="ml-2 inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
                >
                  <X className="w-3 h-3" /> Remove
                </button>
              )}
              <p className="text-xs text-neutral-400 mt-1">PNG, JPG, SVG · Max 2 MB</p>
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelCls}>Workspace Name</label>
            <input className={inputCls} value={ws?.name ?? ""} onChange={setWsField("name")} placeholder="My Estate Company" />
          </div>
          <div>
            <label className={labelCls}>Workspace Slug <span className="text-neutral-400 font-normal">(read-only)</span></label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-400 shrink-0">app.terratrail.com/</span>
              <input className={inputCls + " bg-neutral-50 text-neutral-500 cursor-not-allowed"} value={ws?.slug ?? ""} disabled readOnly />
            </div>
            <p className="text-xs text-neutral-400 mt-1">Contact support to change your slug.</p>
          </div>
        </div>
      </Section>

      {/* ── 2. Preferences ────────────────────────────────────────────────── */}
      <Section title="Preferences" description="Timezone, region, and workspace behavior settings.">
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Timezone</label>
            <select className={inputCls} value={ws?.timezone ?? "Africa/Lagos"} onChange={setWsField("timezone")}>
              <option value="Africa/Lagos">Africa/Lagos (WAT, UTC+1)</option>
              <option value="Africa/Accra">Africa/Accra (GMT, UTC+0)</option>
              <option value="Africa/Cairo">Africa/Cairo (EET, UTC+2)</option>
              <option value="Africa/Nairobi">Africa/Nairobi (EAT, UTC+3)</option>
              <option value="Africa/Johannesburg">Africa/Johannesburg (SAST, UTC+2)</option>
              <option value="Europe/London">Europe/London (GMT/BST)</option>
              <option value="America/New_York">America/New_York (EST/EDT)</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Region</label>
            <select className={inputCls} value={ws?.region ?? "Nigeria"} onChange={setWsField("region")}>
              <option value="Nigeria">Nigeria</option>
              <option value="Ghana">Ghana</option>
              <option value="Kenya">Kenya</option>
              <option value="South Africa">South Africa</option>
              <option value="United Kingdom">United Kingdom</option>
            </select>
          </div>

          <div className="pt-2 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-neutral-900">Initial Payment Counts as First Month</p>
                <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                  When ON, the initial payment counts as installment month 1 and the remaining balance is spread over (duration − 1) months.
                </p>
              </div>
              <Toggle
                checked={!!ws?.initial_payment_as_first_month}
                onChange={(v) => setWs((p: any) => ({ ...p, initial_payment_as_first_month: v }))}
              />
            </div>

            <div className="flex items-start justify-between gap-4 pt-3 border-t border-neutral-100">
              <div>
                <p className="text-sm font-semibold text-neutral-900">Create Estate Public Pages</p>
                <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                  When ON, your estate listing and all published property pages are publicly accessible and indexed by search engines.
                </p>
                {ws?.create_estate_public_pages && publicUrl && (
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[#0E2C72] hover:text-[#0a2260] mt-1.5 font-medium"
                  >
                    <ExternalLink className="w-3 h-3" /> {publicUrl}
                  </a>
                )}
                {!ws?.create_estate_public_pages && (
                  <p className="text-xs text-amber-600 mt-1.5 font-medium">
                    ⚠ Your public estate pages are hidden. Customers cannot view or book online.
                  </p>
                )}
              </div>
              <Toggle
                checked={!!ws?.create_estate_public_pages}
                onChange={(v) => setWs((p: any) => ({ ...p, create_estate_public_pages: v }))}
              />
            </div>
          </div>
        </div>
      </Section>

      {/* ── 3. Help Center ────────────────────────────────────────────────── */}
      <Section title="Help Center" description="Support channels shown on your public estate page and customer portal.">
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Support Email</label>
            <input
              className={inputCls}
              value={ws?.support_email ?? ""}
              onChange={setWsField("support_email")}
              placeholder="support@yourcompany.com"
              type="email"
            />
            <p className="text-xs text-neutral-400 mt-1">Used as the reply-to address on all outbound notification emails.</p>
          </div>
          <div>
            <label className={labelCls}>WhatsApp Number</label>
            <input
              className={inputCls}
              value={ws?.support_whatsapp ?? ""}
              onChange={setWsField("support_whatsapp")}
              placeholder="+2348012345678"
              type="tel"
            />
            <p className="text-xs text-neutral-400 mt-1">Include country code. Generates a clickable WhatsApp link on your portal.</p>
          </div>
          <div>
            <label className={labelCls}>Intercom App ID <span className="text-neutral-400 font-normal">(optional)</span></label>
            <input
              className={inputCls}
              value={ws?.intercom_app_id ?? ""}
              onChange={setWsField("intercom_app_id")}
              placeholder="ecahpwf5"
            />
            <p className="text-xs text-neutral-400 mt-1">Found in your Intercom dashboard URL. Enables live chat on your customer portal.</p>
          </div>

          {/* Live preview */}
          {(ws?.support_email || ws?.support_whatsapp) && (
            <div className="mt-2 rounded-lg bg-neutral-50 border border-neutral-100 px-4 py-3">
              <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide mb-1.5">Customer portal preview</p>
              <div className="flex items-center gap-3 text-sm text-neutral-600 flex-wrap">
                {ws?.support_whatsapp && <span className="flex items-center gap-1.5">💬 WhatsApp Us</span>}
                {ws?.support_email && <span className="flex items-center gap-1.5">📧 {ws.support_email}</span>}
                {ws?.intercom_app_id && <span className="flex items-center gap-1.5">🟦 Chat with us</span>}
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* ── 4. Social Links ────────────────────────────────────────────────── */}
      <Section title="Social Links" description="Shown in the footer of your public estate page and customer portal.">
        <div className="space-y-3">
          {[
            { key: "website_url",   icon: Globe,      label: "Website",    placeholder: "https://yourcompany.com" },
            { key: "instagram_url", icon: Instagram,  label: "Instagram",  placeholder: "https://instagram.com/yourhandle" },
            { key: "facebook_url",  icon: Facebook,   label: "Facebook",   placeholder: "https://facebook.com/yourpage" },
            { key: "twitter_url",   icon: Twitter,    label: "Twitter / X",placeholder: "https://twitter.com/yourhandle" },
            { key: "linkedin_url",  icon: Linkedin,   label: "LinkedIn",   placeholder: "https://linkedin.com/company/yourcompany" },
            { key: "youtube_url",   icon: Youtube,    label: "YouTube",    placeholder: "https://youtube.com/yourchannel" },
          ].map(({ key, icon: Icon, label, placeholder }) => (
            <div key={key} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-neutral-50 border border-neutral-200 flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-neutral-500" />
              </div>
              <div className="flex-1">
                <input
                  className={inputCls}
                  value={(ws as any)?.[key] ?? ""}
                  onChange={setWsField(key)}
                  placeholder={placeholder}
                  type="url"
                />
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-neutral-400 mt-3">Only populated fields are shown publicly. All links open in a new tab.</p>
      </Section>

      <div className="flex justify-end pb-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0E2C72] text-white rounded-xl hover:bg-[#0a2260] disabled:opacity-60 transition-colors text-sm font-semibold shadow-sm shadow-[#0E2C72]/20"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}


