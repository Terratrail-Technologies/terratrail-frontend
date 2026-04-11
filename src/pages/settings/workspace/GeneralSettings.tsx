import { Upload, Check, AlertCircle } from "lucide-react";
import { workspace } from "../../../utils/mockData";
import { Badge } from "../../../components/ui/badge";

export function GeneralSettings() {
  return (
    <div className="max-w-3xl space-y-8">
      {/* Workspace Details */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-medium text-neutral-900">Workspace Details</h3>
            <p className="text-sm text-neutral-500 mt-1">Basic information about your workspace</p>
          </div>
          <Badge className="bg-amber-100 text-amber-700">
            <div className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              In Progress: 50%
            </div>
          </Badge>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Workspace Logo</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-emerald-600 rounded-lg flex items-center justify-center text-white text-xl font-semibold">
                T
              </div>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50 transition-colors">
                <Upload className="w-4 h-4" />
                Upload Logo
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Workspace Name</label>
            <input
              type="text"
              defaultValue={workspace.name}
              className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Workspace Slug</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-500">app.TerraTrail.com/</span>
              <input
                type="text"
                defaultValue={workspace.slug}
                className="flex-1 px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-medium text-neutral-900">Preferences</h3>
            <p className="text-sm text-neutral-500 mt-1">Configure workspace behavior and defaults</p>
          </div>
          <Badge variant="secondary">Incomplete: 25%</Badge>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Timezone</label>
            <select
              defaultValue={workspace.timezone}
              className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
              <option value="Africa/Accra">Africa/Accra (GMT)</option>
              <option value="Africa/Cairo">Africa/Cairo (EET)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Region</label>
            <select
              defaultValue={workspace.region}
              className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="Nigeria">Nigeria</option>
              <option value="Ghana">Ghana</option>
              <option value="Kenya">Kenya</option>
            </select>
          </div>

          <div className="flex items-start gap-3 pt-2">
            <input
              type="checkbox"
              id="initial-payment"
              className="mt-1 w-4 h-4 text-emerald-600 border-neutral-300 rounded focus:ring-emerald-500"
            />
            <div className="flex-1">
              <label htmlFor="initial-payment" className="text-sm font-medium text-neutral-700 cursor-pointer">
                Initial Payment Counts as First Month
              </label>
              <p className="text-xs text-neutral-500 mt-1">
                When enabled, the initial payment will be counted as the first month of installments
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="public-pages"
              defaultChecked
              className="mt-1 w-4 h-4 text-emerald-600 border-neutral-300 rounded focus:ring-emerald-500"
            />
            <div className="flex-1">
              <label htmlFor="public-pages" className="text-sm font-medium text-neutral-700 cursor-pointer">
                Create Estate Public Pages
              </label>
              <p className="text-xs text-neutral-500 mt-1">Controls sitemap inclusion for SEO</p>
              <div className="mt-2 text-xs text-emerald-600">
                https://app.TerraTrail.com/{workspace.slug}/estates
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Help Center */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-medium text-neutral-900">Help Center</h3>
            <p className="text-sm text-neutral-500 mt-1">Customer support configuration</p>
          </div>
          <Badge variant="secondary">Not Started</Badge>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Intercom App ID</label>
            <input
              type="text"
              placeholder="Connect in-app live chat to customer portal"
              className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">WhatsApp Number</label>
            <input
              type="text"
              placeholder="Include country code (e.g., +234)"
              className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            <p className="text-xs text-neutral-500 mt-1">Generates WhatsApp support link for customers</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Support Email</label>
            <input
              type="email"
              placeholder="support@yourcompany.com"
              className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="mb-6">
          <h3 className="font-medium text-neutral-900">Social Links</h3>
          <p className="text-sm text-neutral-500 mt-1">Connect your social media profiles</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Website URL</label>
            <input
              type="url"
              placeholder="https://yourwebsite.com"
              className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Instagram</label>
            <input
              type="text"
              placeholder="@yourhandle"
              className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
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
