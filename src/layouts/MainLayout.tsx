import { useState, useRef, useEffect, useCallback } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useWorkspace } from "../hooks/useWorkspace";
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCheck,
  Bell,
  Download,
  Settings,
  HelpCircle,
  User,
  Calendar,
  LogOut,
  Plus,
  ChevronRight,
} from "lucide-react";
import { cn } from "../components/ui/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "../components/ui/sidebar";
import { Button } from "../components/ui/button";
import { motion, AnimatePresence } from "motion/react";

// ── Navbar user dropdown ──────────────────────────────────────────────────────
function NavbarUserMenu() {
  const navigate = useNavigate();
  const { displayName, initials, user } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("tt_auth");
    localStorage.removeItem("tt_user");
    localStorage.removeItem("tt_workspace_slug");
    navigate("/auth/sign-in");
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-neutral-50 transition-colors"
        title={displayName}
      >
        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0 shadow-sm select-none">
          {initials}
        </div>
        <span className="hidden md:block text-[12px] font-semibold text-neutral-700 max-w-[120px] truncate">
          {displayName}
        </span>
        <ChevronRight className={cn("hidden md:block size-3 text-neutral-400 transition-transform duration-150", open && "rotate-90")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-[200px] rounded-xl border border-neutral-100 bg-white shadow-lg shadow-neutral-900/10 z-50 overflow-hidden">
          {/* User info */}
          <div className="px-3 py-2.5 border-b border-neutral-50">
            <p className="text-[12px] font-semibold text-neutral-800 truncate">{displayName}</p>
            <p className="text-[11px] text-neutral-400 truncate">{user?.email ?? ""}</p>
          </div>
          {/* Actions */}
          <div className="py-1">
            <button
              onClick={() => { setOpen(false); navigate("/account"); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <User className="size-3.5 text-neutral-400" />
              My Profile
            </button>
            <button
              onClick={() => { setOpen(false); navigate("/settings"); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <Settings className="size-3.5 text-neutral-400" />
              Workspace Settings
            </button>
            <div className="my-1 border-t border-neutral-50" />
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-semibold text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="size-3.5" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const mainNavItems = [
  { icon: LayoutDashboard, label: "Overview",        href: "/" },
  { icon: Building2,       label: "Properties",      href: "/properties" },
  { icon: Users,           label: "Customers",       href: "/customers" },
  { icon: UserCheck,       label: "Sales Reps",      href: "/sales-reps" },
  { icon: Calendar,        label: "Site Inspection", href: "/site-inspection" },
  { icon: Download,        label: "Data Export",     href: "/data-export" },
];

const bottomNavItems = [
  { icon: Settings,    label: "Workspace", href: "/settings" },
  { icon: HelpCircle,  label: "Help",      href: "#" },
  { icon: User,        label: "Account",   href: "/account" },
];

function NavContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setOpenMobile } = useSidebar();
  const { displayName, initials, user } = useCurrentUser();
  const { name: workspaceName, domain } = useWorkspace();

  const handleLogout = () => {
    localStorage.removeItem("tt_auth");
    localStorage.removeItem("tt_user");
    localStorage.removeItem("tt_workspace_slug");
    navigate("/auth/sign-in");
  };

  const isActive = (href: string) =>
    href === "/" ? location.pathname === "/" : location.pathname.startsWith(href);

  return (
    <>
      {/* ── Logo / brand ─────────────────────────────────────────── */}
      <SidebarHeader className="h-[60px] border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-3 h-full">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600 shadow-sm">
            <Building2 className="size-[14px] text-white" />
          </div>
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-[13px] font-semibold tracking-tight text-neutral-900 truncate">
              {workspaceName}
            </span>
            <span className="text-[10px] font-semibold text-neutral-400 tracking-wide truncate">
              {domain || "terratrail.co"}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="pt-2">
        {/* ── Main nav ─────────────────────────────────────────────── */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold tracking-widest text-neutral-400 uppercase px-3 mb-1">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {mainNavItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.label}
                      onClick={() => setOpenMobile(false)}
                      className={cn(
                        "h-9 rounded-lg px-3 text-[13px] font-semibold transition-all duration-150",
                        active
                          ? "bg-emerald-50 text-emerald-700 [&>svg]:text-emerald-600"
                          : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 [&>svg]:text-neutral-400"
                      )}
                    >
                      <Link to={item.href}>
                        <item.icon className="size-[15px]" />
                        <span>{item.label}</span>
                        {active && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ── Growth plan + bottom nav ──────────────────────────────── */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            {/* Growth plan pill */}
            <div className="mx-3 mb-3 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-emerald-800">Growth Plan</span>
                <span className="text-[10px] font-semibold text-emerald-600">10%</span>
              </div>
              <div className="h-1 rounded-full bg-emerald-100 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "10%" }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full bg-emerald-500"
                />
              </div>
              <div className="text-[10px] text-emerald-600/70 mt-1.5">1 / 10 Properties</div>
            </div>

            <SidebarMenu className="gap-0.5">
              {bottomNavItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.label}
                      onClick={() => setOpenMobile(false)}
                      className={cn(
                        "h-9 rounded-lg px-3 text-[13px] font-semibold transition-all duration-150",
                        active
                          ? "bg-emerald-50 text-emerald-700 [&>svg]:text-emerald-600"
                          : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 [&>svg]:text-neutral-400"
                      )}
                    >
                      <Link to={item.href}>
                        <item.icon className="size-[15px]" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ── User footer ──────────────────────────────────────────── */}
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <SidebarMenuButton
          onClick={() => { setOpenMobile(false); navigate("/account"); }}
          className="w-full h-10 justify-start gap-2.5 px-2.5 rounded-lg hover:bg-neutral-50 transition-colors group"
          title="Account profile"
        >
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0 shadow-sm">
            {initials}
          </div>
          <div className="flex flex-col items-start leading-tight gap-0.5 min-w-0">
            <span className="text-[12px] font-semibold text-neutral-800 truncate">{displayName}</span>
            <span className="text-[10px] text-neutral-400 truncate">{user?.email ?? ""}</span>
          </div>
        </SidebarMenuButton>
      </SidebarFooter>
    </>
  );
}

export function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { name: workspaceName } = useWorkspace();

  // ── Global auth event: redirect to sign-in on session expiry / forced logout
  const handleAuthLogout = useCallback(() => {
    navigate("/auth/sign-in", { replace: true });
  }, [navigate]);

  useEffect(() => {
    window.addEventListener("auth:logout", handleAuthLogout);
    return () => window.removeEventListener("auth:logout", handleAuthLogout);
  }, [handleAuthLogout]);

  // Page title from route
  const pageTitle =
    location.pathname === "/"
      ? "Overview"
      : location.pathname.split("/")[1].replace(/-/g, " ");

  // Pretty-print "settings/people" → "Settings"
  const displayTitle = pageTitle.split("/")[0];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#f8f9fb] antialiased" style={{ fontFamily: "var(--font-sans)" }}>
        <Sidebar collapsible="icon" className="border-r border-neutral-100 bg-white">
          <NavContent />
        </Sidebar>

        <SidebarInset className="flex flex-col min-w-0">
          {/* ── Top header ─────────────────────────────────────────── */}
          <header className="flex h-[60px] shrink-0 items-center justify-between gap-2 border-b border-neutral-100 bg-white px-4 md:px-6 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="-ml-1 text-neutral-400 hover:text-neutral-700" />
              <div className="h-4 w-px bg-neutral-100 hidden md:block" />
              <div className="hidden md:flex items-center gap-1.5 text-[12px] text-neutral-400">
                <span className="font-medium">{workspaceName}</span>
                <ChevronRight className="size-3" />
                <span className="capitalize font-semibold text-neutral-700">{displayTitle}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Notification bell */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/settings/activity")}
                className="relative h-8 w-8 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50 rounded-lg"
                title="View activity"
              >
                <Bell className="size-[15px]" />
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-red-500 ring-1 ring-white" />
              </Button>

              <div className="h-5 w-px bg-neutral-100 mx-0.5" />

              {/* Add Property CTA */}
              <Button
                size="sm"
                onClick={() => navigate("/properties/new")}
                className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-semibold rounded-lg px-3 shadow-sm transition-all hover:shadow-emerald-600/20 hover:shadow-md"
              >
                <Plus className="size-3.5" />
                <span className="hidden sm:inline">Add Property</span>
              </Button>

              <div className="h-5 w-px bg-neutral-100 mx-0.5" />

              {/* User avatar + logout dropdown */}
              <NavbarUserMenu />
            </div>
          </header>

          {/* ── Page content ─────────────────────────────────────────── */}
          <main className="flex-1 overflow-x-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                className="h-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
