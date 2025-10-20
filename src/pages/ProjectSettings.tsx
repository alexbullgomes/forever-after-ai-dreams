import { useState, useEffect } from 'react';
import { useSiteSettingsAdmin } from '@/hooks/useSiteSettingsAdmin';
import { BrandColors } from '@/hooks/useSiteSettings';
import { ColorPicker } from '@/components/admin/ColorPicker';
import { ColorPreview } from '@/components/admin/ColorPreview';
import { ColorExportImport } from '@/components/admin/ColorExportImport';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RotateCcw } from 'lucide-react';
import { useRole } from '@/hooks/useRole';
import { useNavigate } from 'react-router-dom';

const DEFAULT_COLORS: BrandColors = {
  // Primary gradient colors
  primary_from: "244 63 94", // rose-500
  primary_to: "236 72 153", // pink-500
  primary_hover_from: "225 29 72", // rose-600
  primary_hover_to: "219 39 119", // pink-600
  
  // Icon backgrounds
  icon_bg_primary: "244 63 94", // rose-500
  icon_bg_secondary: "168 85 247", // purple-500
  icon_bg_accent: "236 72 153", // pink-500
  
  // Text accents
  text_accent: "244 63 94", // rose-500
  badge_text: "225 29 72", // rose-700
  stats_text: "244 63 94", // rose-500
  
  // Backgrounds
  badge_bg: "254 242 242", // rose-50
  
  // Decorative elements
  feature_dot: "251 113 133", // rose-400
  
  // Hero section
  hero_overlay_color: "0 0 0",
  hero_badge_bg_color: "0 0 100",
  hero_badge_icon: "351 95 71",
  hero_gradient_from: "351 95 71",
  hero_gradient_via: "328 86 70",
  hero_gradient_to: "261 90 76",
  hero_text_primary: "0 0 100",
  hero_text_muted: "0 0 100",
  hero_trust_text: "0 0 100",
  hero_glow_1_from: "351 95 71",
  hero_glow_1_to: "328 86 70",
  hero_glow_2_from: "261 90 76",
  hero_glow_2_to: "328 86 70",
  
  // Services section
  service_icon_gradient_from: "351 95 71",
  service_icon_gradient_to: "328 86 70",
  
  // Contact section
  contact_bg_gradient_from: "222 47 11",
  contact_bg_gradient_to: "350 89 60",
};

