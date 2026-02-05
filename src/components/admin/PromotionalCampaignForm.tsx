import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePromotionalCampaignGallery } from "@/hooks/usePromotionalCampaignGallery";
import { TrackingScript } from "@/hooks/usePromotionalCampaign";
import { slugify } from "@/utils/slugify";
import { Loader2, Plus, Trash2, Eye, EyeOff, Edit, Code, Check, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CampaignProductsTab } from "@/components/admin/CampaignProductsTab";
import { CampaignVendorsTab } from "@/components/admin/CampaignVendorsTab";
import { CampaignGalleryItemCard } from "@/components/admin/CampaignGalleryItemCard";
 import { CampaignPackagesTab } from "@/components/admin/CampaignPackagesTab";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";

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
  promotional_footer_enabled: boolean;
  tracking_scripts?: TrackingScript[];
  products_section_enabled: boolean;
  pricing_section_enabled: boolean;
  vendors_section_enabled: boolean;
  vendors_section_headline: string;
  vendors_section_description: string;
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
  const { cards, loading: loadingGallery, createCard, updateCard, deleteCard, reorderCards } = usePromotionalCampaignGallery(campaign?.id);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = cards.findIndex((card) => card.id === active.id);
        const newIndex = cards.findIndex((card) => card.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const reorderedCards = arrayMove(cards, oldIndex, newIndex);
          const updates = reorderedCards.map((card, index) => ({
            id: card.id,
            order_index: index,
          }));
          await reorderCards(updates);
        }
      }
    },
    [cards, reorderCards]
  );
  
  // Tracking scripts state
  const [trackingScripts, setTrackingScripts] = useState<TrackingScript[]>([]);
  const [isScriptDialogOpen, setIsScriptDialogOpen] = useState(false);
  const [editingScript, setEditingScript] = useState<TrackingScript | null>(null);
  const [scriptToDelete, setScriptToDelete] = useState<string | null>(null);
  const [scriptForm, setScriptForm] = useState({
    provider: '',
    name: '',
    placement: 'head' as 'head' | 'body_end',
    code: '',
    enabled: true,
  });

  const [newGalleryItem, setNewGalleryItem] = useState({
    title: '',
    subtitle: '',
    category: '',
    thumb_mp4_url: '',
    thumb_image_url: '',
    full_video_url: '',
  });
  
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
    promotional_footer_enabled: false,
    tracking_scripts: [],
    products_section_enabled: false,
    pricing_section_enabled: true,
    vendors_section_enabled: false,
    vendors_section_headline: 'Our Partners',
    vendors_section_description: '',
  });

  // Tracking script handlers
  const handleAddScript = () => {
    setEditingScript(null);
    setScriptForm({
      provider: '',
      name: '',
      placement: 'head',
      code: '',
      enabled: true,
    });
    setIsScriptDialogOpen(true);
  };

  const handleEditScript = (script: TrackingScript) => {
    setEditingScript(script);
    setScriptForm({
      provider: script.provider,
      name: script.name,
      placement: script.placement,
      code: script.code,
      enabled: script.enabled,
    });
    setIsScriptDialogOpen(true);
  };

  const handleSaveScript = () => {
    if (!scriptForm.name.trim() || !scriptForm.code.trim()) {
      toast({
        title: "Error",
        description: "Name and code are required",
        variant: "destructive",
      });
      return;
    }

    if (!scriptForm.code.includes('<script')) {
      toast({
        title: "Error",
        description: "Code must contain a <script> tag",
        variant: "destructive",
      });
      return;
    }

    const newScript: TrackingScript = {
      id: editingScript?.id || crypto.randomUUID(),
      provider: scriptForm.provider.trim(),
      name: scriptForm.name.trim(),
      placement: scriptForm.placement,
      code: scriptForm.code.trim(),
      enabled: scriptForm.enabled,
      created_at: editingScript?.created_at || new Date().toISOString(),
    };

    if (editingScript) {
      setTrackingScripts(scripts => 
        scripts.map(s => s.id === editingScript.id ? newScript : s)
      );
      toast({
        title: "Success",
        description: "Tracking script updated",
      });
    } else {
      setTrackingScripts(scripts => [...scripts, newScript]);
      toast({
        title: "Success",
        description: "Tracking script added",
      });
    }

    setIsScriptDialogOpen(false);
  };

  const handleDeleteScript = (scriptId: string) => {
    setTrackingScripts(scripts => scripts.filter(s => s.id !== scriptId));
    setScriptToDelete(null);
    toast({
      title: "Success",
      description: "Tracking script deleted",
    });
  };

  const handleToggleScript = (scriptId: string) => {
    setTrackingScripts(scripts =>
      scripts.map(s => s.id === scriptId ? { ...s, enabled: !s.enabled } : s)
    );
  };

  const getProviderBadgeColor = (provider: string) => {
    const p = provider.toLowerCase();
    if (p.includes('meta') || p.includes('facebook')) return 'bg-blue-500';
    if (p.includes('google')) return 'bg-gradient-to-r from-red-500 via-yellow-500 to-green-500';
    if (p.includes('tiktok')) return 'bg-gradient-to-r from-black to-cyan-500';
    return 'bg-gray-500';
  };

  useEffect(() => {
    if (campaign) {
      setFormData({
        ...campaign,
        products_section_enabled: campaign.products_section_enabled ?? false,
        pricing_section_enabled: campaign.pricing_section_enabled ?? true,
        vendors_section_enabled: campaign.vendors_section_enabled ?? false,
        vendors_section_headline: campaign.vendors_section_headline ?? 'Our Partners',
        vendors_section_description: campaign.vendors_section_description ?? '',
      });
      setTrackingScripts(campaign.tracking_scripts || []);
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
      const campaignData = {
        ...formData,
        tracking_scripts: trackingScripts as any,
      };

      if (campaign?.id) {
        const { error } = await supabase
          .from('promotional_campaigns')
          .update(campaignData)
          .eq('id', campaign.id);

        if (error) throw error;

        toast({
          title: "Campaign updated",
          description: "Promotional campaign has been updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from('promotional_campaigns')
          .insert([campaignData]);

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
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {campaign ? 'Edit Campaign' : 'Create New Campaign'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-8">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="banner">Banner</TabsTrigger>
                <TabsTrigger value="packages">Packages</TabsTrigger>
                <TabsTrigger value="gallery" disabled={!campaign}>Gallery</TabsTrigger>
                <TabsTrigger value="products" disabled={!campaign}>Products</TabsTrigger>
                <TabsTrigger value="vendors" disabled={!campaign}>Vendors</TabsTrigger>
                <TabsTrigger value="ads">Ads</TabsTrigger>
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

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="promotional_footer_enabled"
                      checked={formData.promotional_footer_enabled}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, promotional_footer_enabled: checked }))
                      }
                      disabled={!formData.is_active}
                    />
                    <Label htmlFor="promotional_footer_enabled">Show Footer on Home</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Display this campaign in the fixed footer on the homepage. Only one campaign can have this enabled at a time.
                  </p>
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

              <TabsContent value="packages" className="space-y-6">
                <CampaignPackagesTab
                  campaignId={campaign?.id}
                  pricingSectionEnabled={formData.pricing_section_enabled}
                  onPricingSectionToggle={(enabled) =>
                    setFormData((prev) => ({ ...prev, pricing_section_enabled: enabled }))
                  }
                />
              </TabsContent>

              {/* Gallery Tab */}
              <TabsContent value="gallery" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Gallery Items</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Drag items to reorder. Changes save automatically.
                    </p>
                  </CardHeader>
                  <CardContent>
                    {loadingGallery ? (
                      <p>Loading gallery items...</p>
                    ) : cards && cards.length > 0 ? (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={cards.map((card) => card.id)}
                          strategy={rectSortingStrategy}
                        >
                          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                            {cards.map((card) => (
                              <CampaignGalleryItemCard
                                key={card.id}
                                card={card}
                                onUpdate={updateCard}
                                onDelete={deleteCard}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        No gallery items yet. Add one below.
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Add New Gallery Item</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="new-title">Title</Label>
                      <Input
                        id="new-title"
                        value={newGalleryItem.title}
                        onChange={(e) => setNewGalleryItem({ ...newGalleryItem, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-subtitle">Subtitle</Label>
                      <Input
                        id="new-subtitle"
                        value={newGalleryItem.subtitle}
                        onChange={(e) => setNewGalleryItem({ ...newGalleryItem, subtitle: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-category">Category</Label>
                      <Input
                        id="new-category"
                        value={newGalleryItem.category}
                        onChange={(e) => setNewGalleryItem({ ...newGalleryItem, category: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-thumb_mp4_url">Thumbnail MP4 URL</Label>
                      <Input
                        id="new-thumb_mp4_url"
                        value={newGalleryItem.thumb_mp4_url}
                        onChange={(e) => setNewGalleryItem({ ...newGalleryItem, thumb_mp4_url: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-thumb_image_url">Thumbnail Image URL</Label>
                      <Input
                        id="new-thumb_image_url"
                        value={newGalleryItem.thumb_image_url}
                        onChange={(e) => setNewGalleryItem({ ...newGalleryItem, thumb_image_url: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-full_video_url">Full Video URL</Label>
                      <Input
                        id="new-full_video_url"
                        value={newGalleryItem.full_video_url}
                        onChange={(e) => setNewGalleryItem({ ...newGalleryItem, full_video_url: e.target.value })}
                      />
                    </div>
                    <Button onClick={() => createCard({
                      ...newGalleryItem,
                      campaign_id: campaign?.id || '',
                      order_index: 0,
                      featured: false,
                      is_published: true,
                      full_video_enabled: false,
                    })}>Create Gallery Item</Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Products Tab */}
              <TabsContent value="products">
                <CampaignProductsTab
                  campaignId={campaign?.id}
                  productsSectionEnabled={formData.products_section_enabled}
                  onToggleProductsSection={(enabled) =>
                    setFormData((prev) => ({ ...prev, products_section_enabled: enabled }))
                  }
                />
              </TabsContent>

              {/* Vendors Tab */}
              <TabsContent value="vendors">
                <CampaignVendorsTab
                  campaignId={campaign?.id}
                  vendorsSectionEnabled={formData.vendors_section_enabled}
                  vendorsSectionHeadline={formData.vendors_section_headline}
                  vendorsSectionDescription={formData.vendors_section_description}
                  onSectionEnabledChange={(enabled) =>
                    setFormData((prev) => ({ ...prev, vendors_section_enabled: enabled }))
                  }
                  onHeadlineChange={(headline) =>
                    setFormData((prev) => ({ ...prev, vendors_section_headline: headline }))
                  }
                  onDescriptionChange={(description) =>
                    setFormData((prev) => ({ ...prev, vendors_section_description: description }))
                  }
                />
              </TabsContent>

              {/* Ads Tab */}
              <TabsContent value="ads" className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Tracking Scripts</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage tracking pixels and analytics scripts for this campaign
                    </p>
                  </div>
                  <Button type="button" onClick={handleAddScript}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Script
                  </Button>
                </div>

                {trackingScripts.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <Code className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">No tracking scripts configured</p>
                    <Button type="button" onClick={handleAddScript} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Script
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {trackingScripts.map((script) => (
                      <div
                        key={script.id}
                        className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 text-xs font-semibold text-white rounded ${getProviderBadgeColor(script.provider)}`}
                            >
                              {script.provider || 'Custom'}
                            </span>
                            <span className="font-medium">{script.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {script.placement === 'head' ? '📍 HEAD' : '📍 BODY_END'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono truncate">
                            {script.code.substring(0, 80)}...
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={script.enabled}
                            onCheckedChange={() => handleToggleScript(script.id)}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditScript(script)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setScriptToDelete(script.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* SEO Tab */}
              <TabsContent value="seo" className="space-y-4">
                <div>
                  <Label htmlFor="meta_title">Meta Title</Label>
                  <Input
                    id="meta_title"
                    value={formData.meta_title || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                    placeholder="Optimized page title for SEO"
                  />
                </div>
                <div>
                  <Label htmlFor="meta_description">Meta Description</Label>
                  <Textarea
                    id="meta_description"
                    value={formData.meta_description || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                    placeholder="Brief description for search engines"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="meta_image_url">Meta Image URL</Label>
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
                {campaign ? 'Update Campaign' : 'Create Campaign'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Tracking Script Dialog */}
      <Dialog open={isScriptDialogOpen} onOpenChange={setIsScriptDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingScript ? 'Edit Tracking Script' : 'Add Tracking Script'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Input
                id="provider"
                placeholder="e.g., Meta, Google, TikTok"
                value={scriptForm.provider}
                onChange={(e) => setScriptForm({ ...scriptForm, provider: e.target.value })}
                maxLength={50}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="script-name">Name/Label *</Label>
              <Input
                id="script-name"
                placeholder="e.g., Meta Pixel - Main"
                value={scriptForm.name}
                onChange={(e) => setScriptForm({ ...scriptForm, name: e.target.value })}
                maxLength={100}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="placement">Placement *</Label>
              <Select
                value={scriptForm.placement}
                onValueChange={(value: 'head' | 'body_end') => 
                  setScriptForm({ ...scriptForm, placement: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="head">{"<head> - Page Header"}</SelectItem>
                  <SelectItem value="body_end">{"Before </body> - Page Footer"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="script-code">Script Code *</Label>
              <Textarea
                id="script-code"
                placeholder="<script>/* Your tracking code here */</script>"
                value={scriptForm.code}
                onChange={(e) => setScriptForm({ ...scriptForm, code: e.target.value })}
                className="font-mono text-xs"
                rows={10}
                required
              />
              <p className="text-xs text-muted-foreground">
                Paste your complete tracking script including {"<script>"} tags
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="script-enabled"
                checked={scriptForm.enabled}
                onCheckedChange={(checked) => setScriptForm({ ...scriptForm, enabled: checked })}
              />
              <Label htmlFor="script-enabled">Enabled (inject on page load)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsScriptDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveScript}>
              {editingScript ? 'Update Script' : 'Add Script'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!scriptToDelete} onOpenChange={() => setScriptToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tracking Script?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this tracking script from the campaign. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => scriptToDelete && handleDeleteScript(scriptToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PromotionalCampaignForm;
