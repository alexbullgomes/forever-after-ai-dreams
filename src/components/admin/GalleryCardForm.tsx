import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { GalleryCard } from '@/hooks/useGalleryCards';

interface GalleryCardFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cardData: any) => Promise<void>;
  editingCard?: any;
  galleryType?: 'homepage' | 'services';
}

export const GalleryCardForm = ({ isOpen, onClose, onSave, editingCard, galleryType = 'homepage' }: GalleryCardFormProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const getInitialFormData = (card?: any) => ({
    collection_key: card?.collection_key || 'homepage',
    slug: card?.slug || '',
    title: card?.title || '',
    subtitle: card?.subtitle || '',
    category: card?.category || '',
    location_city: card?.location_city || '',
    event_season_or_date: card?.event_season_or_date || '',
    thumbnail_url: card?.thumbnail_url || '',
    video_url: card?.video_url || '',
    video_mp4_url: card?.video_mp4_url || '',
    thumb_webm_url: card?.thumb_webm_url || '',
    thumb_mp4_url: card?.thumb_mp4_url || '',
    thumb_image_url: card?.thumb_image_url || '',
    order_index: card?.order_index || 0,
    featured: card?.featured || false,
    is_published: card?.is_published ?? true,
    full_video_enabled: card?.full_video_enabled || false,
    full_video_url: card?.full_video_url || '',
  });

  const [formData, setFormData] = useState(() => getInitialFormData(editingCard));

  // Update form data when editingCard changes
  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData(editingCard));
    }
  }, [editingCard, isOpen]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('gallery')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, thumbnail_url: publicUrl }));
      
      toast({
        title: "Success",
        description: "Image uploaded successfully"
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload image"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.category) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Title and category are required"
      });
      return;
    }

    setSubmitting(true);
    try {
      await onSave(formData);
      onClose();
      if (!editingCard) {
        // Only reset form data if we were creating a new card
        setFormData(getInitialFormData());
      }
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form to original values on cancel
    setFormData(getInitialFormData(editingCard));
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingCard ? 'Edit Gallery Card' : 'Add New Gallery Card'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter card title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="photo">Photo & Videos</SelectItem>
                  <SelectItem value="weddings">Weddings</SelectItem>
                  {galleryType === 'homepage' && <SelectItem value="video">Video</SelectItem>}
            </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input
              id="subtitle"
              value={formData.subtitle}
              onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
              placeholder="Enter card subtitle"
            />
          </div>

          {galleryType === 'homepage' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location/City</Label>
                <Input
                  id="location"
                  value={formData.location_city}
                  onChange={(e) => setFormData(prev => ({ ...prev, location_city: e.target.value }))}
                  placeholder="e.g., San Francisco"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Season/Date</Label>
                <Input
                  id="date"
                  value={formData.event_season_or_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, event_season_or_date: e.target.value }))}
                  placeholder="e.g., Spring 2024"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Thumbnail Image</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              {formData.thumbnail_url ? (
                <div className="relative">
                  <img
                    src={formData.thumbnail_url}
                    alt="Thumbnail preview"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => setFormData(prev => ({ ...prev, thumbnail_url: '' }))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? 'Uploading...' : 'Upload Image'}
                    </Button>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Thumbnail (Video Fallback)</Label>
            <div className="space-y-4 border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="thumb_webm_url">Video WEBM URL</Label>
                  <Input
                    id="thumb_webm_url"
                    value={formData.thumb_webm_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, thumb_webm_url: e.target.value }))}
                    placeholder="https://example.com/video.webm or upload below"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thumb_mp4_url">Video MP4 URL</Label>
                  <Input
                    id="thumb_mp4_url"
                    value={formData.thumb_mp4_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, thumb_mp4_url: e.target.value }))}
                    placeholder="https://example.com/video.mp4 or upload below"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thumb_image_url">Image Fallback URL</Label>
                  <Input
                    id="thumb_image_url"
                    value={formData.thumb_image_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, thumb_image_url: e.target.value }))}
                    placeholder="https://example.com/image.webp or upload below"
                  />
                </div>
              </div>

              {(formData.thumb_webm_url || formData.thumb_mp4_url || formData.thumb_image_url) && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="w-32 h-20 border rounded-lg overflow-hidden">
                    {(formData.thumb_webm_url || formData.thumb_mp4_url) ? (
                      <video
                        className="w-full h-full object-cover"
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        poster={formData.thumb_image_url}
                      >
                        {formData.thumb_webm_url && <source src={formData.thumb_webm_url} type="video/webm" />}
                        {formData.thumb_mp4_url && <source src={formData.thumb_mp4_url} type="video/mp4" />}
                      </video>
                    ) : formData.thumb_image_url ? (
                      <img
                        src={formData.thumb_image_url}
                        alt="Thumbnail preview"
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500">
                <p>• If WEBM is present, MP4 OR Image must be present</p>
                <p>• File uploads limited to 5MB</p>
                <p>• Example URLs: https://hmdnronxajctsrlgrhey.supabase.co/storage/v1/object/public/gallery/Libs.webm</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {galleryType === 'homepage' && (
              <div className="space-y-2">
                <Label htmlFor="video_url">Video URL (YouTube/Vimeo)</Label>
                <Input
                  id="video_url"
                  value={formData.video_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="order">Order Index</Label>
              <Input
                id="order"
                type="number"
                value={formData.order_index}
                onChange={(e) => setFormData(prev => ({ ...prev, order_index: parseInt(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center space-x-6">
              {galleryType === 'homepage' && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="featured"
                    checked={formData.featured}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))}
                  />
                  <Label htmlFor="featured">Featured</Label>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))}
                />
                <Label htmlFor="published">Published</Label>
              </div>

              {galleryType === 'services' && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="full_video_enabled"
                    checked={formData.full_video_enabled}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, full_video_enabled: checked }))}
                  />
                  <Label htmlFor="full_video_enabled">Enable "Watch Full Video"</Label>
                </div>
              )}

              {galleryType === 'services' && formData.full_video_enabled && (
                <div className="mt-4">
                  <Label htmlFor="full_video_url">Full Video URL</Label>
                  <Input
                    id="full_video_url"
                    type="url"
                    value={formData.full_video_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_video_url: e.target.value }))}
                    placeholder="https://youtube.com/watch?v=..."
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-6">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || uploading}>
              {submitting ? 'Saving...' : (editingCard ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};