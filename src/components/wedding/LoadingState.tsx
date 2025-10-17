import React from 'react';
import { Heart } from 'lucide-react';

const LoadingState: React.FC = () => {
  return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center">
      <div className="text-center">
        <Heart className="w-12 h-12 text-brand-primary-from animate-pulse mx-auto mb-4" />
        <p className="text-gray-600">Loading your wedding packages...</p>
      </div>
    </div>
  );
};

export default LoadingState;