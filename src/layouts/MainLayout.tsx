import { Outlet, Link, useLocation } from "react-router";
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
  const { setOpenMobile } = useSidebar();

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
          <div className="flex flex-col leading-tight">
            <span className="text-[13px] font-semibold tracking-tight text-neutral-900">
              TerraTrail
            </span>
            <span className="text-[10px] font-semibold text-neutral-400 tracking-wide">
              Tehillah Estate
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
        <SidebarMenuButton className="w-full h-10 justify-start gap-2.5 px-2.5 rounded-lg hover:bg-neutral-50 transition-colors">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0 shadow-sm">
            AU
          </div>
          <div className="flex flex-col items-start leading-tight gap-0.5 min-w-0">
            <span className="text-[12px] font-semibold text-neutral-800 truncate">Admin User</span>
            <span className="text-[10px] text-neutral-400 truncate">admin@terra.com</span>
          </div>
          <LogOut className="ml-auto size-3.5 text-neutral-300 shrink-0" />
        </SidebarMenuButton>
      </SidebarFooter>
    </>
  );
}

export function MainLayout() {
  const location = useLocation();

  const pageTitle =
    location.pathname === "/"
      ? "Overview"
      : location.pathname.split("/")[1].replace(/-/g, " ");

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
                <span>TerraTrail</span>
                <ChevronRight className="size-3" />
                <span className="capitalize font-semibold text-neutral-700">{pageTitle}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Notification bell */}
              <Button
                variant="ghost"
                size="icon"
                className="relative h-8 w-8 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50 rounded-lg"
              >
                <Bell className="size-[15px]" />
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-red-500 ring-1 ring-white" />
              </Button>

              <div className="h-5 w-px bg-neutral-100 mx-0.5" />

              {/* CTA */}
              <Button
                size="sm"
                className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-semibold rounded-lg px-3 shadow-sm transition-all hover:shadow-emerald-600/20 hover:shadow-md"
              >
                <Plus className="size-3.5" />
                <span className="hidden sm:inline">Add Property</span>
              </Button>
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
