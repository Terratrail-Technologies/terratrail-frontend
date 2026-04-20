import { useState, useEffect } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, type User } from "../../services/api";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { usePageTitle } from "../../hooks/usePageTitle";

const inputCls =
  "w-full px-4 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed";
const labelCls = "block text-sm font-medium text-neutral-700 mb-1.5";
const selectCls =
  "w-full px-4 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white";

export function AccountSettings() {
  usePageTitle("Account Settings");
  const { user: cachedUser, initials, refresh } = useCurrentUser();

  const [form, setForm] = useState<Partial<User & { password?: string }>>({});
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);

  // Populate form from live /auth/me/
  useEffect(() => {
    api.auth.me()
      .then((u) => {
        setForm({
          first_name:    u.first_name  ?? "",
          last_name:     u.last_name   ?? "",
          email:         u.email       ?? "",
          phone:         u.phone       ?? "",
          title:         u.title       ?? "",
          gender:        u.gender      ?? "",
          date_of_birth: u.date_of_birth ?? "",
          occupation:    u.occupation  ?? "",
          address:       u.address     ?? "",
          country:       u.country     ?? "Nigeria",
          state:         u.state       ?? "",
        });
      })
      .catch(() => {
        if (cachedUser) setForm(cachedUser as any);
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const { password, email, ...payload } = form;
      // Don't send email (read-only) or empty password
      const data: any = { ...payload };
      if (password && password.trim()) data.password = password;
      await api.auth.updateMe(data);
      await refresh();
      toast.success("Profile updated successfully.");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save changes.");
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

  // Completion score — count filled optional fields
  const optionalFields = ["phone", "title", "gender", "date_of_birth", "occupation", "address", "state"] as const;
  const filled = optionalFields.filter((k) => !!(form as any)[k]).length;
  const pct = Math.round((filled / optionalFields.length) * 100);

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="bg-white border-b border-neutral-200 px-8 py-4">
        <h1 className="text-2xl font-semibold text-neutral-900">Account Settings</h1>
        <p className="text-sm text-neutral-500 mt-1">Manage your personal account information</p>
      </div>

      <div className="p-8">
        <div className="max-w-3xl space-y-8">
          {/* Avatar */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <h3 className="font-medium text-neutral-900 mb-4">Your Avatar</h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white text-xl font-semibold select-none">
                {initials}
              </div>
              <div className="text-sm text-neutral-500">Avatar auto-generated from your name.</div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-medium text-neutral-900">Personal Information</h3>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${pct >= 80 ? "bg-emerald-50 text-emerald-700" : pct >= 40 ? "bg-amber-50 text-amber-700" : "bg-neutral-100 text-neutral-500"}`}>
                {pct}% complete
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>Title</label>
                <select className={selectCls} value={form.title ?? ""} onChange={set("title")}>
                  <option value="">Select…</option>
                  {["MR", "MRS", "MS", "DR", "PROF"].map((t) => (
                    <option key={t} value={t}>{t[0] + t.slice(1).toLowerCase()}.</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>First Name</label>
                <input className={inputCls} value={form.first_name ?? ""} onChange={set("first_name")} placeholder="John" />
              </div>

              <div>
                <label className={labelCls}>Last Name</label>
                <input className={inputCls} value={form.last_name ?? ""} onChange={set("last_name")} placeholder="Doe" />
              </div>

              <div>
                <label className={labelCls}>Email <span className="text-neutral-400 font-normal">(read-only)</span></label>
                <input className={inputCls} value={form.email ?? ""} disabled type="email" />
              </div>

              <div>
                <label className={labelCls}>Phone</label>
                <input className={inputCls} value={form.phone ?? ""} onChange={set("phone")} placeholder="+234 800 000 0000" type="tel" />
              </div>

              <div>
                <label className={labelCls}>Gender</label>
                <select className={selectCls} value={form.gender ?? ""} onChange={set("gender")}>
                  <option value="">Select…</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className={labelCls}>Date of Birth</label>
                <input className={inputCls} value={form.date_of_birth ?? ""} onChange={set("date_of_birth")} type="date" />
              </div>

              <div>
                <label className={labelCls}>Occupation</label>
                <input className={inputCls} value={form.occupation ?? ""} onChange={set("occupation")} placeholder="e.g. Estate Manager" />
              </div>

              <div className="col-span-full">
                <label className={labelCls}>Address</label>
                <input className={inputCls} value={form.address ?? ""} onChange={set("address")} placeholder="Enter your address" />
              </div>

              <div>
                <label className={labelCls}>Country</label>
                <select className={selectCls} value={form.country ?? "Nigeria"} onChange={set("country")}>
                  <option>Nigeria</option>
                  <option>Ghana</option>
                  <option>Kenya</option>
                </select>
              </div>

              <div>
                <label className={labelCls}>State</label>
                <input className={inputCls} value={form.state ?? ""} onChange={set("state")} placeholder="e.g. Lagos" />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
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

          {/* Change Password */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <h3 className="font-medium text-neutral-900 mb-5">Change Password</h3>
            <div className="max-w-sm space-y-4">
              <div>
                <label className={labelCls}>New Password</label>
                <input
                  type="password"
                  className={inputCls}
                  placeholder="At least 8 characters"
                  value={form.password ?? ""}
                  onChange={set("password" as any)}
                />
              </div>
              <button
                onClick={handleSave}
                disabled={saving || !form.password}
                className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-60 transition-colors text-sm font-medium"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Update Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
