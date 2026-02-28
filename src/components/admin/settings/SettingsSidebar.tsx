import { Palette, FileText, Monitor, Layers, MessageSquareQuote, Mail, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SettingsSection = 'brand-colors' | 'content' | 'hero' | 'sections' | 'testimonials' | 'contact' | 'seo';

interface SettingsSidebarProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
}

const sections = [
  { id: 'brand-colors' as const, label: 'Brand Colors', icon: Palette },
  { id: 'content' as const, label: 'Landing Cards', icon: FileText },
  { id: 'hero' as const, label: 'Hero', icon: Monitor },
  { id: 'sections' as const, label: 'Sections', icon: Layers },
  { id: 'testimonials' as const, label: 'Testimonials', icon: MessageSquareQuote },
  { id: 'contact' as const, label: 'Contact', icon: Mail },
  { id: 'seo' as const, label: 'SEO', icon: Search },
];

export const SettingsSidebar = ({ activeSection, onSectionChange }: SettingsSidebarProps) => {
  return (
    <nav className="space-y-1">
      {sections.map((section) => {
        const Icon = section.icon;
        const isActive = activeSection === section.id;
        
        return (
          <button
            key={section.id}
            onClick={() => onSectionChange(section.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="font-medium">{section.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export const SettingsTabs = ({ activeSection, onSectionChange }: SettingsSidebarProps) => {
  return (
    <div className="flex gap-2 border-b border-border pb-4 mb-6 overflow-x-auto">
      {sections.map((section) => {
        const Icon = section.icon;
        const isActive = activeSection === section.id;
        
        return (
          <button
            key={section.id}
            onClick={() => onSectionChange(section.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {section.label}
          </button>
        );
      })}
    </div>
  );
};
