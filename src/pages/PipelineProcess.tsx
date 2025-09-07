import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar-simple';
import { Badge } from '@/components/ui/badge-simple';
import { UserProfileModal } from '@/components/dashboard/UserProfileModal';
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

  const handleDragEnd = async (profileId: string, newStatus: string) => {
    // Find the current status of the profile being dragged
    const currentProfile = profiles.find(profile => profile.id === profileId);
    if (!currentProfile || currentProfile.pipeline_status === newStatus) return;

    // Optimistic update
    setProfiles(prevProfiles =>
      prevProfiles.map(profile =>
        profile.id === profileId
          ? { ...profile, pipeline_status: newStatus }
          : profile
      )
    );

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ pipeline_status: newStatus })
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

  const handleKanbanMove = (event: any) => {
    const profileId = event.event.active.id;
    const newStatus = event.overContainer;
    handleDragEnd(profileId, newStatus);
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

  // Transform profiles into column structure for new Kanban
  const kanbanColumns = React.useMemo(() => {
    const columns: Record<string, Profile[]> = {};
    pipelineStatuses.forEach(status => {
      columns[status.id] = profiles.filter(profile => profile.pipeline_status === status.id);
    });
    return columns;
  }, [profiles]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Pipeline Process</h1>
        <p className="text-muted-foreground">
          Manage and track customer progress through the pipeline
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 min-h-[600px]">
        {pipelineStatuses.map(status => (
          <div key={status.id} className="bg-secondary rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: status.color }}
                />
                <h3 className="font-semibold text-sm">{status.name}</h3>
              </div>
              <Badge variant="secondary" className="text-xs">
                {getStatusCount(status.id)}
              </Badge>
            </div>
            
            <div className="space-y-2">
              {profiles
                .filter(profile => profile.pipeline_status === status.id)
                .map((profile) => (
                  <div 
                    key={profile.id}
                    className="bg-card border rounded-md shadow-sm p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => handleProfileClick(profile)}
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
                ))}
            </div>
          </div>
        ))}
      </div>

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