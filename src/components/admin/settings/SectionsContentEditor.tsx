import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ServicesHeaderContent, PortfolioHeaderContent, BlogHeaderContent, HomepageContentKey } from '@/hooks/useHomepageContent';

interface Props {
  servicesContent: ServicesHeaderContent;
  portfolioContent: PortfolioHeaderContent;
  blogContent: BlogHeaderContent;
  updateSection: (key: HomepageContentKey, value: any) => Promise<boolean>;
}

const ICON_OPTIONS = ['Clock', 'Award', 'Heart', 'Camera', 'Video', 'Star', 'Shield', 'Zap', 'Users', 'Sparkles'];

export const SectionsContentEditor = ({ servicesContent, portfolioContent, blogContent, updateSection }: Props) => {
  const [services, setServices] = useState(servicesContent);
  const [portfolio, setPortfolio] = useState(portfolioContent);
  const [blog, setBlog] = useState(blogContent);

  const hasChanges =
    JSON.stringify(services) !== JSON.stringify(servicesContent) ||
    JSON.stringify(portfolio) !== JSON.stringify(portfolioContent) ||
    JSON.stringify(blog) !== JSON.stringify(blogContent);

  useEffect(() => { setServices(servicesContent); }, [servicesContent]);
  useEffect(() => { setPortfolio(portfolioContent); }, [portfolioContent]);
  useEffect(() => { setBlog(blogContent); }, [blogContent]);

  const updateFeature = (i: number, field: string, value: string) => {
    const feats = [...services.additional_features];
    feats[i] = { ...feats[i], [field]: value };
    setServices(prev => ({ ...prev, additional_features: feats }));
  };

  const addFeature = () => setServices(prev => ({ ...prev, additional_features: [...prev.additional_features, { icon: 'Star', title: '', description: '' }] }));
  const removeFeature = (i: number) => setServices(prev => ({ ...prev, additional_features: prev.additional_features.filter((_, idx) => idx !== i) }));

  const updateFilter = (i: number, field: 'id' | 'label', value: string) => {
    const filters = [...portfolio.filters];
    filters[i] = { ...filters[i], [field]: value };
    setPortfolio(prev => ({ ...prev, filters }));
  };

  const addFilter = () => setPortfolio(prev => ({ ...prev, filters: [...prev.filters, { id: '', label: '' }] }));
  const removeFilter = (i: number) => setPortfolio(prev => ({ ...prev, filters: prev.filters.filter((_, idx) => idx !== i) }));

  const handleSave = async () => {
    const results = await Promise.all([
      JSON.stringify(services) !== JSON.stringify(servicesContent) ? updateSection('homepage_services_header', services) : true,
      JSON.stringify(portfolio) !== JSON.stringify(portfolioContent) ? updateSection('homepage_portfolio_header', portfolio) : true,
      JSON.stringify(blog) !== JSON.stringify(blogContent) ? updateSection('homepage_blog_header', blog) : true,
    ]);
    const allOk = results.every(Boolean);
    toast(allOk ? { title: 'Sections content saved' } : { title: 'Some sections failed to save', variant: 'destructive' });
  };

  return (
    <div className="space-y-6">
      {hasChanges && (
        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-4 py-2 rounded-lg text-sm">
          <AlertCircle className="h-4 w-4" /> Unsaved changes
        </div>
      )}

      <Accordion type="multiple" defaultValue={['services', 'portfolio', 'blog']} className="space-y-4">
        <AccordionItem value="services" className="border rounded-lg px-4">
          <AccordionTrigger className="text-lg font-semibold">Services Header</AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div><Label>Badge Text</Label><Input value={services.badge_text} onChange={e => setServices(p => ({ ...p, badge_text: e.target.value }))} /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Title Line 1</Label><Input value={services.title_line1} onChange={e => setServices(p => ({ ...p, title_line1: e.target.value }))} /></div>
              <div><Label>Title Line 2</Label><Input value={services.title_line2} onChange={e => setServices(p => ({ ...p, title_line2: e.target.value }))} /></div>
            </div>
            <div><Label>Subtitle</Label><Textarea value={services.subtitle} onChange={e => setServices(p => ({ ...p, subtitle: e.target.value }))} rows={2} /></div>

            <div className="flex items-center justify-between mt-4">
              <Label className="text-base font-semibold">Additional Features</Label>
              <Button variant="outline" size="sm" onClick={addFeature}><Plus className="h-4 w-4 mr-1" />Add</Button>
            </div>
            {services.additional_features.map((feat, i) => (
              <Card key={i} className="p-3">
                <div className="flex items-start gap-2">
                  <div className="space-y-2 flex-1">
                    <div className="flex gap-2">
                      <div className="w-32">
                        <Label className="text-xs">Icon</Label>
                        <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={feat.icon} onChange={e => updateFeature(i, 'icon', e.target.value)}>
                          {ICON_OPTIONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                        </select>
                      </div>
                      <div className="flex-1"><Label className="text-xs">Title</Label><Input value={feat.title} onChange={e => updateFeature(i, 'title', e.target.value)} /></div>
                    </div>
                    <div><Label className="text-xs">Description</Label><Input value={feat.description} onChange={e => updateFeature(i, 'description', e.target.value)} /></div>
                  </div>
                  <Button variant="ghost" size="icon" className="mt-5" onClick={() => removeFeature(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </Card>
            ))}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="portfolio" className="border rounded-lg px-4">
          <AccordionTrigger className="text-lg font-semibold">Portfolio Header</AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div><Label>Badge Text</Label><Input value={portfolio.badge_text} onChange={e => setPortfolio(p => ({ ...p, badge_text: e.target.value }))} /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Title Line 1</Label><Input value={portfolio.title_line1} onChange={e => setPortfolio(p => ({ ...p, title_line1: e.target.value }))} /></div>
              <div><Label>Title Line 2</Label><Input value={portfolio.title_line2} onChange={e => setPortfolio(p => ({ ...p, title_line2: e.target.value }))} /></div>
            </div>
            <div><Label>Subtitle</Label><Textarea value={portfolio.subtitle} onChange={e => setPortfolio(p => ({ ...p, subtitle: e.target.value }))} rows={2} /></div>
            <div><Label>CTA Button Text</Label><Input value={portfolio.cta_text} onChange={e => setPortfolio(p => ({ ...p, cta_text: e.target.value }))} /></div>

            <div className="flex items-center justify-between mt-4">
              <Label className="text-base font-semibold">Filters</Label>
              <Button variant="outline" size="sm" onClick={addFilter}><Plus className="h-4 w-4 mr-1" />Add</Button>
            </div>
            {portfolio.filters.map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input className="w-32" value={f.id} onChange={e => updateFilter(i, 'id', e.target.value)} placeholder="ID" />
                <Input className="flex-1" value={f.label} onChange={e => updateFilter(i, 'label', e.target.value)} placeholder="Label" />
                <Button variant="ghost" size="icon" onClick={() => removeFilter(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="blog" className="border rounded-lg px-4">
          <AccordionTrigger className="text-lg font-semibold">Blog Header</AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div><Label>Badge Text</Label><Input value={blog.badge_text} onChange={e => setBlog(p => ({ ...p, badge_text: e.target.value }))} /></div>
            <div><Label>Title</Label><Input value={blog.title} onChange={e => setBlog(p => ({ ...p, title: e.target.value }))} /></div>
            <div><Label>Subtitle</Label><Textarea value={blog.subtitle} onChange={e => setBlog(p => ({ ...p, subtitle: e.target.value }))} rows={2} /></div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!hasChanges}><Save className="h-4 w-4 mr-2" />Save Sections</Button>
      </div>
    </div>
  );
};
