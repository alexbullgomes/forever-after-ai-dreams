import { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Edit, Trash2, GripVertical, Search, Image as ImageIcon } from 'lucide-react';
import { GalleryCardForm } from '@/components/admin/GalleryCardForm';
import { useGalleryCards, type GalleryCard } from '@/hooks/useGalleryCards';
import { useServiceGalleryCards, type ServiceGalleryCard } from '@/hooks/useServiceGalleryCards';
import { useOurPortfolioGallery, type PortfolioGalleryCard } from '@/hooks/useOurPortfolioGallery';
import { useBusinessContentsGallery, type BusinessContentsGalleryCard } from '@/hooks/useBusinessContentsGallery';
import { useOurWeddingGallery, type OurWeddingGalleryCard } from '@/hooks/useOurWeddingGallery';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

type CombinedGalleryCard = GalleryCard | ServiceGalleryCard | PortfolioGalleryCard | BusinessContentsGalleryCard | OurWeddingGalleryCard;
type GalleryType = 'homepage' | 'services' | 'portfolio' | 'business' | 'wedding';

interface SortableCardItemProps {
  card: CombinedGalleryCard;
  onEdit: (card: CombinedGalleryCard) => void;
  onDelete: (id: string) => void;
  onTogglePublished: (id: string, published: boolean) => void;
  onToggleFeatured: (id: string, featured: boolean) => void;
  selectedGallery: GalleryType;
}

