import { useState } from 'react';
import { useNavigationLinksAdmin } from '@/hooks/useNavigationLinksAdmin';
import type { NavigationLink } from '@/hooks/useNavigationLinks';
import { useActiveCampaigns } from '@/hooks/useActiveCampaigns';
import { useBlogPosts } from '@/hooks/useBlogPosts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, GripVertical, Pencil, X, Check, Loader2, Link as LinkIcon, ExternalLink } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type SourceType = 'custom' | 'campaign' | 'blog';

const emptyLink = {
  label: '',
  url: '',
  type: 'internal' as const,
  open_in_new_tab: false,
  is_active: true,
};

interface SortableRowProps {
  link: NavigationLink;
  onEdit: (link: NavigationLink) => void;
  onDelete: (id: string) => void;
  onToggleActive: (link: NavigationLink) => void;
}

const SortableRow = ({ link, onEdit, onDelete, onToggleActive }: SortableRowProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: link.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-background border border-border rounded-lg hover:bg-muted/50 transition-colors"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground hover:text-foreground hover:bg-muted rounded p-1 transition-colors"
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm truncate">{link.label}</span>
          <Badge variant={link.type === 'internal' ? 'secondary' : 'outline'} className="text-[10px] px-1.5 py-0">
            {link.type}
          </Badge>
          {link.open_in_new_tab && (
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
        <span className="text-xs text-muted-foreground truncate block mt-0.5">{link.url}</span>
      </div>
      <Switch
        checked={link.is_active}
        onCheckedChange={() => onToggleActive(link)}
        className="shrink-0"
      />
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(link)}>
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(link.id)}>
        <Trash2 className="h-3.5 w-3.5 text-destructive" />
      </Button>
    </div>
  );
};

