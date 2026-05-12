import { Link, useLocation, Routes, Route, Navigate } from "react-router";
import { Settings, Users, CreditCard, Package, Clock, Shield, Mail } from "lucide-react";
import { cn } from "../../components/ui/utils";
import { GeneralSettings } from "./workspace/GeneralSettings";
import { PeopleSettings } from "./workspace/PeopleSettings";
import { BillingSettings } from "./workspace/BillingSettings";
import { AddonsSettings } from "./workspace/AddonsSettings";
import { ActivityLogs } from "./workspace/ActivityLogs";
import { PermissionsSettings } from "./workspace/PermissionsSettings";
import { EmailNotifications } from "./workspace/EmailNotifications";

const settingsTabs = [
  { id: "general", name: "General", icon: Settings, href: "/settings/general" },
  { id: "people", name: "People", icon: Users, href: "/settings/people" },
  { id: "billing", name: "Billing", icon: CreditCard, href: "/settings/billing" },
  { id: "add-ons", name: "Add-ons", icon: Package, href: "/settings/add-ons" },
  { id: "activity", name: "Activity Logs", icon: Clock, href: "/settings/activity" },
  { id: "permissions", name: "Permissions", icon: Shield, href: "/settings/permissions" },
  { id: "email", name: "Email Notifications", icon: Mail, href: "/settings/email" },
];

export function WorkspaceSettings() {
  const location = useLocation();

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  return (
    <div className="min-h-screen bg-neutral-50/50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-4 sm:px-8 py-4 sm:py-6">
        <div>
          <h1 className="text-[18px] sm:text-2xl font-semibold text-neutral-900 tracking-tight">Workspace Settings</h1>
          <p className="text-[12px] sm:text-sm text-neutral-500 mt-0.5 sm:mt-1">Manage your workspace preferences and configuration</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1">
        {/* Settings Sidebar / Tab bar */}
        <div className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-neutral-200 sticky top-[60px] z-20">
          <nav className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible p-2 sm:p-4 gap-1 no-scrollbar">
            {settingsTabs.map((tab) => {
              const Icon = tab.icon;
              const active = isActive(tab.href);
              return (
                <Link
                  key={tab.id}
                  to={tab.href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-200 whitespace-nowrap shrink-0",
                    active
                      ? "bg-[#0E2C72]/6 text-[#0E2C72] font-semibold shadow-sm shadow-[#0E2C72]/10/50"
                      : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="flex-1 p-4 sm:p-8">
          <div className="max-w-4xl mx-auto">
            <Routes>
              <Route index element={<Navigate to="/settings/general" replace />} />
              <Route path="general" element={<GeneralSettings />} />
              <Route path="people" element={<PeopleSettings />} />
              <Route path="billing" element={<BillingSettings />} />
              <Route path="add-ons" element={<AddonsSettings />} />
              <Route path="activity" element={<ActivityLogs />} />
              <Route path="permissions" element={<PermissionsSettings />} />
              <Route path="email" element={<EmailNotifications />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}


