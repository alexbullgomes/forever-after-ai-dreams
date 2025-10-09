import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, MessageSquare, LogOut, Workflow, Images, User, Home, Briefcase } from "lucide-react";
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
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Gallery Cards",
    url: "/dashboard/gallery-cards",
    icon: Images,
  },
  {
    title: "Chat Admin",
    url: "/dashboard/chat-admin",
    icon: MessageSquare,
  },
  {
    title: "Pipeline Process",
    url: "/dashboard/pipeline-process",
    icon: Workflow,
  },
];

export function AppSidebar() {
  const { state, open } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const isMobile = useIsMobile();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const showText = state !== "collapsed";

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
    if (path === "/dashboard") {
      return currentPath === "/dashboard";
    }
    return currentPath.startsWith(path);
  };

  const getNavCls = (isActiveRoute: boolean) =>
    isActiveRoute
      ? "bg-rose-100 text-rose-700 font-medium hover:bg-rose-100"
      : "hover:bg-gray-100 text-gray-700";

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarHeader className="p-6">
        {!collapsed && (
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
              Everafter
            </h2>
            <p className="text-sm text-gray-600">Admin Panel</p>
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
                    end={item.url === "/dashboard"}
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
                  <SidebarMenuButton onClick={() => navigate('/user-dashboard')} className="w-full">
                    <User className="h-4 w-4" />
                    {showText && <span>User Dashboard</span>}
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