const SortableCardItem = ({ card, onEdit, onDelete, onTogglePublished, onToggleFeatured, selectedGallery }: SortableCardItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'weddings': return 'bg-rose-100 text-rose-800';
      case 'photo': return 'bg-blue-100 text-blue-800';
      case 'video': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card ref={setNodeRef} style={style} className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <div
            className="cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5 text-gray-400" />
          </div>

          <div className="flex-shrink-0">
            {card.thumbnail_url ? (
              <img
                src={card.thumbnail_url}
                alt={card.title}
                className="w-16 h-16 object-cover rounded-lg"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-sm font-medium text-foreground truncate">
                {card.title}
              </h3>
              {card.featured && selectedGallery === 'homepage' && (
                <Badge variant="secondary" className="text-xs">Featured</Badge>
              )}
            </div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Badge className={getCategoryColor(card.category)}>
                {card.category === 'photo' ? 'Photo & Videos' : card.category}
              </Badge>
              {card.location_city && <span>{card.location_city}</span>}
              {card.event_season_or_date && <span>{card.event_season_or_date}</span>}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">#{card.order_index}</span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={card.is_published}
                onCheckedChange={(checked) => onTogglePublished(card.id, checked)}
              />
              <span className="text-xs text-muted-foreground">Published</span>
            </div>

            {('featured' in card) && selectedGallery === 'homepage' && (
              <div className="flex items-center space-x-2">
                <Switch
                  checked={card.featured}
                  onCheckedChange={(checked) => onToggleFeatured(card.id, checked)}
                />
                <span className="text-xs text-muted-foreground">Featured</span>
              </div>
            )}

            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(card)}
              >
                <Edit className="h-4 w-4" />
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Gallery Card</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{card.title}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(card.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function GalleryCardsAdmin() {
  const { user } = useAuth();
  const { hasRole: isAdmin, loading: roleLoading } = useRole('admin');
  const [selectedGallery, setSelectedGallery] = useState<GalleryType>('homepage');
  
  // Gallery hooks
  const homepageGallery = useGalleryCards();
  const serviceGallery = useServiceGalleryCards();
  const portfolioGallery = useOurPortfolioGallery();
  const businessGallery = useBusinessContentsGallery();
  const weddingGallery = useOurWeddingGallery();

  // Get current gallery data based on selection
  const getCurrentGallery = () => {
    switch (selectedGallery) {
      case 'homepage': return homepageGallery;
      case 'services': return serviceGallery;
      case 'portfolio': return portfolioGallery;
      case 'business': return businessGallery;
      case 'wedding': return weddingGallery;
      default: return homepageGallery;
    }
  };

  const { 
    cards, 
    loading, 
    createCard, 
    updateCard, 
    deleteCard, 
    reorderCards 
  } = getCurrentGallery();

  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CombinedGalleryCard | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredCards = cards.filter(card => {
    const matchesSearch = card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.location_city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.subtitle?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || card.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = filteredCards.findIndex(card => card.id === active.id);
    const newIndex = filteredCards.findIndex(card => card.id === over.id);

    const newOrder = arrayMove(filteredCards, oldIndex, newIndex);
    
    const updates = newOrder.map((card, index) => ({
      id: card.id,
      order_index: index + 1
    }));

    try {
      await reorderCards(updates);
    } catch (error) {
      console.error('Error reordering cards:', error);
    }
  };

  // Data filtering functions for different gallery types
  const filterHomepageData = (data: any) => {
    const { full_video_enabled, full_video_url, ...homepageData } = data;
    return {
      ...homepageData,
      collection_key: 'homepage',
      order_index: data.order_index || cards.length + 1
    };
  };

  const filterServiceData = (data: any) => {
    const { collection_key, video_url, video_mp4_url, ...serviceData } = data;
    return {
      ...serviceData,
      order_index: data.order_index || cards.length + 1
    };
  };

  const filterGalleryData = (data: any) => {
    if (selectedGallery === 'homepage') {
      return filterHomepageData(data);
    } else {
      return filterServiceData(data);
    }
  };

  const handleCreateCard = async (cardData: any) => {
    try {
      const filteredData = filterGalleryData(cardData);
      
      await createCard(filteredData);
      toast({
        title: "Success",
        description: "Gallery card created successfully"
      });
    } catch (error) {
      console.error('Error creating gallery card:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create gallery card"
      });
    }
  };

  const handleUpdateCard = async (cardData: any) => {
    if (!editingCard) return;
    
    try {
      const filteredData = filterGalleryData(cardData);
      
      // Remove order_index from update data to avoid changing it accidentally
      const { order_index, ...updateData } = filteredData;
      
      await updateCard(editingCard.id, updateData);
      setEditingCard(null);
      toast({
        title: "Success",
        description: "Gallery card updated successfully"
      });
    } catch (error) {
      console.error('Error updating gallery card:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update gallery card"
      });
    }
  };

  const handleEdit = (card: CombinedGalleryCard) => {
    setEditingCard(card);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCard(null);
  };

  const handleTogglePublished = async (id: string, published: boolean) => {
    await updateCard(id, { is_published: published });
  };

  const handleToggleFeatured = async (id: string, featured: boolean) => {
    await updateCard(id, { featured });
  };

  // Show loading while checking role
  if (roleLoading || loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  // Show error if not authenticated or not admin
  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-error mb-2">Authentication Required</h1>
          <p className="text-muted-foreground">You must be logged in to access the gallery management.</p>
          <p className="text-sm text-muted-foreground mt-2">Please sign in with your admin account.</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-error mb-2">Admin Access Required</h1>
          <p className="text-muted-foreground">You don't have permission to access gallery management.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Current user: {user.email} | Required role: admin
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Gallery Cards</h1>
        <p className="text-muted-foreground">Manage gallery cards and their display order</p>
      </div>

      {/* Gallery Selector */}
      <div className="mb-6">
        <Label htmlFor="gallery-select" className="text-sm font-medium text-foreground mb-2 block">
          Select Gallery
        </Label>
        <Select value={selectedGallery} onValueChange={(value: GalleryType) => setSelectedGallery(value)}>
          <SelectTrigger className="w-64 bg-card border border-border">
            <SelectValue placeholder="Select gallery" />
          </SelectTrigger>
          <SelectContent className="bg-card border border-border shadow-lg z-50">
            <SelectItem value="homepage">Homepage Gallery</SelectItem>
            <SelectItem value="services">EverAfter Gallery</SelectItem>
            <SelectItem value="portfolio">Our Portfolio Gallery</SelectItem>
            <SelectItem value="business">Business Contents</SelectItem>
            <SelectItem value="wedding">Our Wedding Gallery</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search gallery cards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stories</SelectItem>
              <SelectItem value="photo">Photo & Videos</SelectItem>
              <SelectItem value="weddings">Weddings</SelectItem>
              <SelectItem value="video">Video</SelectItem>
            </SelectContent>
          </Select>


          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Card
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="text-sm text-muted-foreground mb-4">
          Showing {filteredCards.length} of {cards.length} cards
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={filteredCards.map(card => card.id)} strategy={verticalListSortingStrategy}>
            {filteredCards.map(card => (
              <SortableCardItem
                key={card.id}
                card={card}
                onEdit={handleEdit}
                onDelete={deleteCard}
                onTogglePublished={handleTogglePublished}
                onToggleFeatured={handleToggleFeatured}
                selectedGallery={selectedGallery}
              />
            ))}
          </SortableContext>
        </DndContext>

        {filteredCards.length === 0 && (
          <div className="text-center py-8">
            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium text-foreground">No gallery cards found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchTerm || categoryFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first gallery card'
              }
            </p>
            {!searchTerm && categoryFilter === 'all' && (
              <div className="mt-6">
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Gallery Card
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

        <GalleryCardForm
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          onSave={editingCard ? handleUpdateCard : handleCreateCard}
          editingCard={editingCard}
          galleryType={selectedGallery === 'homepage' ? 'homepage' : 'services'}
        />
    </div>
  );
}