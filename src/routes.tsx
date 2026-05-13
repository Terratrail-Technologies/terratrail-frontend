import { createBrowserRouter, isRouteErrorResponse, useRouteError } from "react-router";
import { MainLayout } from "./layouts/MainLayout";
import { Overview } from "./pages/Overview";
import { Properties } from "./pages/Properties";
import { PropertyWizard } from "./pages/PropertyWizard";
import PropertyPreview from "./pages/PropertyPreview";
import { Customers } from "./pages/Customers";
import { CustomerDetail } from "./pages/CustomerDetail";
import { SalesReps } from "./pages/SalesReps";
import { SalesRepDetail } from "./pages/SalesRepDetail";
import { CustomerReps } from "./pages/CustomerReps";
import { CustomerRepDetail } from "./pages/CustomerRepDetail";
import { SiteInspection } from "./pages/SiteInspection";
import { DataExport } from "./pages/DataExport";
import { BulkUpload } from "./pages/BulkUpload";
import { WorkspaceSettings } from "./pages/settings/WorkspaceSettings";
import { AccountSettings } from "./pages/settings/AccountSettings";
import { NotFound } from "./pages/NotFound";
import { ServerError } from "./pages/ServerError";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AcceptInvite } from "./pages/AcceptInvite";
import EstatesPage from "./pages/public/EstatesPage";
import EstateDetailPage from "./pages/public/EstateDetailPage";
import LandingPage from "./pages/public/LandingPage";
import { PropertyDetail } from "./pages/PropertyDetail";
import { PaymentsPage } from "./pages/PaymentsPage";
import { AllocationPage } from "./pages/AllocationPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { HelpPage } from "./pages/HelpPage";
import { TermsPage } from "./pages/TermsPage";
import { PrivacyPage } from "./pages/PrivacyPage";
// Onboarding – isolated module, no MainLayout dependency
import { OnboardingLayout } from "./onboarding/components/OnboardingLayout";
import { SignIn } from "./onboarding/pages/SignIn";
import { SignUp } from "./onboarding/pages/SignUp";
import { VerifyIdentity } from "./onboarding/pages/VerifyIdentity";
import { ForgotPassword } from "./onboarding/pages/ForgotPassword";
import { CreateNewPassword } from "./onboarding/pages/CreateNewPassword";
import { WorkspaceSetup } from "./onboarding/pages/WorkspaceSetup";
import { SelectPlan } from "./onboarding/pages/SelectPlan";
import { SelectWorkspace } from "./onboarding/pages/SelectWorkspace";

function RouteErrorElement() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFound />;
  const message = error instanceof Error ? error.message : String(error ?? "Unknown error");
  return <ServerError message={message} />;
}

export const router = createBrowserRouter([
  // ── Public pages (no auth required) ──────────────────────────────────────
  { path: "/terms", Component: TermsPage, errorElement: <RouteErrorElement /> },
  { path: "/privacy", Component: PrivacyPage, errorElement: <RouteErrorElement /> },
  { path: "/landing", Component: LandingPage, errorElement: <RouteErrorElement /> },
  { path: "/accept-invite/:token", Component: AcceptInvite, errorElement: <RouteErrorElement /> },
  { path: "/estates/:workspaceSlug", Component: EstatesPage, errorElement: <RouteErrorElement /> },
  { path: "/estates/:workspaceSlug/:propertyId", Component: EstateDetailPage, errorElement: <RouteErrorElement /> },

  // ── Onboarding (standalone, no MainLayout) ──────────────────────────────
  {
    path: "/auth/",
    Component: OnboardingLayout,
    errorElement: <RouteErrorElement />,
    children: [
      { index: true, Component: SignIn },
      { path: "sign-in", Component: SignIn },
      { path: "sign-up", Component: SignUp },
      { path: "verify", Component: VerifyIdentity },
      { path: "forgot-password", Component: ForgotPassword },
      { path: "reset-password", Component: CreateNewPassword },
      { path: "workspace-setup", Component: WorkspaceSetup },
      { path: "select-plan", Component: SelectPlan },
      { path: "select-workspace", Component: SelectWorkspace },
    ],
  },
  // ── Main app (protected – redirect to /auth/sign-in if not logged in) ──
  {
    Component: ProtectedRoute,
    errorElement: <RouteErrorElement />,
    children: [
      {
        path: "/",
        Component: MainLayout,
        errorElement: <RouteErrorElement />,
        children: [
          { index: true, Component: Overview },
          { path: "properties", Component: Properties },
          { path: "properties/new", Component: PropertyWizard },
          { path: "properties/:id", Component: PropertyDetail },
          { path: "properties/:id/edit", Component: PropertyWizard },
          { path: "properties/:id/preview", Component: PropertyPreview },
          { path: "customers", Component: Customers },
          { path: "customers/:id", Component: CustomerDetail },
          { path: "customer-reps", Component: CustomerReps },
          { path: "customer-reps/:id", Component: CustomerRepDetail },
          { path: "sales-reps", Component: SalesReps },
          { path: "sales-reps/:id", Component: SalesRepDetail },
          { path: "site-inspection", Component: SiteInspection },
          { path: "payments", Component: PaymentsPage },
          { path: "allocation", Component: AllocationPage },
          { path: "notifications", Component: NotificationsPage },
          { path: "data-export", Component: DataExport },
          { path: "bulk-upload", Component: BulkUpload },
          { path: "help", Component: HelpPage },
          { path: "settings/*", Component: WorkspaceSettings },
          { path: "account", Component: AccountSettings },
          { path: "*", Component: NotFound },
        ],
      },
    ],
  },
]);
