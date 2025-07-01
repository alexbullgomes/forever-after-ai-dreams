
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Navigation = () => {
  const navigate = useNavigate();

  return (
    <nav className="w-full bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <img 
              src="/lovable-uploads/69877c2d-d142-4303-a68e-5665313e97b1.png" 
              alt="Ever After Logo" 
              className="h-8 w-auto"
            />
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/")}
              className="text-gray-700 hover:text-rose-500 font-medium"
            >
              Home
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => navigate("/weddingquiz")}
              className="text-gray-700 hover:text-rose-500 font-medium"
            >
              Quiz Rewards
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
