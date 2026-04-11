import { LayoutDashboard, ClipboardList, Tv2, Plug, Presentation, BarChart3, Settings, Lock } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { RibeyeLogo } from "@/components/ribeye-logo";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
  { title: "Planner", icon: LayoutDashboard, href: "/", enabled: true },
  { title: "Orders", icon: ClipboardList, href: "/orders", enabled: true },
  { title: "Media Channels", icon: Tv2, href: "/media-channels", enabled: true },
  { title: "Integrations", icon: Plug, href: "/integrations", enabled: true },
  { title: "Templates", icon: Presentation, href: "/templates", enabled: true },
  { title: "Reports", icon: BarChart3, href: "#", enabled: false },
  { title: "Settings", icon: Settings, href: "#", enabled: false },
];

export function AppSidebar() {
  const location = useLocation();
  const { state: sidebarState } = useSidebar();
  const collapsed = sidebarState === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 pb-6">
        <RibeyeLogo collapsed={collapsed} />
      </SidebarHeader>
      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = item.enabled && (
                  location.pathname === item.href ||
                  (item.href === "/" && location.pathname === "/planner")
                );
                if (!item.enabled) {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <SidebarMenuButton className="opacity-30 cursor-not-allowed pointer-events-none">
                              <item.icon className="w-4 h-4" />
                              <span className="flex items-center gap-2">
                                {item.title}
                                <Lock className="w-3 h-3" />
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
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link to={item.href}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        {!collapsed && (
          <p className="text-[10px] text-sidebar-foreground/40 font-medium">
            Ribeye Omni Planner v1.0
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
