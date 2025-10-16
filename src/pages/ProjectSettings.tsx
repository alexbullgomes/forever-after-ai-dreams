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
  primary_from: "244 63 94", // rose-500
  primary_to: "236 72 153", // pink-500
  primary_hover_from: "225 29 72", // rose-600
  primary_hover_to: "219 39 119" // pink-600
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
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Brand Colors</CardTitle>
              <CardDescription>
                Customize your primary gradient colors. Changes apply instantly to all components.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium text-sm">Primary Gradient</h3>
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
                <h3 className="font-medium text-sm">Hover State Gradient</h3>
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

            <CardFooter className="flex flex-wrap gap-2 justify-between">
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
            </CardFooter>
          </Card>
        </div>

        <div>
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
