import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { UserProfileModal } from '@/components/dashboard/UserProfileModal';
import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from '@/components/ui/kanban';
import type { DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  status: string | null;
  pipeline_status: string;
  pipeline_profile: string;
  created_at: string;
  sort_order: number;
}

const pipelineStatuses = [
  { id: 'New Lead & Negotiation', name: 'New Lead & Negotiation', color: '#6B7280' },
  { id: 'Closed Deal & Pre-Production', name: 'Closed Deal & Pre-Production', color: '#F59E0B' },
  { id: 'Production', name: 'Production', color: '#3B82F6' },
  { id: 'Post-Production (Editing)', name: 'Post-Production (Editing)', color: '#8B5CF6' },
  { id: 'Delivery & Finalization', name: 'Delivery & Finalization', color: '#10B981' },
];

export default function PipelineProcess() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);
  const { toast } = useToast();

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url, status, pipeline_status, pipeline_profile, created_at, sort_order')
        .eq('pipeline_profile', 'Enable')
        .order('pipeline_status')
        .order('sort_order');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pipeline profiles',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('profiles-pipeline-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: 'pipeline_profile=eq.Enable',
        },
        () => {
          fetchProfiles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Utility function to normalize sort orders in a column
  const normalizeSortOrders = (columnProfiles: Profile[]): { id: string; sort_order: number }[] => {
    return columnProfiles.map((profile, index) => ({
      id: profile.id,
      sort_order: index + 1
    }));
  };

  // Enhanced drag end handler with cross-column positioning
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const profileId = active.id as string;
    const draggedProfile = profiles.find(profile => profile.id === profileId);
    
    if (!draggedProfile) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Determine drop target type
    const isDroppedOnColumn = overData?.type === 'column' || pipelineStatuses.some(status => status.id === over.id);
    const isDroppedOnCard = overData?.type === 'card';

    if (isDroppedOnColumn) {
      // Scenario 1: Dropped on column header - move to end of column
      const newStatus = over.id as string;
      
      if (draggedProfile.pipeline_status === newStatus) return;

      await handleMoveToColumn(profileId, newStatus);
    } else if (isDroppedOnCard) {
      const targetProfile = profiles.find(profile => profile.id === over.id);
      
      if (!targetProfile) return;

      if (targetProfile.pipeline_status === draggedProfile.pipeline_status) {
        // Scenario 2: Reorder within same column
        await handleReorderWithinColumn(profileId, targetProfile.id, draggedProfile.pipeline_status);
      } else {
        // Scenario 3: Move to different column at specific position
        await handleMoveToPosition(profileId, targetProfile.id, targetProfile.pipeline_status);
      }
    }
  };

  // Handle moving profile to end of column
  const handleMoveToColumn = async (profileId: string, newStatus: string) => {
    const targetColumnProfiles = profiles
      .filter(profile => profile.pipeline_status === newStatus)
      .sort((a, b) => a.sort_order - b.sort_order);
    
    const newSortOrder = targetColumnProfiles.length + 1;

    // Optimistic update
    setProfiles(prevProfiles =>
      prevProfiles.map(profile =>
        profile.id === profileId
          ? { ...profile, pipeline_status: newStatus, sort_order: newSortOrder }
          : profile
      )
    );

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          pipeline_status: newStatus,
          sort_order: newSortOrder
        })
        .eq('id', profileId);

      if (error) throw error;

      toast({
        title: 'Status Updated',
        description: 'Profile moved to new column successfully',
      });
    } catch (error) {
      console.error('Error updating pipeline status:', error);
      fetchProfiles();
      toast({
        title: 'Error',
        description: 'Failed to update pipeline status',
        variant: 'destructive',
      });
    }
  };

  // Handle reordering within same column
  const handleReorderWithinColumn = async (profileId: string, targetProfileId: string, columnStatus: string) => {
    const columnProfiles = profiles
      .filter(profile => profile.pipeline_status === columnStatus)
      .sort((a, b) => a.sort_order - b.sort_order);

    const oldIndex = columnProfiles.findIndex(p => p.id === profileId);
    const newIndex = columnProfiles.findIndex(p => p.id === targetProfileId);

    if (oldIndex === newIndex) return;

    const reorderedProfiles = arrayMove(columnProfiles, oldIndex, newIndex);
    const updatesData = normalizeSortOrders(reorderedProfiles);

    // Optimistic update
    setProfiles(prevProfiles => 
      prevProfiles.map(profile => {
        const update = updatesData.find(u => u.id === profile.id);
        return update 
          ? { ...profile, sort_order: update.sort_order }
          : profile;
      })
    );

    await updateSortOrders(updatesData, 'Profile reordered successfully');
  };

  // Handle moving to specific position in different column
  const handleMoveToPosition = async (profileId: string, targetProfileId: string, newStatus: string) => {
    const targetColumnProfiles = profiles
      .filter(profile => profile.pipeline_status === newStatus)
      .sort((a, b) => a.sort_order - b.sort_order);

    const targetIndex = targetColumnProfiles.findIndex(p => p.id === targetProfileId);
    
    // Insert at target position
    const newProfiles = [...targetColumnProfiles];
    const draggedProfile = profiles.find(p => p.id === profileId)!;
    
    newProfiles.splice(targetIndex, 0, { ...draggedProfile, pipeline_status: newStatus });
    const updatesData = normalizeSortOrders(newProfiles);

    // Optimistic update
    setProfiles(prevProfiles =>
      prevProfiles.map(profile => {
        if (profile.id === profileId) {
          return { ...profile, pipeline_status: newStatus, sort_order: updatesData.find(u => u.id === profileId)!.sort_order };
        }
        const update = updatesData.find(u => u.id === profile.id);
        return update ? { ...profile, sort_order: update.sort_order } : profile;
      })
    );

    await updateSortOrders(updatesData, 'Profile moved and positioned successfully');
  };

  // Helper function to update sort orders
  const updateSortOrders = async (updatesData: { id: string; sort_order: number }[], successMessage: string) => {
    try {
      const { error } = await (supabase.rpc as any)('update_profile_sort_orders', {
        updates: updatesData
      });

      if (error && error.message.includes('function "update_profile_sort_orders" does not exist')) {
        // Fallback to individual updates
        for (const update of updatesData) {
          await supabase
            .from('profiles')
            .update({ sort_order: update.sort_order })
            .eq('id', update.id);
        }
      } else if (error) {
        throw error;
      }

      toast({
        title: 'Order Updated',
        description: successMessage,
      });
    } catch (error) {
      console.error('Error updating sort order:', error);
      fetchProfiles();
      toast({
        title: 'Error',
        description: 'Failed to update sort order',
        variant: 'destructive',
      });
    }
  };

  const getStatusCount = (statusId: string) => {
    return profiles.filter(profile => profile.pipeline_status === statusId).length;
  };

  const handleProfileClick = (profile: Profile) => {
    setSelectedProfile({
      id: profile.id,
      name: profile.name || 'Unknown',
      email: profile.email || 'Unknown',
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Pipeline Process</h1>
        <p className="text-muted-foreground">
          Manage and track customer progress through the pipeline
        </p>
      </div>

      <KanbanProvider onDragEnd={handleDragEnd} className="min-h-[600px]">
        {pipelineStatuses.map(status => (
          <KanbanBoard key={status.id} id={status.id}>
            <div className="flex items-center justify-between mb-2">
              <KanbanHeader name={status.name} color={status.color} />
              <Badge variant="secondary" className="text-xs">
                {getStatusCount(status.id)}
              </Badge>
            </div>
            <KanbanCards 
              items={profiles
                .filter(profile => profile.pipeline_status === status.id)
                .sort((a, b) => a.sort_order - b.sort_order)
                .map(profile => profile.id)
              }
            >
              {profiles
                .filter(profile => profile.pipeline_status === status.id)
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((profile, index) => (
                  <KanbanCard
                    key={profile.id}
                    id={profile.id}
                    name={profile.name || 'Unknown'}
                    parent={status.id}
                    index={index}
                    className="hover:bg-accent/50 transition-colors"
                  >
                    <div 
                      className="p-3 cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleProfileClick(profile);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={profile.avatar_url || undefined} />
                          <AvatarFallback>
                            {profile.name?.slice(0, 2)?.toUpperCase() || 'UN'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {profile.name || 'Unknown Name'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {profile.email || 'No email'}
                          </p>
                          {profile.status && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {profile.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </KanbanCard>
                ))}
            </KanbanCards>
          </KanbanBoard>
        ))}
      </KanbanProvider>

      {selectedProfile && (
        <UserProfileModal
          isOpen={!!selectedProfile}
          onClose={() => setSelectedProfile(null)}
          customerId={selectedProfile.id}
          userName={selectedProfile.name}
          userEmail={selectedProfile.email}
        />
      )}
    </div>
  );
}