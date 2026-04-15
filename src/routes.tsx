import { createBrowserRouter } from "react-router";
import { MainLayout } from "./layouts/MainLayout";
import { Overview } from "./pages/Overview";
import { Properties } from "./pages/Properties";
import { PropertyWizard } from "./pages/PropertyWizard";
import { Customers } from "./pages/Customers";
import { SalesReps } from "./pages/SalesReps";
import { SiteInspection } from "./pages/SiteInspection";
import { DataExport } from "./pages/DataExport";
import { WorkspaceSettings } from "./pages/settings/WorkspaceSettings";
import { AccountSettings } from "./pages/settings/AccountSettings";
import { NotFound } from "./pages/NotFound";
// Onboarding – isolated module, no MainLayout dependency
import { OnboardingLayout } from "./onboarding/components/OnboardingLayout";
import { SignIn } from "./onboarding/pages/SignIn";
import { SignUp } from "./onboarding/pages/SignUp";
import { VerifyIdentity } from "./onboarding/pages/VerifyIdentity";
import { ForgotPassword } from "./onboarding/pages/ForgotPassword";
import { CreateNewPassword } from "./onboarding/pages/CreateNewPassword";

export const router = createBrowserRouter([
  // ── Onboarding (standalone, no MainLayout) ──────────────────────────────
  {
    path: "/auth/",
    Component: OnboardingLayout,
    children: [
      { index: true, Component: SignIn },
      { path: "sign-in", Component: SignIn },
      { path: "sign-up", Component: SignUp },
      { path: "verify", Component: VerifyIdentity },
      { path: "forgot-password", Component: ForgotPassword },
      { path: "reset-password", Component: CreateNewPassword },
    ],
  },
  // ── Main app (existing – untouched) ─────────────────────────────────────
  {
    path: "/",
    Component: MainLayout,
    children: [
      { index: true, Component: Overview },
      { path: "properties", Component: Properties },
      { path: "properties/new", Component: PropertyWizard },
      { path: "properties/:id/edit", Component: PropertyWizard },
      { path: "customers", Component: Customers },
      { path: "sales-reps", Component: SalesReps },
      { path: "site-inspection", Component: SiteInspection },
      { path: "data-export", Component: DataExport },
      { path: "settings/*", Component: WorkspaceSettings },
      { path: "account", Component: AccountSettings },
      { path: "*", Component: NotFound },
    ],
  },
]);
