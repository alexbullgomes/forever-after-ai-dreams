import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { slugify } from "@/utils/slugify";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface Campaign {
  id?: string;
  slug: string;
  title: string;
  banner_video_url?: string;
  banner_poster_url?: string;
  banner_headline: string;
  banner_subheadline: string;
  banner_tagline: string;
  pricing_card_1_enabled: boolean;
  pricing_card_1_title: string;
  pricing_card_1_price: string;
  pricing_card_1_description: string;
  pricing_card_1_features: string[];
  pricing_card_1_popular: boolean;
  pricing_card_1_ideal_for?: string;
  pricing_card_2_enabled: boolean;
  pricing_card_2_title: string;
  pricing_card_2_price: string;
  pricing_card_2_description: string;
  pricing_card_2_features: string[];
  pricing_card_2_popular: boolean;
  pricing_card_2_ideal_for?: string;
  pricing_card_3_enabled: boolean;
  pricing_card_3_title: string;
  pricing_card_3_price: string;
  pricing_card_3_description: string;
  pricing_card_3_features: string[];
  pricing_card_3_popular: boolean;
  pricing_card_3_ideal_for?: string;
  meta_title?: string;
  meta_description?: string;
  meta_image_url?: string;
  is_active: boolean;
}

interface PromotionalCampaignFormProps {
  isOpen: boolean;
  onClose: () => void;
  campaign?: Campaign | null;
  onSuccess: () => void;
}

