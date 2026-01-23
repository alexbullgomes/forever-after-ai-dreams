import { useEffect, useState } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserDashboardAccess } from '@/hooks/useUserDashboardAccess';
import { useIsMobile } from '@/hooks/use-mobile';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { UserDashboardSidebar } from "@/components/dashboard/UserDashboardSidebar";
import AffiliatePortal from "@/components/affiliate/AffiliatePortal";
import ServiceTracking from "./ServiceTracking";
import AIAssistant from "./AIAssistant";

const UserDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasAccess, loading: accessLoading } = useUserDashboardAccess();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [redirectChecked, setRedirectChecked] = useState(false);

  useEffect(() => {
    console.log('🚦 UserDashboard redirect check:', {
      authLoading,
      accessLoading,
      user: user?.email,
      hasAccess,
      redirectChecked,
    });

    // Only check redirect once after both loading states are complete
    if (!authLoading && !accessLoading && !redirectChecked) {
      setRedirectChecked(true);
      
      if (!user) {
        console.log('❌ Redirecting: No user');
        navigate('/');
        return;
      }
      if (!hasAccess) {
        console.log('❌ Redirecting: No dashboard access');
        navigate('/');
        return;
      }
      console.log('✅ Access granted to user dashboard');
    }
  }, [user, hasAccess, authLoading, accessLoading, navigate, redirectChecked]);

  if (authLoading || accessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary-from"></div>
      </div>
    );
  }

  if (!user || !hasAccess) {
    return null;
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-muted">
        <UserDashboardSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 bg-card border-b border-border flex items-center px-6">
            <SidebarTrigger className="mr-4" />
            <div className="flex items-center justify-between w-full">
              <div>
                <h1 className="text-xl font-bold text-foreground">User Dashboard</h1>
              </div>
              {!isMobile && (
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-muted transition-colors"
                  >
                    Admin Dashboard
                  </button>
                  <button 
                    onClick={() => navigate('/services')}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-muted transition-colors"
                  >
                    Services
                  </button>
                  <button 
                    onClick={() => navigate('/')}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-muted transition-colors"
                  >
                    Back to Site
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-6">
            <Routes>
              <Route path="/" element={<AffiliatePortal />} />
              <Route path="/service-tracking" element={<ServiceTracking />} />
              <Route path="/ai-assistant" element={<AIAssistant />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default UserDashboard;
