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
  ChevronDown,
  BarChart3,
  Calendar,
  LogOut,
  Plus
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
  { icon: LayoutDashboard, label: "Overview", href: "/" },
  { icon: Building2, label: "Properties", href: "/properties" },
  { icon: Users, label: "Customers", href: "/customers" },
  { icon: UserCheck, label: "Sales Reps", href: "/sales-reps" },
  { icon: Calendar, label: "Site Inspection", href: "/site-inspection" },
  { icon: Download, label: "Data Export", href: "/data-export" },
];

const bottomNavItems = [
  { icon: Settings, label: "Workspace", href: "/settings" },
  { icon: HelpCircle, label: "Help", href: "#" },
  { icon: User, label: "Account", href: "/account" },
];

function NavContent() {
  const location = useLocation();
  const { setOpenMobile } = useSidebar();

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  return (
    <>
      <SidebarHeader className="h-16 border-b border-sidebar-border/50">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <Building2 className="size-5" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-semibold text-neutral-900">TerraTrail</span>
            <span className="text-[10px] text-neutral-500">Tehillah Estate</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={item.label}
                    onClick={() => setOpenMobile(false)}
                  >
                    <Link to={item.href}>
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <div className="px-3 py-4 mb-2">
              <div className="text-xs text-neutral-500 mb-2">Growth Plan</div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-neutral-600">1 / 10 Properties</span>
                  <span className="text-neutral-500">10%</span>
                </div>
                <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '10%' }}
                    className="h-full bg-emerald-600 rounded-full" 
                  />
                </div>
              </div>
            </div>
            
            <SidebarMenu>
              {bottomNavItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={item.label}
                    onClick={() => setOpenMobile(false)}
                  >
                    <Link to={item.href}>
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/50 p-4">
        <SidebarMenuButton className="w-full justify-start gap-2 h-10 px-2 rounded-lg hover:bg-neutral-100 transition-colors">
          <div className="h-6 w-6 rounded-full bg-neutral-200 flex items-center justify-center overflow-hidden">
            <User className="size-4 text-neutral-500" />
          </div>
          <div className="flex flex-col items-start leading-none gap-0.5">
            <span className="text-xs font-semibold">Admin User</span>
            <span className="text-[10px] text-neutral-500">admin@terra.com</span>
          </div>
          <LogOut className="ml-auto size-3 text-neutral-400" />
        </SidebarMenuButton>
      </SidebarFooter>
    </>
  );
}

export function MainLayout() {
  const location = useLocation();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-neutral-50 font-sans antialiased">
        <Sidebar collapsible="icon" className="border-r border-neutral-200">
          <NavContent />
        </Sidebar>
        
        <SidebarInset className="flex flex-col">
          {/* Top Navbar for mobile and expanded view */}
          <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-neutral-200 bg-white px-4 md:px-6 sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="-ml-1" />
              <div className="h-4 w-px bg-neutral-200 hidden md:block" />
              <h2 className="text-sm font-medium text-neutral-500 hidden md:block capitalize">
                {location.pathname === "/" ? "Overview" : location.pathname.split("/")[1].replace("-", " ")}
              </h2>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative text-neutral-500">
                <Bell className="size-5" />
                <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-destructive" />
              </Button>
              <div className="h-8 w-px bg-neutral-200 mx-1" />
              <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="size-4" />
                <span className="hidden sm:inline">Add Property</span>
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-x-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                 key={location.pathname}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 transition={{ duration: 0.2, ease: "easeOut" }}
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

