import { useEffect, useState } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import DashboardContent from "@/components/dashboard/DashboardContent";
import ChatAdmin from "@/components/dashboard/ChatAdmin";
import PipelineProcess from "@/pages/PipelineProcess";
import GalleryCardsAdmin from "@/pages/GalleryCardsAdmin";

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasRole, loading: roleLoading } = useRole('admin');
  const navigate = useNavigate();
  const [redirectChecked, setRedirectChecked] = useState(false);

  useEffect(() => {
    console.log('🚦 AdminDashboard redirect check:', {
      authLoading,
      roleLoading,
      user: user?.email,
      hasRole,
      redirectChecked,
    });

    // Only check redirect once after both loading states are complete
    if (!authLoading && !roleLoading && !redirectChecked) {
      setRedirectChecked(true);
      
      if (!user) {
        console.log('❌ Redirecting: No user');
        navigate('/');
        return;
      }
      if (!hasRole) {
        console.log('❌ Redirecting: No admin role');
        navigate('/');
        return;
      }
      console.log('✅ Access granted to admin dashboard');
    }
  }, [user, hasRole, authLoading, roleLoading, navigate, redirectChecked]);


  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (!user || !hasRole) {
    return null;
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6">
            <SidebarTrigger className="mr-4" />
            <div className="flex items-center justify-between w-full">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => navigate('/user-dashboard')}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  User Dashboard
                </button>
                <button 
                  onClick={() => navigate('/services')}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Account
                </button>
                <button 
                  onClick={() => navigate('/')}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Back to Site
                </button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-hidden">
            <Routes>
              <Route path="/" element={<DashboardContent />} />
              <Route path="/chat-admin" element={<ChatAdmin />} />
              <Route path="/pipeline-process" element={<PipelineProcess />} />
              <Route path="/gallery-cards" element={<GalleryCardsAdmin />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;