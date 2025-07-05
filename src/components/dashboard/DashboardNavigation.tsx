import { NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut, Menu, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const DashboardNavigation = () => {
  const { user, signOut } = useAuth();
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
    { to: "/planner", label: "Planner" },
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
              onClick={() => window.location.href = '/'} 
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Back to Home</span>
              <span className="sm:hidden">Home</span>
            </Button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex space-x-8">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Right side - Desktop User info and Sign out */}
          <div className="hidden md:flex items-center space-x-4">
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
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `block px-4 py-3 rounded-md text-base font-medium transition-colors ${
                        isActive
                          ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>
              
              {/* Mobile User info and Sign out */}
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="px-4">
                  <span className="text-sm text-gray-600 block">
                    Welcome, {user?.user_metadata?.full_name || user?.email}!
                  </span>
                </div>
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