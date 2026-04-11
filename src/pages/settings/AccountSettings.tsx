import { Upload, Check, AlertCircle } from "lucide-react";
import { Badge } from "../../components/ui/badge";

export function AccountSettings() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-8 py-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Account Settings</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage your personal account information</p>
        </div>
      </div>

      <div className="p-8">
        <div className="max-w-3xl space-y-8">
          {/* Avatar Section */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <h3 className="font-medium text-neutral-900 mb-4">Your Avatar</h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white text-xl font-semibold">
                PA
              </div>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50 transition-colors">
                <Upload className="w-4 h-4" />
                Change Avatar
              </button>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-medium text-neutral-900">Your Personal Information</h3>
              <Badge className="bg-amber-100 text-amber-700">
                <div className="flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Incomplete: 17%
                </div>
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Title</label>
                <select className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                  <option>Mr.</option>
                  <option>Mrs.</option>
                  <option>Ms.</option>
                  <option>Dr.</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Full Name (Surname Last)</label>
                <input
                  type="text"
                  defaultValue="Praise Adebayo"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Email</label>
                <input
                  type="email"
                  defaultValue="praise@terratrail.com"
                  disabled
                  className="w-full px-4 py-2 border border-neutral-300 rounded-md bg-neutral-50 text-neutral-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Phone</label>
                <input
                  type="tel"
                  placeholder="+234"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Gender</label>
                <select className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                  <option value="">Select...</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Date of Birth</label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Occupation</label>
                <select className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                  <option value="">Select...</option>
                  <option>Business Owner</option>
                  <option>Professional</option>
                  <option>Student</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Marital Status</label>
                <select className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                  <option value="">Select...</option>
                  <option>Single</option>
                  <option>Married</option>
                  <option>Divorced</option>
                  <option>Widowed</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-2">Address</label>
                <input
                  type="text"
                  placeholder="Enter your address"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Country</label>
                <select className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                  <option>Nigeria</option>
                  <option>Ghana</option>
                  <option>Kenya</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">State</label>
                <select className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                  <option value="">Select...</option>
                  <option>Lagos</option>
                  <option>Abuja</option>
                  <option>Rivers</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Nationality</label>
                <select className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                  <option>Nigerian</option>
                  <option>Ghanaian</option>
                  <option>Kenyan</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors">
                <Check className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>

          {/* Next of Kin Information */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-medium text-neutral-900">Your Next of Kin Information</h3>
              <Badge variant="secondary">Not Started</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-2">Next of Kin Name</label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Relationship</label>
                <select className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                  <option value="">Select...</option>
                  <option>Spouse</option>
                  <option>Parent</option>
                  <option>Sibling</option>
                  <option>Child</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+234"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-2">Address</label>
                <input
                  type="text"
                  placeholder="Enter address"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-2">Email</label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors">
                <Check className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>

          {/* Referral Information */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <h3 className="font-medium text-neutral-900 mb-4">Referral Information</h3>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">How did you hear about TerraTrail?</label>
              <select className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                <option value="">Select...</option>
                <option>Online Ad</option>
                <option>Friends/Family</option>
                <option>Flyer</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <h3 className="font-medium text-neutral-900 mb-4">Notification Preferences</h3>
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="notification-sounds"
                defaultChecked
                className="mt-1 w-4 h-4 text-emerald-600 border-neutral-300 rounded focus:ring-emerald-500"
              />
              <div className="flex-1">
                <label htmlFor="notification-sounds" className="text-sm font-medium text-neutral-700 cursor-pointer">
                  Notification Sounds
                </label>
                <p className="text-xs text-neutral-500 mt-1">Play sounds when new notifications arrive</p>
              </div>
            </div>
          </div>

          {/* Delete Account */}
          <div className="bg-white rounded-lg border border-red-200 p-6">
            <h3 className="font-medium text-neutral-900 mb-2">Delete Account</h3>
            <p className="text-sm text-neutral-600 mb-4">
              Permanently delete your account and all of its data. This action is irreversible.
            </p>
            <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
