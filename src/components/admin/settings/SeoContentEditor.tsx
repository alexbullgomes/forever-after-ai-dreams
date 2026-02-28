import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { SeoContent, HomepageContentKey } from '@/hooks/useHomepageContent';

interface Props {
  content: SeoContent;
  updateSection: (key: HomepageContentKey, value: any) => Promise<boolean>;
}

export const SeoContentEditor = ({ content, updateSection }: Props) => {
  const [temp, setTemp] = useState<SeoContent>(content);
  const hasChanges = JSON.stringify(temp) !== JSON.stringify(content);

  useEffect(() => { setTemp(content); }, [content]);

  const update = (field: keyof SeoContent, value: any) => setTemp(prev => ({ ...prev, [field]: value }));

  const updateUrl = (i: number, value: string) => {
    const urls = [...temp.social_urls];
    urls[i] = value;
    update('social_urls', urls);
  };

  const addUrl = () => update('social_urls', [...temp.social_urls, '']);
  const removeUrl = (i: number) => update('social_urls', temp.social_urls.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!temp.business_name.trim()) {
      toast({ title: 'Business name is required', variant: 'destructive' });
      return;
    }
    const ok = await updateSection('homepage_seo', temp);
    toast(ok ? { title: 'SEO settings saved' } : { title: 'Failed to save', variant: 'destructive' });
  };

  return (
    <div className="space-y-6">
      {hasChanges && (
        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-4 py-2 rounded-lg text-sm">
          <AlertCircle className="h-4 w-4" /> Unsaved changes
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Business Info</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Business Name</Label><Input value={temp.business_name} onChange={e => update('business_name', e.target.value)} /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Phone</Label><Input value={temp.phone} onChange={e => update('phone', e.target.value)} /></div>
            <div><Label>Email</Label><Input value={temp.email} onChange={e => update('email', e.target.value)} /></div>
          </div>
          <div><Label>Address / Locality</Label><Input value={temp.address_locality} onChange={e => update('address_locality', e.target.value)} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>SEO Meta Tags</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>SEO Title</Label><Input value={temp.seo_title} onChange={e => update('seo_title', e.target.value)} maxLength={60} /><p className="text-xs text-muted-foreground mt-1">{temp.seo_title.length}/60 characters</p></div>
          <div><Label>SEO Description</Label><Textarea value={temp.seo_description} onChange={e => update('seo_description', e.target.value)} rows={3} maxLength={160} /><p className="text-xs text-muted-foreground mt-1">{temp.seo_description.length}/160 characters</p></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Social URLs (Schema)</CardTitle>
          <Button variant="outline" size="sm" onClick={addUrl}><Plus className="h-4 w-4 mr-1" />Add</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {temp.social_urls.map((url, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input className="flex-1" value={url} onChange={e => updateUrl(i, e.target.value)} placeholder="https://..." />
              <Button variant="ghost" size="icon" onClick={() => removeUrl(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!hasChanges}><Save className="h-4 w-4 mr-2" />Save SEO</Button>
      </div>
    </div>
  );
};
