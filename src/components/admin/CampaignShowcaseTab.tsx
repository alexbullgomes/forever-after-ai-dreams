import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import type { ShowcaseStep, TabMedia } from "@/components/ui/feature-showcase";

interface CampaignShowcaseTabProps {
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
  eyebrow: string;
  onEyebrowChange: (v: string) => void;
  title: string;
  onTitleChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  stats: string[];
  onStatsChange: (v: string[]) => void;
  steps: ShowcaseStep[];
  onStepsChange: (v: ShowcaseStep[]) => void;
  tabs: TabMedia[];
  onTabsChange: (v: TabMedia[]) => void;
  defaultTab: string;
  onDefaultTabChange: (v: string) => void;
  ctaPrimaryText: string;
  onCtaPrimaryTextChange: (v: string) => void;
  ctaPrimaryLink: string;
  onCtaPrimaryLinkChange: (v: string) => void;
  ctaSecondaryText: string;
  onCtaSecondaryTextChange: (v: string) => void;
  ctaSecondaryLink: string;
  onCtaSecondaryLinkChange: (v: string) => void;
}

export function CampaignShowcaseTab({
  enabled, onEnabledChange,
  eyebrow, onEyebrowChange,
  title, onTitleChange,
  description, onDescriptionChange,
  stats, onStatsChange,
  steps, onStepsChange,
  tabs, onTabsChange,
  defaultTab, onDefaultTabChange,
  ctaPrimaryText, onCtaPrimaryTextChange,
  ctaPrimaryLink, onCtaPrimaryLinkChange,
  ctaSecondaryText, onCtaSecondaryTextChange,
  ctaSecondaryLink, onCtaSecondaryLinkChange,
}: CampaignShowcaseTabProps) {
  const [newStat, setNewStat] = useState("");

  return (
    <div className="space-y-6">
      {/* Master toggle */}
      <div className="flex items-center space-x-2">
        <Switch checked={enabled} onCheckedChange={onEnabledChange} />
        <Label>Enable Feature Showcase Section</Label>
      </div>

      {!enabled && (
        <p className="text-sm text-muted-foreground">Enable to configure the showcase section.</p>
      )}

      {enabled && (
        <>
          {/* Text fields */}
          <Card>
            <CardHeader><CardTitle className="text-base">Content</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Eyebrow</Label>
                <Input value={eyebrow} onChange={e => onEyebrowChange(e.target.value)} placeholder="e.g. Experience" />
              </div>
              <div>
                <Label>Title *</Label>
                <Input value={title} onChange={e => onTitleChange(e.target.value)} placeholder="Main heading" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={description} onChange={e => onDescriptionChange(e.target.value)} rows={3} />
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader><CardTitle className="text-base">Stats Chips</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {stats.map((s, i) => (
                  <div key={i} className="flex items-center gap-1 rounded-full border px-3 py-1 text-sm">
                    {s}
                    <button type="button" onClick={() => onStatsChange(stats.filter((_, idx) => idx !== i))} className="ml-1 text-destructive hover:text-destructive/80">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={newStat} onChange={e => setNewStat(e.target.value)} placeholder="New stat chip" className="flex-1" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newStat.trim()) { onStatsChange([...stats, newStat.trim()]); setNewStat(""); } } }} />
                <Button type="button" variant="outline" size="sm" onClick={() => { if (newStat.trim()) { onStatsChange([...stats, newStat.trim()]); setNewStat(""); } }}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Steps */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Accordion Steps</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={() => onStepsChange([...steps, { id: `step-${Date.now()}`, title: "", text: "" }])}>
                  <Plus className="h-4 w-4 mr-1" /> Add Step
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {steps.map((step, i) => (
                <div key={step.id} className="space-y-2 rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Step {i + 1}</Label>
                    <Button type="button" variant="ghost" size="sm" onClick={() => onStepsChange(steps.filter((_, idx) => idx !== i))}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <Input value={step.title} onChange={e => { const n = [...steps]; n[i] = { ...n[i], title: e.target.value }; onStepsChange(n); }} placeholder="Step title" />
                  <Textarea value={step.text} onChange={e => { const n = [...steps]; n[i] = { ...n[i], text: e.target.value }; onStepsChange(n); }} placeholder="Step description" rows={2} />
                </div>
              ))}
              {steps.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No steps yet.</p>}
            </CardContent>
          </Card>

          {/* Tabs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Media Tabs</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={() => onTabsChange([...tabs, { value: `tab-${Date.now()}`, label: "", src: "", alt: "", posterUrl: "" }])}>
                  <Plus className="h-4 w-4 mr-1" /> Add Tab
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {tabs.map((tab, i) => (
                <div key={tab.value} className="space-y-2 rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Tab {i + 1}</Label>
                    <Button type="button" variant="ghost" size="sm" onClick={() => onTabsChange(tabs.filter((_, idx) => idx !== i))}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input value={tab.label} onChange={e => { const n = [...tabs]; n[i] = { ...n[i], label: e.target.value }; onTabsChange(n); }} placeholder="Label" />
                    <Input value={tab.value} onChange={e => { const n = [...tabs]; n[i] = { ...n[i], value: e.target.value }; onTabsChange(n); }} placeholder="Value (unique)" />
                  </div>
                  <Input value={tab.src} onChange={e => { const n = [...tabs]; n[i] = { ...n[i], src: e.target.value }; onTabsChange(n); }} placeholder="Media URL (image or .mp4/.webm video)" />
                  <Input value={tab.posterUrl || ""} onChange={e => { const n = [...tabs]; n[i] = { ...n[i], posterUrl: e.target.value }; onTabsChange(n); }} placeholder="Poster image URL (optional, for videos)" />
                  <Input value={tab.alt || ""} onChange={e => { const n = [...tabs]; n[i] = { ...n[i], alt: e.target.value }; onTabsChange(n); }} placeholder="Alt text" />
                </div>
              ))}
              {tabs.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No tabs yet. Add at least one.</p>}

              {tabs.length > 0 && (
                <div>
                  <Label>Default Active Tab</Label>
                  <Input value={defaultTab} onChange={e => onDefaultTabChange(e.target.value)} placeholder="Tab value to show initially" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* CTAs */}
          <Card>
            <CardHeader><CardTitle className="text-base">Call-to-Action Buttons</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Primary Button Text</Label>
                  <Input value={ctaPrimaryText} onChange={e => onCtaPrimaryTextChange(e.target.value)} placeholder="Get started" />
                </div>
                <div>
                  <Label>Primary Button Link</Label>
                  <Input value={ctaPrimaryLink} onChange={e => onCtaPrimaryLinkChange(e.target.value)} placeholder="https://..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Secondary Button Text</Label>
                  <Input value={ctaSecondaryText} onChange={e => onCtaSecondaryTextChange(e.target.value)} placeholder="Browse examples" />
                </div>
                <div>
                  <Label>Secondary Button Link</Label>
                  <Input value={ctaSecondaryLink} onChange={e => onCtaSecondaryLinkChange(e.target.value)} placeholder="https://..." />
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
