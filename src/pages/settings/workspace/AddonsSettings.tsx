import { ChevronDown, Check, Lock } from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { usePageTitle } from "../../../hooks/usePageTitle";

const addons = [
  {
    id: "subdomain",
    name: "Custom Subdomain",
    description: "Branded subdomain (e.g. yourcompany.Terratrail.com)",
    requirement: "Starter plan or above",
    available: true,
  },
];

export function AddonsSettings() {
  usePageTitle("Add-ons");
  return (
    <div className="max-w-3xl space-y-6">
      <div className="bg-white rounded-lg border border-neutral-200 divide-y divide-neutral-200">
        {addons.map((addon) => (
          <div key={addon.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-neutral-900">{addon.name}</h3>
                  {addon.available ? (
                    <Badge className="bg-[#d6e0f5] text-[#0E2C72]">Available</Badge>
                  ) : (
                    <Badge variant="secondary">
                      <Lock className="w-3 h-3 mr-1" />
                      Locked
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-neutral-600">{addon.description}</p>
                <p className="text-xs text-neutral-500 mt-1">Requires: {addon.requirement}</p>
              </div>
              <button
                disabled={!addon.available}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  addon.available
                    ? "bg-[#0E2C72] text-white hover:bg-[#0a2260]"
                    : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                }`}
              >
                {addon.available ? "Configure" : "Upgrade to Enable"}
              </button>
            </div>

            {addon.available && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-neutral-600 hover:text-neutral-900 flex items-center gap-2">
                  <ChevronDown className="w-4 h-4" />
                  Configuration
                </summary>
                <div className="mt-4 pl-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Subdomain</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="yourcompany"
                        className="flex-1 px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a3d8f] focus:border-transparent"
                      />
                      <span className="text-sm text-neutral-500">.Terratrail.com</span>
                    </div>
                  </div>
                  <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#0E2C72] text-white rounded-md hover:bg-[#0a2260] transition-colors">
                    <Check className="w-4 h-4" />
                    Save Configuration
                  </button>
                </div>
              </details>
            )}
          </div>
        ))}
      </div>

      {!addons.some((a) => a.available) && (
        <div className="bg-neutral-50 rounded-lg border border-neutral-200 p-8 text-center">
          <Lock className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
          <h3 className="font-medium text-neutral-900 mb-2">No add-ons available</h3>
          <p className="text-sm text-neutral-500 mb-4">Upgrade your plan to unlock additional features</p>
          <button className="px-4 py-2 bg-[#0E2C72] text-white rounded-md hover:bg-[#0a2260] transition-colors">
            View Plans
          </button>
        </div>
      )}
    </div>
  );
}


