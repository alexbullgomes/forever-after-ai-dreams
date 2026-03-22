import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, User, Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useNavigationLinks } from "@/hooks/useNavigationLinks";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onLoginClick: () => void;
  hideAccountButton?: boolean;
}

const Header = ({ onLoginClick, hideAccountButton = false }: HeaderProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { links } = useNavigationLinks();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleAccountClick = () => {
    navigate('/user-dashboard/my-services');
  };

  const isLinkActive = (link: typeof links[number]) => {
    if (link.type === 'internal') {
      return location.pathname === link.url || location.pathname.startsWith(link.url + '/');
    }
    return false;
  };

  const renderLink = (link: typeof links[number]) => {
    const active = isLinkActive(link);
    const className = cn(
      "nav-link-animated text-white/80 text-sm font-medium transition-colors duration-250",
      active && "active"
    );

    if (link.type === 'internal') {
      return (
        <Link
          key={link.id}
          to={link.url}
          className={className}
          onClick={() => setMobileMenuOpen(false)}
        >
          {link.label}
        </Link>
      );
    }
    return (
      <a
        key={link.id}
        href={link.url}
        className={className}
        {...(link.open_in_new_tab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        onClick={() => setMobileMenuOpen(false)}
      >
        {link.label}
      </a>
    );
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <a 
            href="https://everafterca.com/" 
            className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <Heart className="w-6 h-6 text-brand-primary-from" />
            <span className="text-white font-bold text-xl">Everafter</span>
          </a>

          {/* Desktop nav links */}
          {links.length > 0 && (
            <nav className="hidden md:flex items-center gap-6">
              {links.map(renderLink)}
            </nav>
          )}

          <div className="flex items-center gap-2">
            {/* Mobile hamburger */}
            {links.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-white"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            )}

            {!hideAccountButton && (
              <div>
                {user ? (
                  <Button 
                    onClick={handleAccountClick}
                    className="bg-brand-gradient hover:bg-brand-gradient-hover text-white font-semibold rounded-full shadow-lg transition-all duration-300"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Account
                  </Button>
                ) : (
                  <Button 
                    onClick={onLoginClick}
                    className="bg-brand-gradient hover:bg-brand-gradient-hover text-white font-semibold rounded-full shadow-lg transition-all duration-300"
                  >
                    Login
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && links.length > 0 && (
          <nav className="md:hidden pb-4 flex flex-col gap-3">
            {links.map(renderLink)}
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
