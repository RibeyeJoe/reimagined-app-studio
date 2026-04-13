import {
  LayoutDashboard, ClipboardList, Tv2, Plug, Presentation,
  BarChart3, Settings, Lock, ChevronRight, TrendingUp, Shield,
} from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { RibeyeLogo } from "@/components/ribeye-logo";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const workflowItems = [
  { title: "Planner", icon: LayoutDashboard, href: "/", enabled: true },
  { title: "Orders", icon: ClipboardList, href: "/orders", enabled: true },
  { title: "Media Channels", icon: Tv2, href: "/media-channels", enabled: true },
  { title: "Templates", icon: Presentation, href: "/templates", enabled: true },
  { title: "Integrations", icon: Plug, href: "/integrations", enabled: true },
];

const analyticsItems = [
  { title: "Reports", icon: BarChart3, href: "/reports", enabled: true },
  { title: "Optimize", icon: TrendingUp, href: "#", enabled: false },
];

const adminItems = [
  { title: "Settings", icon: Settings, href: "#", enabled: false },
  { title: "Admin", icon: Shield, href: "#", enabled: false },
];

function NavItem({ item, isActive, collapsed }: { item: typeof workflowItems[0]; isActive: boolean; collapsed: boolean }) {
  if (!item.enabled) {
    return (
      <SidebarMenuItem>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <SidebarMenuButton className="opacity-40 cursor-not-allowed pointer-events-none">
                <item.icon className="w-4 h-4" />
                <span className="flex items-center justify-between flex-1">
                  {item.title}
                  <ChevronRight className="w-3.5 h-3.5 opacity-0" />
                </span>
              </SidebarMenuButton>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">Coming soon</TooltipContent>
        </Tooltip>
      </SidebarMenuItem>
    );
  }
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <Link to={item.href}>
          <item.icon className="w-4 h-4" />
          <span className="flex items-center justify-between flex-1">
            {item.title}
            <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          </span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const location = useLocation();
  const { state: sidebarState } = useSidebar();
  const collapsed = sidebarState === "collapsed";

  const isActive = (item: typeof workflowItems[0]) =>
    item.enabled && (
      location.pathname === item.href ||
      (item.href === "/" && location.pathname === "/planner")
    );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 pb-4">
        <RibeyeLogo collapsed={collapsed} />
      </SidebarHeader>
      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-2 mb-1">
            Workflow
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {workflowItems.map(item => (
                <NavItem key={item.title} item={item} isActive={isActive(item)} collapsed={collapsed} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-2 mb-1">
            Analytics
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {analyticsItems.map(item => (
                <NavItem key={item.title} item={item} isActive={isActive(item)} collapsed={collapsed} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-2 mb-1">
            Admin
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map(item => (
                <NavItem key={item.title} item={item} isActive={isActive(item)} collapsed={collapsed} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        {!collapsed && (
          <div className="flex flex-col gap-0.5">
            <p className="text-xs font-display font-bold text-sidebar-foreground">Ribeye Omni Planner</p>
            <p className="text-[10px] text-muted-foreground">v1.0</p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
