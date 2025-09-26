
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import PromotionalPopup from "@/components/PromotionalPopup";
import { usePromotionalPopup } from "@/hooks/usePromotionalPopup";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import WeddingPackages from "./pages/WeddingPackages";
import WeddingQuiz from "./pages/WeddingQuiz";
import Planner from "./pages/Planner";
import PhotoVideoServices from "./pages/PhotoVideoServices";
import AdminDashboard from "./pages/AdminDashboard";

const queryClient = new QueryClient();

const AppContent = () => {
  const { showPopup, closePopup } = usePromotionalPopup();

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
            <Route path="/dashboard/*" element={<AdminDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      <PromotionalPopup isOpen={showPopup} onClose={closePopup} />
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
