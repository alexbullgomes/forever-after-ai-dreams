
import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { initializeReferralTracking } from "@/utils/affiliateTracking";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import WeddingPackages from "./pages/WeddingPackages";
import WeddingQuiz from "./pages/WeddingQuiz";
import Planner from "./pages/Planner";
import PhotoVideoServices from "./pages/PhotoVideoServices";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import PromotionalLanding from "./pages/PromotionalLanding";
import AffiliatePortal from "./components/affiliate/AffiliatePortal";

const queryClient = new QueryClient();

const AppContent = () => {
  // Load site settings (brand colors) on app start
  useSiteSettings();
  
  useEffect(() => {
    // Initialize referral tracking on app load
    initializeReferralTracking();
  }, []);

  return (
    <>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/services" element={<Planner />} />
            <Route path="/photo-video-services" element={<PhotoVideoServices />} />
            <Route path="/wedding-packages" element={<WeddingPackages />} />
            <Route path="/weddingquiz" element={<WeddingQuiz />} />
            <Route path="/promo/:slug" element={<PromotionalLanding />} />
            <Route path="/affiliate" element={
              <div className="min-h-screen bg-section-subtle py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <AffiliatePortal />
                </div>
              </div>
            } />
            <Route path="/dashboard/*" element={<AdminDashboard />} />
            <Route path="/user-dashboard/*" element={<UserDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
