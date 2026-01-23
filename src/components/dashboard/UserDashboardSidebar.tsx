import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Users, LogOut, BarChart3, ShieldCheck, Home, Briefcase, MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/hooks/use-toast";
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

const navigationItems = [
  {
    title: "AI Assistant",
    url: "/user-dashboard/ai-assistant",
    icon: MessageCircle,
  },
  {
    title: "Service Tracking",
    url: "/user-dashboard/service-tracking",
    icon: BarChart3,
  },
  {
    title: "Affiliate",
    url: "/user-dashboard",
    icon: Users,
  },
];

export function UserDashboardSidebar() {
  const { state, open } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const isMobile = useIsMobile();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const showText = isMobile || state !== "collapsed";

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error) {
      toast({
        title: "Sign out failed",
        description: "There was an error signing you out.",
        variant: "destructive",
      });
    }
  };

  const isActive = (path: string) => {
    if (path === "/user-dashboard") {
      return currentPath === "/user-dashboard";
    }
    return currentPath.startsWith(path);
  };

  const getNavCls = (isActiveRoute: boolean) =>
    isActiveRoute
      ? "bg-brand-light text-brand-primary-from font-medium hover:bg-brand-light"
      : "hover:bg-muted text-muted-foreground";

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarHeader className="p-6">
        {!collapsed && (
          <div>
            <h2 className="text-xl font-bold bg-brand-gradient bg-clip-text text-transparent">
              Everafter
            </h2>
            <p className="text-sm text-muted-foreground">User Dashboard</p>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                  <NavLink
                    to={item.url}
                    end={item.url === "/user-dashboard"}
                    className={getNavCls(isActive(item.url))}
                  >
                    <item.icon className="h-4 w-4" />
                    {showText && <span>{item.title}</span>}
                  </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isMobile && (
          <SidebarGroup>
            <SidebarGroupLabel>Quick Links</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate('/dashboard')} className="w-full">
                    <ShieldCheck className="h-4 w-4" />
                    {showText && <span>Admin Dashboard</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate('/services')} className="w-full">
                    <Briefcase className="h-4 w-4" />
                    {showText && <span>Services</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate('/')} className="w-full">
                    <Home className="h-4 w-4" />
                    {showText && <span>Back to Site</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} className="w-full">
              <LogOut className="h-4 w-4" />
              {showText && <span>Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
