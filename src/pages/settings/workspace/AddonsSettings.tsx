import { useState, useEffect, useRef } from "react";
import { Check, Lock, Loader2 } from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { api } from "../../../services/api";
import { toast } from "sonner";

const FREE_PLANS = ["FREE", "Free"];

function isPaid(plan: string | undefined): boolean {
  return !FREE_PLANS.includes(plan ?? "FREE");
}

export function AddonsSettings() {
  usePageTitle("Add-ons");
  const [ws, setWs] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Subdomain slug state
  const [slugInput, setSlugInput] = useState("");
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    api.workspaces.detail()
      .then((d: any) => {
        setWs(d);
        setSlugInput(d.slug ?? "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const currentPlan: string = ws?.billing_plan ?? "FREE";
  const available = isPaid(currentPlan);
  const currentSlug: string = ws?.slug ?? "";

  const handleSlugChange = (value: string) => {
    const clean = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSlugInput(clean);
    setSlugStatus("idle");

    if (!clean || clean === currentSlug) {
      setSlugStatus("idle");
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSlugStatus("checking");
      try {
        const res = await api.workspaces.checkSlug(clean);
        setSlugStatus(res.available ? "available" : "taken");
      } catch {
        setSlugStatus("idle");
      }
    }, 500);
  };

  const handleSave = async () => {
    if (!slugInput || slugInput === currentSlug) return;
    if (slugStatus === "taken") { toast.error("That subdomain is already taken."); return; }
    if (slugStatus === "checking") { toast.error("Still checking availability…"); return; }
    setSaving(true);
    try {
      const res = await api.workspaces.updateSlug(slugInput);
      setWs((prev: any) => ({ ...prev, slug: res.slug }));
      toast.success("Subdomain updated.");
      setSlugStatus("idle");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update subdomain.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-[#1a3d8f]" />
      </div>
    );
  }

  const subdomainUrl = available
    ? `${currentSlug}.terratrail.app`
    : `terratrail.app/${currentSlug}`;

  const isDirty = slugInput && slugInput !== currentSlug;
  const canSave = isDirty && slugStatus === "available" && !saving;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Current URL format */}
      <div className="bg-neutral-50 rounded-xl border border-neutral-200 px-5 py-4">
        <p className="text-[11.5px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
          Your public URL
        </p>
        <p className="text-[13.5px] font-semibold text-neutral-800 font-mono">
          {subdomainUrl}
        </p>
        {!available && (
          <p className="text-[11.5px] text-neutral-500 mt-1.5">
            Upgrade to Starter or above to use a subdomain format.
          </p>
        )}
      </div>

      {/* Custom subdomain addon */}
      <div className="bg-white rounded-lg border border-neutral-200 divide-y divide-neutral-200">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-neutral-900">Custom Subdomain</h3>
                {available ? (
                  <Badge className="bg-[#d6e0f5] text-[#0E2C72]">Available</Badge>
                ) : (
                  <Badge variant="secondary">
                    <Lock className="w-3 h-3 mr-1" />
                    Starter plan required
                  </Badge>
                )}
              </div>
              <p className="text-sm text-neutral-600">
                Branded subdomain (e.g. yourcompany.terratrail.app)
              </p>
              <p className="text-xs text-neutral-500 mt-1">Requires: Starter plan or above</p>
            </div>
            {!available && (
              <a
                href="/settings/billing"
                className="px-4 py-2 rounded-md text-sm font-medium bg-neutral-100 text-neutral-500 hover:bg-neutral-200 transition-colors"
              >
                Upgrade to Enable
              </a>
            )}
          </div>

          {available && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Subdomain
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={slugInput}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      placeholder={currentSlug}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a3d8f] focus:border-transparent pr-28"
                    />
                    {/* Availability badge */}
                    {slugInput && slugInput !== currentSlug && (
                      <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold ${
                        slugStatus === "checking" ? "text-neutral-400" :
                        slugStatus === "available" ? "text-green-600" :
                        slugStatus === "taken" ? "text-red-500" : "text-neutral-400"
                      }`}>
                        {slugStatus === "checking" && "Checking…"}
                        {slugStatus === "available" && "Available ✓"}
                        {slugStatus === "taken" && "Already taken ✗"}
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-neutral-500 whitespace-nowrap">.terratrail.app</span>
                </div>
                {slugInput === currentSlug && (
                  <p className="text-[11.5px] text-neutral-400 mt-1.5">
                    This is your current subdomain.
                  </p>
                )}
              </div>
              <button
                onClick={handleSave}
                disabled={!canSave}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  canSave
                    ? "bg-[#0E2C72] text-white hover:bg-[#0a2260]"
                    : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                }`}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {saving ? "Saving…" : "Save Configuration"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
