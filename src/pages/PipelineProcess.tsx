import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AvatarNew as Avatar, AvatarFallbackNew as AvatarFallback, AvatarImageNew as AvatarImage } from '@/components/ui/avatar-new';
import { BadgeNew as Badge } from '@/components/ui/badge-new';
import { UserProfileModal } from '@/components/dashboard/UserProfileModal';
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnContent,
  KanbanItem,
  KanbanItemHandle,
  KanbanOverlay,
  type KanbanMoveEvent,
} from '@/components/ui/kanban';
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
}

const pipelineStatuses = [
  { id: '1', name: 'New Lead & Negotiation', color: '#6B7280' },
  { id: '2', name: 'Closed Deal & Pre-Production', color: '#F59E0B' },
  { id: '3', name: 'Production', color: '#3B82F6' },
  { id: '4', name: 'Post-Production (Editing)', color: '#8B5CF6' },
  { id: '5', name: 'Delivery & Finalization', color: '#10B981' },
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
        .select('id, name, email, avatar_url, status, pipeline_status, pipeline_profile, created_at')
        .eq('pipeline_profile', 'Enable');

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

  const handleMove = async (event: KanbanMoveEvent) => {
    const { overContainer } = event;
    const profileId = event.event.active.id as string;
    
    // Find the current status of the profile being dragged
    const currentProfile = profiles.find(profile => profile.id === profileId);
    if (!currentProfile || currentProfile.pipeline_status === overContainer) return;

    // Optimistic update
    setProfiles(prevProfiles =>
      prevProfiles.map(profile =>
        profile.id === profileId
          ? { ...profile, pipeline_status: overContainer }
          : profile
      )
    );

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ pipeline_status: overContainer })
        .eq('id', profileId);

      if (error) throw error;

      toast({
        title: 'Status Updated',
        description: 'Profile moved successfully',
      });
    } catch (error) {
      console.error('Error updating pipeline status:', error);
      // Revert optimistic update
      fetchProfiles();
      toast({
        title: 'Error',
        description: 'Failed to update pipeline status',
        variant: 'destructive',
      });
    }
  };

  // Create columns data structure for the new Kanban
  const kanbanColumns = pipelineStatuses.reduce((acc, status) => {
    acc[status.id] = profiles.filter(profile => profile.pipeline_status === status.id);
    return acc;
  }, {} as Record<string, Profile[]>);

  const handleColumnsChange = (newColumns: Record<string, Profile[]>) => {
    // Update local state immediately for UI responsiveness
    const newProfiles = Object.values(newColumns).flat();
    setProfiles(newProfiles);
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

      <Kanban
        value={kanbanColumns}
        onValueChange={handleColumnsChange}
        getItemValue={(profile) => profile.id}
        onMove={handleMove}
        className="min-h-[600px]"
      >
        <KanbanBoard className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {pipelineStatuses.map(status => (
            <KanbanColumn
              key={status.id}
              value={status.id}
              className="rounded-md border bg-card p-4 shadow-sm min-h-[500px]"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: status.color }}
                  />
                  <h3 className="font-semibold text-sm">{status.name}</h3>
                </div>
                <Badge variant="secondary" size="sm">
                  {kanbanColumns[status.id]?.length || 0}
                </Badge>
              </div>
              
              <KanbanColumnContent value={status.id} className="flex flex-col gap-3">
                {kanbanColumns[status.id]?.map((profile) => (
                  <KanbanItem
                    key={profile.id}
                    value={profile.id}
                    className="group relative"
                  >
                    <div className="rounded-md border bg-background p-3 shadow-sm hover:shadow-md transition-shadow">
                      {/* Drag handle - only the avatar area */}
                      <KanbanItemHandle className="absolute top-3 left-3 w-10 h-10 rounded-full z-10">
                        <div className="w-full h-full opacity-0 hover:opacity-20 bg-gray-500 rounded-full transition-opacity" />
                      </KanbanItemHandle>
                      
                      {/* Clickable content area */}
                      <div 
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProfileClick(profile);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 relative">
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
                              <Badge variant="outline" size="xs" className="mt-1">
                                {profile.status}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </KanbanItem>
                ))}
              </KanbanColumnContent>
            </KanbanColumn>
          ))}
        </KanbanBoard>
        
        <KanbanOverlay>
          <div className="rounded-md bg-muted/60 size-full border" />
        </KanbanOverlay>
      </Kanban>

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