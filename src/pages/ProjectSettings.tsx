import { useState, useEffect } from 'react';
import { useSiteSettingsAdmin } from '@/hooks/useSiteSettingsAdmin';
import { BrandColors, ThemePreset, THEME_PRESETS } from '@/hooks/useSiteSettings';
import { ColorPicker } from '@/components/admin/ColorPicker';
import { ColorPreview } from '@/components/admin/ColorPreview';
import { ColorExportImport } from '@/components/admin/ColorExportImport';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, RotateCcw, Palette, Sun, Moon, Waves, Sunset, TreeDeciduous } from 'lucide-react';
import { useRole } from '@/hooks/useRole';
import { useNavigate } from 'react-router-dom';

const DEFAULT_COLORS: BrandColors = {
  theme_preset: 'light',
  // Primary gradient colors
  primary_from: "351 95% 71%",
  primary_to: "328 86% 70%",
  primary_hover_from: "350 89% 60%",
  primary_hover_to: "328 86% 60%",
  
  // Icon backgrounds
  icon_bg_primary: "351 95% 71%",
  icon_bg_secondary: "271 91% 65%",
  icon_bg_accent: "328 86% 70%",
  
  // Text accents
  text_accent: "351 95% 71%",
  badge_text: "350 89% 50%",
  stats_text: "351 95% 71%",
  
  // Backgrounds
  badge_bg: "350 100% 97%",
  
  // Decorative elements
  feature_dot: "351 95% 75%",
  
  // Hero section
  hero_overlay_color: "0 0% 0%",
  hero_badge_bg_color: "0 0% 100%",
  hero_badge_icon: "351 95% 71%",
  hero_gradient_from: "351 95% 71%",
  hero_gradient_via: "328 86% 70%",
  hero_gradient_to: "261 90% 76%",
  hero_text_primary: "0 0% 100%",
  hero_text_muted: "0 0% 100%",
  hero_trust_text: "0 0% 100%",
  hero_glow_1_from: "351 95% 71%",
  hero_glow_1_to: "328 86% 70%",
  hero_glow_2_from: "261 90% 76%",
  hero_glow_2_to: "328 86% 70%",
  
  // Services section
  service_icon_gradient_from: "351 95% 71%",
  service_icon_gradient_to: "328 86% 70%",
  
  // Contact section
  contact_bg_gradient_from: "222 47% 11%",
  contact_bg_gradient_to: "350 89% 60%",

  // CTA section icon color
  cta_icon_color: "351 95% 71%",
};

const PRESET_ICONS: Record<ThemePreset, React.ReactNode> = {
  light: <Sun className="w-4 h-4" />,
  dark: <Moon className="w-4 h-4" />,
  ocean: <Waves className="w-4 h-4" />,
  sunset: <Sunset className="w-4 h-4" />,
  forest: <TreeDeciduous className="w-4 h-4" />,
};

const PRESET_LABELS: Record<ThemePreset, string> = {
  light: 'Light (Default)',
  dark: 'Dark Mode',
  ocean: 'Ocean Blue',
  sunset: 'Sunset Orange',
  forest: 'Forest Green',
};

const ProjectSettings = () => {
  const { colors, loading, updateColors, applyPreset, currentTheme } = useSiteSettingsAdmin();
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

  const handlePresetChange = (preset: ThemePreset) => {
    setTempColors(applyPreset(preset, tempColors));
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
        <h1 className="text-3xl font-bold text-foreground">Project Settings</h1>
        <p className="text-muted-foreground mt-2">
          Customize the brand colors used across your entire site
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Color Settings */}
        <div className="space-y-6">
          {/* Theme Preset Selector */}
          <Card className="border-brand-primary-from/20 bg-gradient-to-r from-brand-badge-bg/50 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-brand-primary-from" />
                Theme Presets
              </CardTitle>
              <CardDescription>
                Quickly switch between pre-defined color schemes
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <Select 
                value={tempColors.theme_preset || 'light'} 
                onValueChange={(value) => handlePresetChange(value as ThemePreset)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a theme preset" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(THEME_PRESETS) as ThemePreset[]).map((preset) => (
                    <SelectItem key={preset} value={preset}>
                      <div className="flex items-center gap-2">
                        {PRESET_ICONS[preset]}
                        <span>{PRESET_LABELS[preset]}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-2">
                {(Object.keys(THEME_PRESETS) as ThemePreset[]).map((preset) => (
                  <Button
                    key={preset}
                    variant={tempColors.theme_preset === preset ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePresetChange(preset)}
                    className={tempColors.theme_preset === preset ? "bg-brand-gradient" : ""}
                  >
                    {PRESET_ICONS[preset]}
                    <span className="ml-1">{preset.charAt(0).toUpperCase() + preset.slice(1)}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

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
                <h3 className="font-medium text-sm text-foreground">Default State</h3>
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
                <h3 className="font-medium text-sm text-foreground">Hover State</h3>
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
                  <p className="text-sm font-medium text-foreground">Glow Effect 1</p>
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
                  <p className="text-sm font-medium text-foreground">Glow Effect 2</p>
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

          {/* CTA Section Icon */}
          <Card>
            <CardHeader>
              <CardTitle>CTA Section Icon</CardTitle>
              <CardDescription>
                Video icon color in the "Ready to Capture Your Love Story?" section
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <ColorPicker
                label="Video Icon Color"
                value={tempColors.cta_icon_color}
                onChange={(value) => setTempColors(prev => ({ ...prev, cta_icon_color: value }))}
                description="Icon color"
              />
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
        <Card className="border-warning bg-warning-light">
          <CardContent className="pt-6">
            <p className="text-sm text-warning-text">
              ⚠️ You have unsaved changes. Click "Save Changes" to apply them across the site.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProjectSettings;
