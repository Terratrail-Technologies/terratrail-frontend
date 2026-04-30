import { useState, useRef, useEffect, useCallback } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useWorkspace } from "../hooks/useWorkspace";
import { usePolling } from "../hooks/usePolling";
import { usePageTitle } from "../hooks/usePageTitle";
import { useWorkspaceRole } from "../hooks/useWorkspaceRole";
import { api } from "../services/api";
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
  LogOut,
  ChevronRight,
  Loader2,
  UsersRound,
  ClipboardList,
  Globe,
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

// ── Notification Bell dropdown ────────────────────────────────────────────────
interface NotificationItem {
  id: string;
  type: "inspection" | "customer";
  title: string;
  subtitle: string;
  time: string;
  href: string;
}

function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen]       = useState(false);
  const [items, setItems]     = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [unread, setUnread]   = useState(0);
  const [fetched, setFetched] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.workspaces.events();
      const events: NotificationItem[] = (res.events ?? []).map((e: any) => ({
        id: e.id,
        type: e.type as NotificationItem["type"],
        title: e.title,
        subtitle: e.subtitle,
        time: e.created_at ?? "",
        href: e.href ?? "/",
      }));
      setItems(events);
      setUnread(events.length);
      setFetched(true);
    } catch {
      setItems([]);
      setFetched(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleOpen = () => {
    setOpen((o) => !o);
    if (!open) setUnread(0);
  };

  const relativeTime = (iso: string) => {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  const typeColor = (type: NotificationItem["type"]) =>
    type === "inspection" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleOpen}
        className="relative h-8 w-8 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50 rounded-lg"
        title="Notifications"
      >
        <Bell className="size-[15px]" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[14px] h-3.5 rounded-full bg-red-500 ring-1 ring-white text-white text-[8px] font-bold flex items-center justify-center px-0.5">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-[340px] rounded-xl border border-neutral-100 bg-white shadow-lg shadow-neutral-900/10 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-50 flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-neutral-800">Notifications</span>
            <button
              onClick={() => { setOpen(false); fetchEvents(); }}
              className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Refresh
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-4 h-4 animate-spin text-neutral-300" />
              </div>
            ) : fetched && items.length === 0 ? (
              <div className="text-center py-8 text-[12px] text-neutral-400">
                No new notifications
              </div>
            ) : (
              <div className="py-1.5">
                {items.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => { setOpen(false); navigate(n.href); }}
                    className="w-full px-4 py-2.5 hover:bg-neutral-50 transition-colors text-left"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className={cn("text-[9.5px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded mt-0.5 shrink-0", typeColor(n.type))}>
                        {n.type === "inspection" ? "Inspection" : "Customer"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-neutral-700 font-medium leading-snug truncate">{n.title}</p>
                        <p className="text-[11px] text-neutral-400 mt-0.5 truncate">{n.subtitle}</p>
                      </div>
                      {n.time && (
                        <span className="text-[10px] text-neutral-400 shrink-0 mt-0.5">{relativeTime(n.time)}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-neutral-50 px-4 py-2.5">
            <button
              onClick={() => { setOpen(false); navigate("/settings/activity"); }}
              className="text-[11.5px] text-emerald-600 hover:text-emerald-700 font-medium w-full text-center"
            >
              View activity log →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

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

const ALL_NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Overview",        href: "/",               roles: ["OWNER","ADMIN","SALES_REP","CUSTOMER"] },
  { icon: Building2,       label: "Properties",      href: "/properties",     roles: ["OWNER","ADMIN","SALES_REP"] },
  { icon: Users,           label: "Customers",       href: "/customers",      roles: ["OWNER","ADMIN"] },
  { icon: UsersRound,      label: "Customer Reps",   href: "/customer-reps",  roles: ["OWNER","ADMIN"] },
  { icon: UserCheck,       label: "Sales Reps",      href: "/sales-reps",     roles: ["OWNER","ADMIN"] },
  { icon: ClipboardList,   label: "Site Inspection", href: "/site-inspection",roles: ["OWNER","ADMIN","SALES_REP"] },
  { icon: Download,        label: "Data Export",     href: "/data-export",    roles: ["OWNER","ADMIN"] },
];

const ALL_BOTTOM_ITEMS = [
  { icon: Settings,    label: "Workspace", href: "/settings", roles: ["OWNER","ADMIN"] },
  { icon: HelpCircle,  label: "Help",      href: "#",         roles: ["OWNER","ADMIN","SALES_REP","CUSTOMER"] },
  { icon: User,        label: "Account",   href: "/account",  roles: ["OWNER","ADMIN","SALES_REP","CUSTOMER"] },
];

// Priority items shown in the mobile bottom nav (max 5 slots)
const MOBILE_NAV_PRIORITY = ["/", "/properties", "/customers", "/site-inspection"];

// ── Mobile Bottom Navigation ──────────────────────────────────────────────────
function MobileBottomNav() {
  const location = useLocation();
  const { role } = useWorkspaceRole();

  const isActive = (href: string) =>
    href === "/" ? location.pathname === "/" : location.pathname.startsWith(href);

  // Get priority nav items filtered by role
  const priorityItems = MOBILE_NAV_PRIORITY
    .map((href) => ALL_NAV_ITEMS.find((n) => n.href === href))
    .filter((n): n is typeof ALL_NAV_ITEMS[0] => !!n && (!role || n.roles.includes(role)));

  // Add Account as the last slot
  const accountItem = { icon: User, label: "Account", href: "/account", roles: ["OWNER","ADMIN","SALES_REP","CUSTOMER"] };
  const navItems = [...priorityItems.slice(0, 4), accountItem];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-100 shadow-[0_-1px_0_rgba(0,0,0,0.04),0_-4px_16px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-stretch h-[56px]">
        {navItems.map((navItem) => {
          const active = isActive(navItem.href);
          return (
            <Link
              key={navItem.href}
              to={navItem.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-[3px] transition-colors duration-150 relative",
                active ? "text-emerald-600" : "text-neutral-400 hover:text-neutral-600"
              )}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-emerald-500" />
              )}
              <navItem.icon className="size-[20px] shrink-0" />
              <span className="text-[10px] font-semibold tracking-tight leading-none shrink-0">
                {navItem.label === "Site Inspection" ? "Inspections" : navItem.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function NavContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setOpenMobile } = useSidebar();
  const { displayName, initials } = useCurrentUser();
  const { name: workspaceName, domain, slug } = useWorkspace();
  const { role } = useWorkspaceRole();
  const [planUsage, setPlanUsage] = useState<any>(null);

  usePolling(() => {
    if (role === "OWNER" || role === "ADMIN") {
      api.workspaces.billingUsage()
        .then((data) => setPlanUsage(data))
        .catch(() => {});
    }
  }, 300_000); // 5 minutes

  const handleLogout = () => {
    localStorage.removeItem("tt_auth");
    localStorage.removeItem("tt_user");
    localStorage.removeItem("tt_workspace_slug");
    navigate("/auth/sign-in");
  };

  const isActive = (href: string) =>
    href === "/" ? location.pathname === "/" : location.pathname.startsWith(href);

  // Filter nav items by role; fall back to full list if role not yet loaded
  const mainNavItems = ALL_NAV_ITEMS.filter(
    (i) => !role || i.roles.includes(role)
  );
  const bottomNavItems = ALL_BOTTOM_ITEMS.filter(
    (i) => !role || i.roles.includes(role)
  );

  // Role badge label for sidebar
  const roleBadge: Record<string, string> = {
    OWNER: "Owner", ADMIN: "Admin", SALES_REP: "Sales Rep", CUSTOMER: "Customer",
  };

  return (
    <>
      {/* ── Logo / brand ─────────────────────────────────────────── */}
      <SidebarHeader className="h-[60px] border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-3 h-full">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-md shadow-emerald-200/60">
            <Building2 className="size-[15px] text-white" />
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
        {/* ── View Estate public page (Primary Action) ──────────────── */}
        {slug && (
          <SidebarGroup className="pb-0">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  onClick={() => setOpenMobile(false)}
                  className="h-10 rounded-lg px-3 text-[13.5px] font-bold transition-all duration-200 text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200/50 border border-emerald-500"
                >
                  <a href={`/estates/${slug}`} target="_blank" rel="noopener noreferrer">
                    <Globe className="size-[16px] text-emerald-100" />
                    <span>View Estate</span>
                    <span className="ml-auto text-[10px] text-emerald-200 font-medium">↗</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* ── Main nav ─────────────────────────────────────────────── */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold tracking-widest text-neutral-400 uppercase px-3 mb-1">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {mainNavItems.map((navItem) => {
                const active = isActive(navItem.href);
                return (
                  <SidebarMenuItem key={navItem.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={navItem.label}
                      onClick={() => setOpenMobile(false)}
                      className={cn(
                        "h-9 rounded-lg px-3 text-[13px] font-semibold transition-all duration-150",
                        active
                          ? "bg-emerald-50 text-emerald-700 [&>svg]:text-emerald-600"
                          : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 [&>svg]:text-neutral-400"
                      )}
                    >
                      <Link to={navItem.href}>
                        <navItem.icon className="size-[15px]" />
                        <span>{navItem.label}</span>
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
            {/* Plan usage pill — real-time */}
            {planUsage && (
              <div className="mx-3 mb-3 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-emerald-800 truncate">
                    {planUsage.plan_display ?? planUsage.plan ?? "Free Plan"}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600 shrink-0 ml-1">
                    {planUsage.properties_percent ?? planUsage.usage_percent ?? 0}%
                  </span>
                </div>
                <div className="h-1 rounded-full bg-emerald-100 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(planUsage.properties_percent ?? planUsage.usage_percent ?? 0, 100)}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full bg-emerald-500"
                  />
                </div>
                <div className="text-[10px] text-emerald-600/70 mt-1.5">
                  {planUsage.properties_used ?? 0} / {planUsage.properties_limit ?? "∞"} Properties
                </div>
              </div>
            )}

            <SidebarMenu className="gap-0.5">
              {bottomNavItems.map((navItem) => {
                const active = isActive(navItem.href);
                return (
                  <SidebarMenuItem key={navItem.label}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={navItem.label}
                      onClick={() => setOpenMobile(false)}
                      className={cn(
                        "h-9 rounded-lg px-3 text-[13px] font-semibold transition-all duration-150",
                        active
                          ? "bg-emerald-50 text-emerald-700 [&>svg]:text-emerald-600"
                          : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 [&>svg]:text-neutral-400"
                      )}
                    >
                      <Link to={navItem.href}>
                        <navItem.icon className="size-[15px]" />
                        <span>{navItem.label}</span>
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
        <div
          onClick={() => { setOpenMobile(false); navigate("/account"); }}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer group"
        >
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0 shadow-sm">
            {initials}
          </div>
          <div className="flex flex-col items-start leading-tight gap-0 min-w-0 flex-1">
            <span className="text-[12px] font-semibold text-neutral-800 truncate">{displayName}</span>
            {role && (
              <span className="text-[10px] text-emerald-600 font-semibold truncate">
                {roleBadge[role] ?? role}
              </span>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); handleLogout(); }}
            title="Log out"
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 text-neutral-400 hover:text-red-500"
          >
            <LogOut className="size-3.5" />
          </button>
        </div>
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
  const routeSegment = location.pathname === "/"
    ? "Overview"
    : location.pathname.split("/")[1].replace(/-/g, " ");
  const displayTitle = routeSegment.split("/")[0];
  const pageTitle = displayTitle.charAt(0).toUpperCase() + displayTitle.slice(1);
  usePageTitle(pageTitle);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#f8f9fb] antialiased" style={{ fontFamily: "var(--font-sans)" }}>
        <Sidebar collapsible="icon" className="border-r border-neutral-100 bg-white">
          <NavContent />
        </Sidebar>

        <SidebarInset className="flex flex-col min-w-0">
          {/* ── Top header ─────────────────────────────────────────── */}
          <header className="flex h-[60px] shrink-0 items-center justify-between gap-2 border-b border-neutral-100 bg-white px-4 md:px-6 sticky top-0 z-30 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-2.5">
              {/* Hamburger / collapse trigger — standard design */}
              <SidebarTrigger className="-ml-2 h-10 w-10 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80 rounded-xl transition-all active:scale-95 [&>svg]:size-5" />
              <div className="h-4 w-px bg-neutral-100 hidden md:block" />
              {/* Breadcrumb — desktop */}
              <div className="hidden md:flex items-center gap-1.5 text-[12px] text-neutral-400">
                <span className="font-medium text-neutral-500">{workspaceName}</span>
                <ChevronRight className="size-3" />
                <span className="capitalize font-semibold text-neutral-700">{displayTitle}</span>
              </div>
              {/* Page title — mobile only */}
              <span className="md:hidden text-[14px] font-semibold text-neutral-800 capitalize">{displayTitle}</span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Notification bell dropdown */}
              <NotificationBell />
              <div className="h-5 w-px bg-neutral-100 mx-0.5 hidden sm:block" />
              {/* User avatar + logout dropdown */}
              <NavbarUserMenu />
            </div>
          </header>

          {/* ── Page content ─────────────────────────────────────────── */}
          <main className="flex-1 overflow-x-hidden pb-14 md:pb-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 1, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.14, ease: [0.4, 0, 0.2, 1] }}
                className="h-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </SidebarInset>
      </div>

      {/* ── Mobile Bottom Navigation ─────────────────────────────────── */}
      <MobileBottomNav />
    </SidebarProvider>
  );
}
