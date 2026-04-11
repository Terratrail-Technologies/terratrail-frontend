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

export const router = createBrowserRouter([
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
