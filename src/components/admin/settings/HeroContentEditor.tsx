import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { HeroContent, HomepageContentKey } from '@/hooks/useHomepageContent';

interface Props {
  content: HeroContent;
  updateSection: (key: HomepageContentKey, value: any) => Promise<boolean>;
}

export const HeroContentEditor = ({ content, updateSection }: Props) => {
  const [temp, setTemp] = useState<HeroContent>(content);
  const hasChanges = JSON.stringify(temp) !== JSON.stringify(content);

  useEffect(() => { setTemp(content); }, [content]);

  const update = (field: keyof HeroContent, value: any) => setTemp(prev => ({ ...prev, [field]: value }));

  const updateIndicator = (index: number, field: 'emoji' | 'text', value: string) => {
    const items = [...temp.trust_indicators];
    items[index] = { ...items[index], [field]: value };
    update('trust_indicators', items);
  };

  const addIndicator = () => update('trust_indicators', [...temp.trust_indicators, { emoji: '✨', text: '' }]);
  const removeIndicator = (i: number) => update('trust_indicators', temp.trust_indicators.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!temp.headline_line1.trim()) {
      toast({ title: 'Headline is required', variant: 'destructive' });
      return;
    }
    const ok = await updateSection('homepage_hero', temp);
    toast(ok ? { title: 'Hero content saved' } : { title: 'Failed to save', variant: 'destructive' });
  };

  return (
    <div className="space-y-6">
      {hasChanges && (
        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-4 py-2 rounded-lg text-sm">
          <AlertCircle className="h-4 w-4" /> Unsaved changes
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Hero Text</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Badge Text</Label><Input value={temp.badge_text} onChange={e => update('badge_text', e.target.value)} /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Headline Line 1</Label><Input value={temp.headline_line1} onChange={e => update('headline_line1', e.target.value)} /></div>
            <div><Label>Headline Line 2</Label><Input value={temp.headline_line2} onChange={e => update('headline_line2', e.target.value)} /></div>
          </div>
          <div><Label>Description</Label><Textarea value={temp.description} onChange={e => update('description', e.target.value)} rows={3} /></div>
          <div><Label>CTA Button Text</Label><Input value={temp.cta_text} onChange={e => update('cta_text', e.target.value)} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Video & Poster</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>WebM Video URL</Label><Input value={temp.video_webm_url} onChange={e => update('video_webm_url', e.target.value)} placeholder="https://..." /></div>
          <div><Label>MP4 Video URL</Label><Input value={temp.video_mp4_url} onChange={e => update('video_mp4_url', e.target.value)} placeholder="https://..." /></div>
          <div><Label>Poster Image URL</Label><Input value={temp.poster_url} onChange={e => update('poster_url', e.target.value)} placeholder="https://..." /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Trust Indicators</CardTitle>
          <Button variant="outline" size="sm" onClick={addIndicator}><Plus className="h-4 w-4 mr-1" />Add</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {temp.trust_indicators.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input className="w-16" value={item.emoji} onChange={e => updateIndicator(i, 'emoji', e.target.value)} />
              <Input className="flex-1" value={item.text} onChange={e => updateIndicator(i, 'text', e.target.value)} placeholder="Indicator text" />
              <Button variant="ghost" size="icon" onClick={() => removeIndicator(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!hasChanges}><Save className="h-4 w-4 mr-2" />Save Hero</Button>
      </div>
    </div>
  );
};
