import { Button } from "@/components/ui/button";
import { Heart, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  onLoginClick: () => void;
}

const Header = ({ onLoginClick }: HeaderProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleAccountClick = () => {
    navigate('/services');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <a 
            href="https://everafterca.com/" 
            className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <Heart className="w-6 h-6 text-rose-500" />
            <span className="text-white font-bold text-xl">Everafter</span>
          </a>
          
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
        </div>
      </div>
    </header>
  );
};

export default Header;
