import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { TestimonialsContent, HomepageContentKey } from '@/hooks/useHomepageContent';

interface Props {
  content: TestimonialsContent;
  updateSection: (key: HomepageContentKey, value: any) => Promise<boolean>;
}

export const TestimonialsEditor = ({ content, updateSection }: Props) => {
  const [temp, setTemp] = useState<TestimonialsContent>(content);
  const hasChanges = JSON.stringify(temp) !== JSON.stringify(content);

  useEffect(() => { setTemp(content); }, [content]);

  const update = (field: keyof TestimonialsContent, value: any) => setTemp(prev => ({ ...prev, [field]: value }));

  // Stats helpers
  const updateStat = (i: number, field: 'value' | 'label', value: string) => {
    const stats = [...temp.stats];
    stats[i] = { ...stats[i], [field]: value };
    update('stats', stats);
  };
  const addStat = () => update('stats', [...temp.stats, { value: '', label: '' }]);
  const removeStat = (i: number) => update('stats', temp.stats.filter((_, idx) => idx !== i));

  // Testimonials helpers
  const updateTestimonial = (i: number, field: string, value: any) => {
    const items = [...temp.testimonials];
    items[i] = { ...items[i], [field]: value };
    update('testimonials', items);
  };
  const addTestimonial = () => update('testimonials', [...temp.testimonials, { name: '', location: '', rating: 5, text: '', image_url: '' }]);
  const removeTestimonial = (i: number) => update('testimonials', temp.testimonials.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    const ok = await updateSection('homepage_testimonials', temp);
    toast(ok ? { title: 'Testimonials saved' } : { title: 'Failed to save', variant: 'destructive' });
  };

  return (
    <div className="space-y-6">
      {hasChanges && (
        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-4 py-2 rounded-lg text-sm">
          <AlertCircle className="h-4 w-4" /> Unsaved changes
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Section Header</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Badge Text</Label><Input value={temp.badge_text} onChange={e => update('badge_text', e.target.value)} /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Title Line 1</Label><Input value={temp.title_line1} onChange={e => update('title_line1', e.target.value)} /></div>
            <div><Label>Title Line 2</Label><Input value={temp.title_line2} onChange={e => update('title_line2', e.target.value)} /></div>
          </div>
          <div><Label>Subtitle</Label><Textarea value={temp.subtitle} onChange={e => update('subtitle', e.target.value)} rows={2} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Statistics</CardTitle>
          <Button variant="outline" size="sm" onClick={addStat}><Plus className="h-4 w-4 mr-1" />Add</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {temp.stats.map((stat, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input className="w-24" value={stat.value} onChange={e => updateStat(i, 'value', e.target.value)} placeholder="500+" />
              <Input className="flex-1" value={stat.label} onChange={e => updateStat(i, 'label', e.target.value)} placeholder="Label" />
              <Button variant="ghost" size="icon" onClick={() => removeStat(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Testimonials ({temp.testimonials.length})</CardTitle>
          <Button variant="outline" size="sm" onClick={addTestimonial}><Plus className="h-4 w-4 mr-1" />Add</Button>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="space-y-2">
            {temp.testimonials.map((t, i) => (
              <AccordionItem key={i} value={`t-${i}`} className="border rounded-lg px-3">
                <AccordionTrigger className="text-sm font-medium">{t.name || `Testimonial ${i + 1}`}</AccordionTrigger>
                <AccordionContent className="space-y-3 pb-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div><Label className="text-xs">Name</Label><Input value={t.name} onChange={e => updateTestimonial(i, 'name', e.target.value)} /></div>
                    <div><Label className="text-xs">Location</Label><Input value={t.location} onChange={e => updateTestimonial(i, 'location', e.target.value)} /></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Rating</Label>
                      <Select value={String(t.rating)} onValueChange={v => updateTestimonial(i, 'rating', Number(v))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{[1, 2, 3, 4, 5].map(r => <SelectItem key={r} value={String(r)}>{r} Star{r > 1 ? 's' : ''}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label className="text-xs">Image URL</Label><Input value={t.image_url} onChange={e => updateTestimonial(i, 'image_url', e.target.value)} placeholder="/lovable-uploads/..." /></div>
                  </div>
                  <div><Label className="text-xs">Review Text</Label><Textarea value={t.text} onChange={e => updateTestimonial(i, 'text', e.target.value)} rows={3} /></div>
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeTestimonial(i)}><Trash2 className="h-4 w-4 mr-1" />Remove</Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!hasChanges}><Save className="h-4 w-4 mr-2" />Save Testimonials</Button>
      </div>
    </div>
  );
};
