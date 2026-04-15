import { 
  LayoutDashboard, Package, Layers, ShoppingBag, Percent, 
  BarChart3, Activity, Settings, Globe, TrendingUp, LogOut, 
  ChevronLeft, Store
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const storeItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Products", url: "/admin/products", icon: Package },
  { title: "Categories", url: "/admin/categories", icon: Layers },
  { title: "Orders", url: "/admin/orders", icon: ShoppingBag },
  { title: "Discounts", url: "/admin/discounts", icon: Percent },
];

const analyticsItems = [
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Monitoring", url: "/admin/monitoring", icon: Activity },
];

const settingsItems = [
  { title: "Alert Settings", url: "/admin/settings", icon: Settings },
  { title: "WordPress", url: "/wp/admin", icon: Globe },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  const renderGroup = (label: string, items: typeof storeItems) => (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
        {!collapsed && label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                onClick={() => navigate(item.url)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive(item.url)
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Store className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-sm font-bold">LUJO Store</h2>
              <p className="text-[10px] text-muted-foreground">Management</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {renderGroup("Store", storeItems)}
        {renderGroup("Insights", analyticsItems)}
        {renderGroup("Settings", settingsItems)}
      </SidebarContent>

      <SidebarFooter className="p-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/")}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {!collapsed && "Back to Store"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