const PromotionalCampaignForm = ({ isOpen, onClose, campaign, onSuccess }: PromotionalCampaignFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Campaign>({
    slug: '',
    title: '',
    banner_headline: 'Everafter',
    banner_subheadline: 'Memories That Lasts',
    banner_tagline: 'California-based visual storytelling brand capturing life\'s most precious moments',
    pricing_card_1_enabled: true,
    pricing_card_1_title: 'Photography Session',
    pricing_card_1_price: '$250–$1200',
    pricing_card_1_description: 'Professional photography capturing your special moments',
    pricing_card_1_features: ['High-resolution digital photos', 'Professional editing', 'Online gallery', 'Print rights included'],
    pricing_card_1_popular: false,
    pricing_card_2_enabled: true,
    pricing_card_2_title: 'Photo & Video Combo',
    pricing_card_2_price: 'Personalize',
    pricing_card_2_description: 'Complete coverage with both photography and videography',
    pricing_card_2_features: ['Photography + Videography', 'Full day coverage', 'Edited video highlights', 'Digital photo album'],
    pricing_card_2_popular: true,
    pricing_card_2_ideal_for: 'Perfect for couples who want comprehensive coverage',
    pricing_card_3_enabled: true,
    pricing_card_3_title: 'Videography Session',
    pricing_card_3_price: '$350–$1750',
    pricing_card_3_description: 'Cinematic video production for your event',
    pricing_card_3_features: ['4K video recording', 'Drone footage available', 'Professional audio', 'Highlight reel'],
    pricing_card_3_popular: false,
    is_active: false,
  });

  useEffect(() => {
    if (campaign) {
      setFormData(campaign);
    }
  }, [campaign]);

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: campaign ? prev.slug : slugify(title),
    }));
  };

  const updateFeatures = (cardNum: 1 | 2 | 3, features: string[]) => {
    setFormData(prev => ({
      ...prev,
      [`pricing_card_${cardNum}_features`]: features,
    }));
  };

  const addFeature = (cardNum: 1 | 2 | 3) => {
    const currentFeatures = formData[`pricing_card_${cardNum}_features`];
    updateFeatures(cardNum, [...currentFeatures, '']);
  };

  const removeFeature = (cardNum: 1 | 2 | 3, index: number) => {
    const currentFeatures = formData[`pricing_card_${cardNum}_features`];
    updateFeatures(cardNum, currentFeatures.filter((_, i) => i !== index));
  };

  const updateFeatureText = (cardNum: 1 | 2 | 3, index: number, text: string) => {
    const currentFeatures = [...formData[`pricing_card_${cardNum}_features`]];
    currentFeatures[index] = text;
    updateFeatures(cardNum, currentFeatures);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (campaign?.id) {
        const { error } = await supabase
          .from('promotional_campaigns')
          .update(formData)
          .eq('id', campaign.id);

        if (error) throw error;

        toast({
          title: "Campaign updated",
          description: "Promotional campaign has been updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from('promotional_campaigns')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: "Campaign created",
          description: "Promotional campaign has been created successfully.",
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving campaign:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save campaign",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {campaign ? 'Edit Campaign' : 'Create New Campaign'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="banner">Banner</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div>
                <Label htmlFor="title">Campaign Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: slugify(e.target.value) }))}
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  URL: /promo/{formData.slug}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Active Campaign</Label>
              </div>
            </TabsContent>

            <TabsContent value="banner" className="space-y-4">
              <div>
                <Label htmlFor="banner_video_url">Banner Video URL</Label>
                <Input
                  id="banner_video_url"
                  value={formData.banner_video_url || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, banner_video_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label htmlFor="banner_poster_url">Poster Image URL</Label>
                <Input
                  id="banner_poster_url"
                  value={formData.banner_poster_url || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, banner_poster_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label htmlFor="banner_headline">Headline</Label>
                <Input
                  id="banner_headline"
                  value={formData.banner_headline}
                  onChange={(e) => setFormData(prev => ({ ...prev, banner_headline: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="banner_subheadline">Subheadline</Label>
                <Input
                  id="banner_subheadline"
                  value={formData.banner_subheadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, banner_subheadline: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="banner_tagline">Tagline</Label>
                <Textarea
                  id="banner_tagline"
                  value={formData.banner_tagline}
                  onChange={(e) => setFormData(prev => ({ ...prev, banner_tagline: e.target.value }))}
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-6">
              {[1, 2, 3].map((num) => {
                const cardNum = num as 1 | 2 | 3;
                const prefix = `pricing_card_${cardNum}`;
                return (
                  <div key={num} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Card {num}</h3>
                      <Switch
                        checked={formData[`${prefix}_enabled`]}
                        onCheckedChange={(checked) => 
                          setFormData(prev => ({ ...prev, [`${prefix}_enabled`]: checked }))
                        }
                      />
                    </div>
                    {formData[`${prefix}_enabled`] && (
                      <>
                        <Input
                          placeholder="Title"
                          value={formData[`${prefix}_title`]}
                          onChange={(e) => setFormData(prev => ({ ...prev, [`${prefix}_title`]: e.target.value }))}
                        />
                        <Input
                          placeholder="Price"
                          value={formData[`${prefix}_price`]}
                          onChange={(e) => setFormData(prev => ({ ...prev, [`${prefix}_price`]: e.target.value }))}
                        />
                        <Textarea
                          placeholder="Description"
                          value={formData[`${prefix}_description`]}
                          onChange={(e) => setFormData(prev => ({ ...prev, [`${prefix}_description`]: e.target.value }))}
                          rows={2}
                        />
                        <div>
                          <Label>Features</Label>
                          {formData[`${prefix}_features`].map((feature, idx) => (
                            <div key={idx} className="flex gap-2 mt-2">
                              <Input
                                value={feature}
                                onChange={(e) => updateFeatureText(cardNum, idx, e.target.value)}
                                placeholder="Feature"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeFeature(cardNum, idx)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => addFeature(cardNum)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Feature
                          </Button>
                        </div>
                        <Input
                          placeholder="Ideal For (optional)"
                          value={formData[`${prefix}_ideal_for`] || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, [`${prefix}_ideal_for`]: e.target.value }))}
                        />
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={formData[`${prefix}_popular`]}
                            onCheckedChange={(checked) => 
                              setFormData(prev => ({ ...prev, [`${prefix}_popular`]: checked }))
                            }
                          />
                          <Label>Mark as Popular</Label>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value="seo" className="space-y-4">
              <div>
                <Label htmlFor="meta_title">Meta Title</Label>
                <Input
                  id="meta_title"
                  value={formData.meta_title || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                  placeholder="Leave empty to use campaign title"
                />
              </div>
              <div>
                <Label htmlFor="meta_description">Meta Description</Label>
                <Textarea
                  id="meta_description"
                  value={formData.meta_description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                  rows={3}
                  placeholder="Leave empty to use tagline"
                />
              </div>
              <div>
                <Label htmlFor="meta_image_url">OG Image URL</Label>
                <Input
                  id="meta_image_url"
                  value={formData.meta_image_url || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_image_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {campaign ? 'Update' : 'Create'} Campaign
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PromotionalCampaignForm;