export const NavigationLinksEditor = () => {
  const { links, loading, createLink, updateLink, deleteLink, reorderLinks } = useNavigationLinksAdmin();
  const [editing, setEditing] = useState<Partial<NavigationLink> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [sourceType, setSourceType] = useState<SourceType>('custom');

  // Lazy-loaded data for smart picker
  const { campaigns } = useActiveCampaigns({ includeUnlisted: true });
  const blogQuery = useBlogPosts({ limit: 50 });
  const posts = blogQuery.data?.posts;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = links.findIndex((l) => l.id === active.id);
    const newIndex = links.findIndex((l) => l.id === over.id);
    const reordered = arrayMove(links, oldIndex, newIndex);
    reorderLinks.mutate(reordered.map((l) => l.id));
  };

  const startAdd = () => {
    setEditing({ ...emptyLink });
    setIsNew(true);
    setSourceType('custom');
  };

  const startEdit = (link: NavigationLink) => {
    setEditing({ ...link });
    setIsNew(false);
    // Detect source type from URL
    if (link.url.includes('/promo/')) setSourceType('campaign');
    else if (link.url.includes('/blog/')) setSourceType('blog');
    else setSourceType('custom');
  };

  const handleSave = () => {
    if (!editing?.label || !editing?.url) return;
    if (isNew) {
      createLink.mutate(editing);
    } else if (editing.id) {
      updateLink.mutate(editing as NavigationLink);
    }
    setEditing(null);
  };

  const handleToggleActive = (link: NavigationLink) => {
    updateLink.mutate({ id: link.id, is_active: !link.is_active });
  };

  const handleSourceTypeChange = (value: SourceType) => {
    setSourceType(value);
    if (value === 'custom') return;
    // Clear URL when switching source type
    setEditing((p) => ({ ...p, url: '' }));
  };

  const handleCampaignSelect = (slug: string) => {
    const campaign = campaigns.find((c) => c.slug === slug);
    if (!campaign) return;
    setEditing((p) => ({
      ...p,
      url: `/promo/${campaign.slug}`,
      label: p?.label || campaign.title,
    }));
  };

  const handleBlogSelect = (slug: string) => {
    const post = posts?.find((p) => p.slug === slug);
    if (!post) return;
    setEditing((p) => ({
      ...p,
      url: `/blog/${post.slug}`,
      label: p?.label || post.title,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Navigation Links</h2>
          <p className="text-sm text-muted-foreground">Manage header navigation links visible on your website.</p>
        </div>
        <Button onClick={startAdd} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Link
        </Button>
      </div>

      {editing && (
        <Card className="border-brand-border-brand">
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <LinkIcon className="h-4 w-4" />
              {isNew ? 'Add New Link' : 'Edit Link'}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={editing.type || 'internal'}
                  onValueChange={(v) => {
                    setEditing((p) => ({
                      ...p,
                      type: v as 'internal' | 'external',
                      open_in_new_tab: v === 'external' ? true : p?.open_in_new_tab,
                    }));
                    if (v === 'external') setSourceType('custom');
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="external">External</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editing.type === 'internal' && (
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Select value={sourceType} onValueChange={(v) => handleSourceTypeChange(v as SourceType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom URL</SelectItem>
                      <SelectItem value="campaign">Campaign</SelectItem>
                      <SelectItem value="blog">Blog Post</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {editing.type === 'internal' && sourceType === 'campaign' && (
                <div className="space-y-2 md:col-span-2">
                  <Label>Select Campaign</Label>
                  <Select onValueChange={handleCampaignSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a campaign..." />
                    </SelectTrigger>
                    <SelectContent>
                      {campaigns.map((c) => (
                        <SelectItem key={c.id} value={c.slug}>
                          <span className="flex items-center gap-2">
                            <span>{c.title}</span>
                            <span className="text-xs text-muted-foreground">/promo/{c.slug}</span>
                          </span>
                        </SelectItem>
                      ))}
                      {campaigns.length === 0 && (
                        <div className="px-2 py-3 text-sm text-muted-foreground text-center">No active campaigns</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {editing.type === 'internal' && sourceType === 'blog' && (
                <div className="space-y-2 md:col-span-2">
                  <Label>Select Blog Post</Label>
                  <Select onValueChange={handleBlogSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a blog post..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(posts || []).map((p) => (
                        <SelectItem key={p.id} value={p.slug}>
                          <span className="flex items-center gap-2">
                            <span>{p.title}</span>
                            <span className="text-xs text-muted-foreground">/blog/{p.slug}</span>
                          </span>
                        </SelectItem>
                      ))}
                      {(!posts || posts.length === 0) && (
                        <div className="px-2 py-3 text-sm text-muted-foreground text-center">No published posts</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Label</Label>
                <Input
                  value={editing.label || ''}
                  onChange={(e) => setEditing((p) => ({ ...p, label: e.target.value }))}
                  placeholder="e.g. Portfolio"
                />
              </div>
              <div className="space-y-2">
                <Label>URL</Label>
                <Input
                  value={editing.url || ''}
                  onChange={(e) => setEditing((p) => ({ ...p, url: e.target.value }))}
                  placeholder={editing.type === 'external' ? 'https://...' : '/blog or /promo/...'}
                />
              </div>

              <div className="flex items-end gap-6 pb-1">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editing.open_in_new_tab ?? false}
                    onCheckedChange={(c) => setEditing((p) => ({ ...p, open_in_new_tab: c }))}
                  />
                  <Label>New tab</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editing.is_active ?? true}
                    onCheckedChange={(c) => setEditing((p) => ({ ...p, is_active: c }))}
                  />
                  <Label>Active</Label>
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2 border-t border-border">
              <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={!editing.label || !editing.url}>
                <Check className="h-4 w-4 mr-1" /> {isNew ? 'Create' : 'Save'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {links.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No navigation links yet. Click "Add Link" to create one.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={links.map((l) => l.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {links.map((link) => (
                <SortableRow
                  key={link.id}
                  link={link}
                  onEdit={startEdit}
                  onDelete={(id) => deleteLink.mutate(id)}
                  onToggleActive={handleToggleActive}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};
