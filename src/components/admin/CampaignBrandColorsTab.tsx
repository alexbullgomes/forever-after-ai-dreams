import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ColorPicker } from "@/components/admin/ColorPicker";
import { BrandColors, THEME_PRESETS, ThemePreset } from "@/hooks/useSiteSettings";

interface CampaignBrandColorsTabProps {
  brandColors: Partial<BrandColors> | null;
  onChange: (colors: Partial<BrandColors> | null) => void;
}

const DEFAULT_COLORS: Partial<BrandColors> = THEME_PRESETS.light;

export const CampaignBrandColorsTab = ({ brandColors, onChange }: CampaignBrandColorsTabProps) => {
  const enabled = brandColors !== null;

  const handleToggle = (checked: boolean) => {
    onChange(checked ? { ...DEFAULT_COLORS } : null);
  };

  const handleColorChange = (key: keyof BrandColors, value: string) => {
    if (!brandColors) return;
    onChange({ ...brandColors, [key]: value });
  };

  const handlePresetCopy = (preset: string) => {
    const presetColors = THEME_PRESETS[preset as ThemePreset];
    if (presetColors) {
      onChange({ ...brandColors, ...presetColors });
    }
  };

  const c = (key: keyof BrandColors) => (brandColors as any)?.[key] || '';

  // Preview swatch
  const previewGradient = enabled && brandColors?.primary_from && brandColors?.primary_to
    ? `linear-gradient(135deg, hsl(${brandColors.primary_from}), hsl(${brandColors.primary_to}))`
    : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-semibold">Custom Brand Colors</Label>
          <p className="text-sm text-muted-foreground">Override global theme colors for this campaign page</p>
        </div>
        <Switch checked={enabled} onCheckedChange={handleToggle} />
      </div>

      {enabled && (
        <>
          {/* Preview + Preset */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label className="text-sm">Copy from preset</Label>
              <Select onValueChange={handlePresetCopy}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a preset..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="ocean">Ocean</SelectItem>
                  <SelectItem value="sunset">Sunset</SelectItem>
                  <SelectItem value="forest">Forest</SelectItem>
                  <SelectItem value="monochrome">Monochrome</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {previewGradient && (
              <div className="flex flex-col items-center gap-1">
                <Label className="text-xs text-muted-foreground">Preview</Label>
                <div className="w-24 h-8 rounded-md border" style={{ background: previewGradient }} />
              </div>
            )}
          </div>

          <Accordion type="multiple" className="w-full">
            {/* Primary Gradient */}
            <AccordionItem value="primary">
              <AccordionTrigger>Primary Gradient (4)</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ColorPicker label="Primary From" value={c('primary_from')} onChange={(v) => handleColorChange('primary_from', v)} />
                  <ColorPicker label="Primary To" value={c('primary_to')} onChange={(v) => handleColorChange('primary_to', v)} />
                  <ColorPicker label="Primary Hover From" value={c('primary_hover_from')} onChange={(v) => handleColorChange('primary_hover_from', v)} />
                  <ColorPicker label="Primary Hover To" value={c('primary_hover_to')} onChange={(v) => handleColorChange('primary_hover_to', v)} />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Icon Backgrounds */}
            <AccordionItem value="icons">
              <AccordionTrigger>Icon Backgrounds (3)</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ColorPicker label="Icon BG Primary" value={c('icon_bg_primary')} onChange={(v) => handleColorChange('icon_bg_primary', v)} />
                  <ColorPicker label="Icon BG Secondary" value={c('icon_bg_secondary')} onChange={(v) => handleColorChange('icon_bg_secondary', v)} />
                  <ColorPicker label="Icon BG Accent" value={c('icon_bg_accent')} onChange={(v) => handleColorChange('icon_bg_accent', v)} />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Text & Badges */}
            <AccordionItem value="text">
              <AccordionTrigger>Text & Badges (4)</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ColorPicker label="Text Accent" value={c('text_accent')} onChange={(v) => handleColorChange('text_accent', v)} />
                  <ColorPicker label="Badge Text" value={c('badge_text')} onChange={(v) => handleColorChange('badge_text', v)} />
                  <ColorPicker label="Stats Text" value={c('stats_text')} onChange={(v) => handleColorChange('stats_text', v)} />
                  <ColorPicker label="Badge Background" value={c('badge_bg')} onChange={(v) => handleColorChange('badge_bg', v)} />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Decorative */}
            <AccordionItem value="decorative">
              <AccordionTrigger>Decorative (1)</AccordionTrigger>
              <AccordionContent>
                <ColorPicker label="Feature Dot" value={c('feature_dot')} onChange={(v) => handleColorChange('feature_dot', v)} />
              </AccordionContent>
            </AccordionItem>

            {/* Hero Section */}
            <AccordionItem value="hero">
              <AccordionTrigger>Hero Section (13)</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ColorPicker label="Hero Overlay" value={c('hero_overlay_color')} onChange={(v) => handleColorChange('hero_overlay_color', v)} />
                  <ColorPicker label="Hero Badge BG" value={c('hero_badge_bg_color')} onChange={(v) => handleColorChange('hero_badge_bg_color', v)} />
                  <ColorPicker label="Hero Badge Icon" value={c('hero_badge_icon')} onChange={(v) => handleColorChange('hero_badge_icon', v)} />
                  <ColorPicker label="Hero Gradient From" value={c('hero_gradient_from')} onChange={(v) => handleColorChange('hero_gradient_from', v)} />
                  <ColorPicker label="Hero Gradient Via" value={c('hero_gradient_via')} onChange={(v) => handleColorChange('hero_gradient_via', v)} />
                  <ColorPicker label="Hero Gradient To" value={c('hero_gradient_to')} onChange={(v) => handleColorChange('hero_gradient_to', v)} />
                  <ColorPicker label="Hero Text Primary" value={c('hero_text_primary')} onChange={(v) => handleColorChange('hero_text_primary', v)} />
                  <ColorPicker label="Hero Text Muted" value={c('hero_text_muted')} onChange={(v) => handleColorChange('hero_text_muted', v)} />
                  <ColorPicker label="Hero Trust Text" value={c('hero_trust_text')} onChange={(v) => handleColorChange('hero_trust_text', v)} />
                  <ColorPicker label="Hero Glow 1 From" value={c('hero_glow_1_from')} onChange={(v) => handleColorChange('hero_glow_1_from', v)} />
                  <ColorPicker label="Hero Glow 1 To" value={c('hero_glow_1_to')} onChange={(v) => handleColorChange('hero_glow_1_to', v)} />
                  <ColorPicker label="Hero Glow 2 From" value={c('hero_glow_2_from')} onChange={(v) => handleColorChange('hero_glow_2_from', v)} />
                  <ColorPicker label="Hero Glow 2 To" value={c('hero_glow_2_to')} onChange={(v) => handleColorChange('hero_glow_2_to', v)} />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Services */}
            <AccordionItem value="services">
              <AccordionTrigger>Services (2)</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ColorPicker label="Service Icon Gradient From" value={c('service_icon_gradient_from')} onChange={(v) => handleColorChange('service_icon_gradient_from', v)} />
                  <ColorPicker label="Service Icon Gradient To" value={c('service_icon_gradient_to')} onChange={(v) => handleColorChange('service_icon_gradient_to', v)} />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Contact */}
            <AccordionItem value="contact">
              <AccordionTrigger>Contact (2)</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ColorPicker label="Contact BG Gradient From" value={c('contact_bg_gradient_from')} onChange={(v) => handleColorChange('contact_bg_gradient_from', v)} />
                  <ColorPicker label="Contact BG Gradient To" value={c('contact_bg_gradient_to')} onChange={(v) => handleColorChange('contact_bg_gradient_to', v)} />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* CTA */}
            <AccordionItem value="cta">
              <AccordionTrigger>CTA (1)</AccordionTrigger>
              <AccordionContent>
                <ColorPicker label="CTA Icon Color" value={c('cta_icon_color')} onChange={(v) => handleColorChange('cta_icon_color', v)} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </>
      )}
    </div>
  );
};
