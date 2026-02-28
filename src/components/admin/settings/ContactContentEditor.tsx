import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ContactContent, HomepageContentKey } from '@/hooks/useHomepageContent';

interface Props {
  content: ContactContent;
  updateSection: (key: HomepageContentKey, value: any) => Promise<boolean>;
}

const PLATFORMS = ['instagram', 'tiktok', 'whatsapp', 'facebook', 'youtube', 'twitter', 'linkedin', 'pinterest'];

export const ContactContentEditor = ({ content, updateSection }: Props) => {
  const [temp, setTemp] = useState<ContactContent>(content);
  const hasChanges = JSON.stringify(temp) !== JSON.stringify(content);

  useEffect(() => { setTemp(content); }, [content]);

  const update = (field: keyof ContactContent, value: any) => setTemp(prev => ({ ...prev, [field]: value }));

  const updateLink = (i: number, field: 'platform' | 'url', value: string) => {
    const links = [...temp.social_links];
    links[i] = { ...links[i], [field]: value };
    update('social_links', links);
  };

  const addLink = () => update('social_links', [...temp.social_links, { platform: 'instagram', url: '' }]);
  const removeLink = (i: number) => update('social_links', temp.social_links.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    const ok = await updateSection('homepage_contact', temp);
    toast(ok ? { title: 'Contact content saved' } : { title: 'Failed to save', variant: 'destructive' });
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
          <div><Label>Form Title</Label><Input value={temp.form_title} onChange={e => update('form_title', e.target.value)} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Contact Info</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Email</Label><Input value={temp.email} onChange={e => update('email', e.target.value)} /></div>
            <div><Label>Phone</Label><Input value={temp.phone} onChange={e => update('phone', e.target.value)} /></div>
          </div>
          <div><Label>WhatsApp URL</Label><Input value={temp.whatsapp_url} onChange={e => update('whatsapp_url', e.target.value)} /></div>
          <div><Label>Address</Label><Input value={temp.address} onChange={e => update('address', e.target.value)} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Social Links</CardTitle>
          <Button variant="outline" size="sm" onClick={addLink}><Plus className="h-4 w-4 mr-1" />Add</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {temp.social_links.map((link, i) => (
            <div key={i} className="flex items-center gap-2">
              <Select value={link.platform} onValueChange={v => updateLink(i, 'platform', v)}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>{PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
              <Input className="flex-1" value={link.url} onChange={e => updateLink(i, 'url', e.target.value)} placeholder="https://..." />
              <Button variant="ghost" size="icon" onClick={() => removeLink(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Quick Response</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Title</Label><Input value={temp.quick_response_title} onChange={e => update('quick_response_title', e.target.value)} /></div>
          <div><Label>Text</Label><Textarea value={temp.quick_response_text} onChange={e => update('quick_response_text', e.target.value)} rows={3} /></div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!hasChanges}><Save className="h-4 w-4 mr-2" />Save Contact</Button>
      </div>
    </div>
  );
};
