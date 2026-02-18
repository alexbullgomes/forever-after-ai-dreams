import React, { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { initializeReferralTracking } from "@/utils/affiliateTracking";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { VisitorTracker } from "@/components/VisitorTracker";

// Eager load for homepage (LCP critical)
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Lazy load non-critical routes
const WeddingQuiz = lazy(() => import("./pages/WeddingQuiz"));
const Planner = lazy(() => import("./pages/Planner"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const UserDashboard = lazy(() => import("./pages/UserDashboard"));
const PromotionalLanding = lazy(() => import("./pages/PromotionalLanding"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const AffiliatePortal = lazy(() => import("./components/affiliate/AffiliatePortal"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));

// Minimal loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary-from"></div>
  </div>
);
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
          <VisitorTracker />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/services" element={<Planner />} />
              <Route path="/weddingquiz" element={<WeddingQuiz />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/promo/:slug" element={<PromotionalLanding />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
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
          </Suspense>
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
