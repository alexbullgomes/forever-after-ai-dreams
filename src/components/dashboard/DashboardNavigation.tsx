import { NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { useUserDashboardAccess } from "@/hooks/useUserDashboardAccess";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut, Menu, X, Shield, LayoutDashboard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const DashboardNavigation = () => {
  const { user, signOut } = useAuth();
  const { hasRole: isAdmin } = useRole('admin');
  const { hasAccess: hasUserDashboard } = useUserDashboardAccess();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "Thank you for visiting Dream Weddings!"
      });
      window.location.href = '/';
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const navLinks = [
    { to: "/services", label: "Services" },
    { to: "/photo-video-services", label: "Photo & Video" },
    { to: "/wedding-packages", label: "Wedding Packages" },
  ];

  return (
    <div className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Left side - Back button */}
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              onClick={() => window.location.href = 'https://everafterca.com/'} 
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Back to Home</span>
              <span className="sm:hidden">Home</span>
            </Button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex space-x-8">
            {navLinks.map((link) => {
              const isActive = window.location.pathname === link.to;
              return (
                <button
                  key={link.to}
                  onClick={() => window.location.href = link.to}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-brand-gradient text-white"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Right side - Desktop User info and Sign out */}
          <div className="hidden md:flex items-center space-x-4">
            {isAdmin && (
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/dashboard'} 
                className="text-gray-600 hover:text-gray-900"
              >
                <Shield className="w-4 h-4 mr-2" />
                Admin
              </Button>
            )}
            {hasUserDashboard && (
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/user-dashboard'} 
                className="text-gray-600 hover:text-gray-900"
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                User Dashboard
              </Button>
            )}
            <span className="text-sm text-gray-600 max-w-48 truncate">
              Welcome, {user?.user_metadata?.full_name || user?.email}!
            </span>
            <Button 
              variant="outline" 
              onClick={handleSignOut} 
              className="text-gray-600 hover:text-gray-900"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-gray-900"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-4">
              {/* Mobile Navigation Links */}
              <div className="space-y-2">
                {navLinks.map((link) => {
                  const isActive = window.location.pathname === link.to;
                  return (
                    <button
                      key={link.to}
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        window.location.href = link.to;
                      }}
                      className={`block w-full text-left px-4 py-3 rounded-md text-base font-medium transition-colors ${
                        isActive
                          ? "bg-brand-gradient text-white"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      {link.label}
                    </button>
                  );
                })}
              </div>
              
              {/* Mobile User info and Sign out */}
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="px-4">
                  <span className="text-sm text-gray-600 block">
                    Welcome, {user?.user_metadata?.full_name || user?.email}!
                  </span>
                </div>
                {isAdmin && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      window.location.href = '/dashboard';
                    }} 
                    className="w-full mx-4 text-gray-600 hover:text-gray-900 max-w-none"
                    style={{ width: 'calc(100% - 2rem)' }}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Admin Dashboard
                  </Button>
                )}
                {hasUserDashboard && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      window.location.href = '/user-dashboard';
                    }} 
                    className="w-full mx-4 text-gray-600 hover:text-gray-900 max-w-none"
                    style={{ width: 'calc(100% - 2rem)' }}
                  >
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    User Dashboard
                  </Button>
                )}
                <Button
                  variant="outline" 
                  onClick={handleSignOut} 
                  className="w-full mx-4 text-gray-600 hover:text-gray-900 max-w-none"
                  style={{ width: 'calc(100% - 2rem)' }}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { DashboardNavigation };