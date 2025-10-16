import { BrandColors } from "@/hooks/useSiteSettings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, MessageCircle } from "lucide-react";

interface ColorPreviewProps {
  colors: BrandColors;
}

export const ColorPreview = ({ colors }: ColorPreviewProps) => {
  const gradientStyle = {
    background: `linear-gradient(to right, hsl(${colors.primary_from}), hsl(${colors.primary_to}))`
  };

  const hoverGradientStyle = {
    background: `linear-gradient(to right, hsl(${colors.primary_hover_from}), hsl(${colors.primary_hover_to}))`
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Preview</CardTitle>
        <CardDescription>See how your colors look on components</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Button Preview */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Button (Normal)</h4>
          <div style={gradientStyle} className="text-white px-6 py-3 rounded-full font-semibold inline-flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Book Now
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Button (Hover State)</h4>
          <div style={hoverGradientStyle} className="text-white px-6 py-3 rounded-full font-semibold inline-flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Book Now
          </div>
        </div>

        {/* Chat Bubble Preview */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Chat Message Bubble</h4>
          <div className="flex justify-end">
            <div style={gradientStyle} className="text-white rounded-lg p-3 max-w-xs">
              <p className="text-sm">Hi! I'd love to book your services for my wedding!</p>
            </div>
          </div>
        </div>

        {/* Expandable Chat Toggle */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Chat Toggle Button</h4>
          <div className="flex justify-end">
            <button 
              style={gradientStyle}
              className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white"
            >
              <MessageCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Footer Banner */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Promotional Footer</h4>
          <div style={gradientStyle} className="text-white p-4 rounded-lg text-center">
            <p className="font-medium">✨ Special Offer - 30% OFF Wedding Packages ✨</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
