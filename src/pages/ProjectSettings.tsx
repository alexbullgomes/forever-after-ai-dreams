import { useState, useEffect } from 'react';
import { useRole } from '@/hooks/useRole';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { SettingsSidebar, SettingsTabs, SettingsSection } from '@/components/admin/settings/SettingsSidebar';
import { BrandColorsSection } from '@/components/admin/settings/BrandColorsSection';
import { ContentSection } from '@/components/admin/settings/ContentSection';
import { useIsMobile } from '@/hooks/use-mobile';

const ProjectSettings = () => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('brand-colors');
  const { hasRole, loading: roleLoading } = useRole('admin');
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Redirect non-admins
  useEffect(() => {
    if (!roleLoading && !hasRole) {
      navigate('/');
    }
  }, [hasRole, roleLoading, navigate]);

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasRole) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Project Settings</h1>
          <p className="text-muted-foreground mt-2">
            Customize your site's appearance and content
          </p>
        </div>

        {/* Mobile: Tabs at top */}
        {isMobile && (
          <SettingsTabs 
            activeSection={activeSection} 
            onSectionChange={setActiveSection} 
          />
        )}

        <div className="flex gap-8">
          {/* Desktop: Sidebar */}
          {!isMobile && (
            <div className="w-56 flex-shrink-0">
              <div className="sticky top-8">
                <SettingsSidebar 
                  activeSection={activeSection} 
                  onSectionChange={setActiveSection} 
                />
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {activeSection === 'brand-colors' && <BrandColorsSection />}
            {activeSection === 'content' && <ContentSection />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectSettings;