const ProjectSettings = () => {
  const { colors, loading, updateColors } = useSiteSettingsAdmin();
  const [tempColors, setTempColors] = useState<BrandColors>(DEFAULT_COLORS);
  const [saving, setSaving] = useState(false);
  const { hasRole, loading: roleLoading } = useRole('admin');
  const navigate = useNavigate();

  // Redirect non-admins
  useEffect(() => {
    if (!roleLoading && !hasRole) {
      navigate('/');
    }
  }, [hasRole, roleLoading, navigate]);

  useEffect(() => {
    if (colors) {
      setTempColors(colors);
    }
  }, [colors]);

  const handleSave = async () => {
    setSaving(true);
    await updateColors(tempColors);
    setSaving(false);
  };

  const handleReset = () => {
    setTempColors(DEFAULT_COLORS);
  };

  const handleImport = (importedColors: BrandColors) => {
    setTempColors(importedColors);
  };

  if (loading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasRole) {
    return null;
  }

  const hasChanges = JSON.stringify(tempColors) !== JSON.stringify(colors);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Project Settings</h1>
        <p className="text-muted-foreground mt-2">
          Customize the brand colors used across your entire site
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Color Settings */}
        <div className="space-y-6">
          {/* Primary Gradients */}
          <Card>
            <CardHeader>
              <CardTitle>Primary Gradients</CardTitle>
              <CardDescription>
                Main gradient colors used for buttons, CTAs, and primary UI elements
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium text-sm">Default State</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <ColorPicker
                    label="Gradient Start"
                    value={tempColors.primary_from}
                    onChange={(value) => setTempColors(prev => ({ ...prev, primary_from: value }))}
                    description="Left side of gradient"
                  />
                  <ColorPicker
                    label="Gradient End"
                    value={tempColors.primary_to}
                    onChange={(value) => setTempColors(prev => ({ ...prev, primary_to: value }))}
                    description="Right side of gradient"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-sm">Hover State</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <ColorPicker
                    label="Hover Start"
                    value={tempColors.primary_hover_from}
                    onChange={(value) => setTempColors(prev => ({ ...prev, primary_hover_from: value }))}
                    description="Hover gradient start"
                  />
                  <ColorPicker
                    label="Hover End"
                    value={tempColors.primary_hover_to}
                    onChange={(value) => setTempColors(prev => ({ ...prev, primary_hover_to: value }))}
                    description="Hover gradient end"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Icon Backgrounds */}
          <Card>
            <CardHeader>
              <CardTitle>Icon Backgrounds</CardTitle>
              <CardDescription>
                Colors for service icons, feature icons, and circular icon containers
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <ColorPicker
                  label="Primary Icon"
                  value={tempColors.icon_bg_primary}
                  onChange={(value) => setTempColors(prev => ({ ...prev, icon_bg_primary: value }))}
                  description="Main service icons"
                />
                <ColorPicker
                  label="Secondary Icon"
                  value={tempColors.icon_bg_secondary}
                  onChange={(value) => setTempColors(prev => ({ ...prev, icon_bg_secondary: value }))}
                  description="Alternative icons"
                />
                <ColorPicker
                  label="Accent Icon"
                  value={tempColors.icon_bg_accent}
                  onChange={(value) => setTempColors(prev => ({ ...prev, icon_bg_accent: value }))}
                  description="Accent elements"
                />
              </div>
            </CardContent>
          </Card>

          {/* Text & Badges */}
          <Card>
            <CardHeader>
              <CardTitle>Text & Badges</CardTitle>
              <CardDescription>
                Colors for accent text, section badges, and statistics
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <ColorPicker
                  label="Text Accent"
                  value={tempColors.text_accent}
                  onChange={(value) => setTempColors(prev => ({ ...prev, text_accent: value }))}
                  description="Accent headlines"
                />
                <ColorPicker
                  label="Badge Text"
                  value={tempColors.badge_text}
                  onChange={(value) => setTempColors(prev => ({ ...prev, badge_text: value }))}
                  description="Section label text"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <ColorPicker
                  label="Stats Text"
                  value={tempColors.stats_text}
                  onChange={(value) => setTempColors(prev => ({ ...prev, stats_text: value }))}
                  description="Statistics numbers"
                />
                <ColorPicker
                  label="Badge Background"
                  value={tempColors.badge_bg}
                  onChange={(value) => setTempColors(prev => ({ ...prev, badge_bg: value }))}
                  description="Section label bg"
                />
              </div>
            </CardContent>
          </Card>

          {/* Decorative Elements */}
          <Card>
            <CardHeader>
              <CardTitle>Decorative Elements</CardTitle>
              <CardDescription>
                Colors for bullets, dividers, and other design accents
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <ColorPicker
                label="Feature Dots"
                value={tempColors.feature_dot}
                onChange={(value) => setTempColors(prev => ({ ...prev, feature_dot: value }))}
                description="Bullet points in lists"
              />
            </CardContent>
          </Card>

          {/* Hero Section Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Hero Banner Colors</CardTitle>
              <CardDescription>
                Colors for the homepage hero section
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <ColorPicker
                  label="Overlay Color"
                  value={tempColors.hero_overlay_color}
                  onChange={(value) => setTempColors(prev => ({ ...prev, hero_overlay_color: value }))}
                  description="Video overlay (use with /40)"
                />
                <ColorPicker
                  label="Badge Background"
                  value={tempColors.hero_badge_bg_color}
                  onChange={(value) => setTempColors(prev => ({ ...prev, hero_badge_bg_color: value }))}
                  description="Badge bg (use with /10)"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <ColorPicker
                  label="Badge Icon"
                  value={tempColors.hero_badge_icon}
                  onChange={(value) => setTempColors(prev => ({ ...prev, hero_badge_icon: value }))}
                  description="Heart icon color"
                />
                <ColorPicker
                  label="Primary Text"
                  value={tempColors.hero_text_primary}
                  onChange={(value) => setTempColors(prev => ({ ...prev, hero_text_primary: value }))}
                  description="Main text color"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <ColorPicker
                  label="Muted Text"
                  value={tempColors.hero_text_muted}
                  onChange={(value) => setTempColors(prev => ({ ...prev, hero_text_muted: value }))}
                  description="Subtitle (use with /90)"
                />
                <ColorPicker
                  label="Trust Text"
                  value={tempColors.hero_trust_text}
                  onChange={(value) => setTempColors(prev => ({ ...prev, hero_trust_text: value }))}
                  description="Trust badges (use with /70)"
                />
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <ColorPicker
                  label="Gradient Start"
                  value={tempColors.hero_gradient_from}
                  onChange={(value) => setTempColors(prev => ({ ...prev, hero_gradient_from: value }))}
                  description="Title gradient start"
                />
                <ColorPicker
                  label="Gradient Middle"
                  value={tempColors.hero_gradient_via}
                  onChange={(value) => setTempColors(prev => ({ ...prev, hero_gradient_via: value }))}
                  description="Title gradient middle"
                />
                <ColorPicker
                  label="Gradient End"
                  value={tempColors.hero_gradient_to}
                  onChange={(value) => setTempColors(prev => ({ ...prev, hero_gradient_to: value }))}
                  description="Title gradient end"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Glow Effect 1</p>
                  <div className="grid grid-cols-2 gap-2">
                    <ColorPicker
                      label="Start"
                      value={tempColors.hero_glow_1_from}
                      onChange={(value) => setTempColors(prev => ({ ...prev, hero_glow_1_from: value }))}
                      description="From color"
                    />
                    <ColorPicker
                      label="End"
                      value={tempColors.hero_glow_1_to}
                      onChange={(value) => setTempColors(prev => ({ ...prev, hero_glow_1_to: value }))}
                      description="To color"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Glow Effect 2</p>
                  <div className="grid grid-cols-2 gap-2">
                    <ColorPicker
                      label="Start"
                      value={tempColors.hero_glow_2_from}
                      onChange={(value) => setTempColors(prev => ({ ...prev, hero_glow_2_from: value }))}
                      description="From color"
                    />
                    <ColorPicker
                      label="End"
                      value={tempColors.hero_glow_2_to}
                      onChange={(value) => setTempColors(prev => ({ ...prev, hero_glow_2_to: value }))}
                      description="To color"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services Section Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Services Section</CardTitle>
              <CardDescription>
                Icon gradient colors for the services section
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <ColorPicker
                  label="Icon Gradient Start"
                  value={tempColors.service_icon_gradient_from}
                  onChange={(value) => setTempColors(prev => ({ ...prev, service_icon_gradient_from: value }))}
                  description="Gradient start color"
                />
                <ColorPicker
                  label="Icon Gradient End"
                  value={tempColors.service_icon_gradient_to}
                  onChange={(value) => setTempColors(prev => ({ ...prev, service_icon_gradient_to: value }))}
                  description="Gradient end color"
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Section Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Section</CardTitle>
              <CardDescription>
                Background gradient for the Get in Touch section
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <ColorPicker
                  label="Background Gradient Start"
                  value={tempColors.contact_bg_gradient_from}
                  onChange={(value) => setTempColors(prev => ({ ...prev, contact_bg_gradient_from: value }))}
                  description="Left side of gradient"
                />
                <ColorPicker
                  label="Background Gradient End"
                  value={tempColors.contact_bg_gradient_to}
                  onChange={(value) => setTempColors(prev => ({ ...prev, contact_bg_gradient_to: value }))}
                  description="Right side of gradient"
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 justify-between">
            <div className="flex gap-2">
              <Button 
                onClick={handleReset} 
                variant="outline" 
                size="sm"
                disabled={saving}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset to Default
              </Button>
              <ColorExportImport colors={tempColors} onImport={handleImport} />
            </div>
            <Button 
              onClick={handleSave} 
              disabled={!hasChanges || saving}
              className="bg-brand-gradient hover:bg-brand-gradient-hover"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>

        {/* Right Column - Preview */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <ColorPreview colors={tempColors} />
        </div>
      </div>

      {hasChanges && (
        <Card className="border-amber-500 bg-amber-50">
          <CardContent className="pt-6">
            <p className="text-sm text-amber-800">
              ⚠️ You have unsaved changes. Click "Save Changes" to apply them across the site.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProjectSettings;
