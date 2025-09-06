import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Save, User, Mail, Phone, Calendar, FileText, Activity, Bot } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  user_number: string | null;
  event_date: string | null;
  event_city: string | null;
  promotional_phone: string | null;
  package_consultation: string | null;
  briefing: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
  avatar_url: string | null;
  role: string | null;
  chat_summarize: string | null;
  pipeline_profile: string | null;
  pipeline_status: string | null;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  userName?: string | null;
  userEmail?: string | null;
}

const statusOptions = [
  'New Lead',
  'Contacted',
  'In Process',
  'Negotiation',
  'Proposal Sent',
  'Follow-Up Needed',
  'Closed – Won',
  'Closed – Lost',
  'Archived'
];

export const UserProfileModal = ({ 
  isOpen, 
  onClose, 
  customerId, 
  userName, 
  userEmail 
}: UserProfileModalProps) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [briefing, setBriefing] = useState('');
  const [status, setStatus] = useState('');
  const [generatingAISummary, setGeneratingAISummary] = useState(false);

  useEffect(() => {
    if (isOpen && customerId) {
      fetchUserProfile();
    }
  }, [isOpen, customerId]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', customerId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching profile:', error);
        toast({
          title: "Error loading profile",
          description: "Failed to load user profile data.",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        setProfile(data);
        setBriefing(data.briefing || '');
        setStatus(data.status || 'New Lead');
      } else {
        // Profile doesn't exist, create placeholder with available info
        setProfile({
          id: customerId,
          name: userName || null,
          email: userEmail || null,
          user_number: null,
          event_date: null,
          event_city: null,
          promotional_phone: null,
          package_consultation: null,
          briefing: null,
          status: 'New Lead',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          avatar_url: null,
          role: 'user',
          chat_summarize: null,
          pipeline_profile: 'Disable',
          pipeline_status: 'New Lead & Negotiation'
        });
        setBriefing('');
        setStatus('New Lead');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error loading profile",
        description: "Failed to load user profile data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    
    try {
      setSaving(true);

      const updateData = {
        briefing: briefing || null,
        status: status || 'New Lead',
        updated_at: new Date().toISOString(),
      };

      // If profile exists, update it
      if (profile.created_at !== new Date().toISOString()) {
        const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', customerId);

        if (error) {
          console.error('Error updating profile:', error);
          toast({
            title: "Error updating profile",
            description: "Failed to update user profile.",
            variant: "destructive",
          });
          return;
        }
      } else {
        // Profile doesn't exist, insert new one
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: customerId,
            name: userName,
            email: userEmail,
            role: 'user',
            ...updateData,
          });

        if (error) {
          console.error('Error creating profile:', error);
          toast({
            title: "Error creating profile", 
            description: "Failed to create user profile.",
            variant: "destructive",
          });
          return;
        }
      }

      // Update local state
      setProfile(prev => prev ? { ...prev, ...updateData } : null);
      
      toast({
        title: "Profile updated",
        description: "User profile has been updated successfully.",
      });

      onClose();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error saving profile",
        description: "Failed to save user profile.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAISummary = async () => {
    if (!profile) return;
    
    try {
      setGeneratingAISummary(true);
      
      // Fetch conversation and messages data
      const { data: conversation, error: conversationError } = await supabase
        .from('conversations')
        .select('id')
        .eq('customer_id', customerId)
        .single();

      if (conversationError) {
        console.error('Error fetching conversation:', conversationError);
        toast({
          title: "Error",
          description: "Could not find conversation for this user.",
          variant: "destructive",
        });
        return;
      }

      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('id')
        .eq('conversation_id', conversation.id)
        .limit(1);

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        toast({
          title: "Error", 
          description: "Could not fetch messages for this conversation.",
          variant: "destructive",
        });
        return;
      }

      // Prepare webhook payload
      const webhookPayload = {
        conversation_id: conversation.id,
        id: messages?.[0]?.id || null,
        email: profile.email,
        user_id: profile.id,
        name: profile.name,
        status: profile.status,
        briefing: profile.briefing,
        event_date: profile.event_date,
        event_city: profile.event_city,
        package_consultation: profile.package_consultation
      };

      // Send webhook to n8n
      const response = await fetch('https://agcreationmkt.cloud/webhook/edc35eb2-12c7-4d57-ab83-5d7d2b2b8f42', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      });

      if (response.ok) {
        toast({
          title: "AI Summary Requested",
          description: "AI summary generation has been triggered. The summary will be updated shortly.",
        });
      } else {
        throw new Error('Webhook request failed');
      }
    } catch (error) {
      console.error('Error triggering AI summary:', error);
      toast({
        title: "Error",
        description: "Failed to trigger AI summary generation.",
        variant: "destructive",
      });
    } finally {
      setGeneratingAISummary(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New Lead':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Contacted':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'In Process':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Negotiation':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Proposal Sent':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Follow-Up Needed':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'Closed – Won':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Closed – Lost':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Archived':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center text-white font-medium">
              {profile?.name?.charAt(0).toUpperCase() || 
               profile?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <span className="text-lg font-semibold">User Profile</span>
              {profile?.status && (
                <Badge className={`ml-2 ${getStatusColor(profile.status)}`}>
                  {profile.status}
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
          </div>
        ) : profile ? (
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">User ID</Label>
                    <p className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded border">
                      {profile.id}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Role</Label>
                    <p className="text-sm text-gray-900">{profile.role || 'user'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Name
                    </Label>
                    <p className="text-sm text-gray-900">{profile.name || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      Email
                    </Label>
                    <p className="text-sm text-gray-900">{profile.email || 'Not provided'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      Phone Number
                    </Label>
                    <p className="text-sm text-gray-900">{profile.user_number || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      Promotional Phone
                    </Label>
                    <p className="text-sm text-gray-900">{profile.promotional_phone || 'Not provided'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Event Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4" />
                  Event Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Event Date</Label>
                    <p className="text-sm text-gray-900">
                      {profile.event_date 
                        ? format(new Date(profile.event_date), 'MMMM d, yyyy')
                        : 'Not provided'
                      }
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Event City</Label>
                    <p className="text-sm text-gray-900">{profile.event_city || 'Not provided'}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Package Consultation</Label>
                  <p className="text-sm text-gray-900">{profile.package_consultation || 'Not provided'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Admin Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-4 w-4" />
                  Admin Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                    Status
                  </Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between py-2 px-1">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-700">
                      Add to Pipeline
                    </Label>
                    <p className="text-xs text-gray-500">
                      Enable to show this customer in the pipeline process
                    </p>
                  </div>
                  <Switch
                    checked={profile?.pipeline_profile === 'Enable'}
                    onCheckedChange={async (checked) => {
                      if (!profile) return;
                      
                      const newPipelineProfile = checked ? 'Enable' : 'Disable';
                      
                      try {
                        // Update database immediately
                        const { error } = await supabase
                          .from('profiles')
                          .update({ 
                            pipeline_profile: newPipelineProfile,
                            updated_at: new Date().toISOString()
                          })
                          .eq('id', customerId);

                        if (error) {
                          console.error('Error updating pipeline status:', error);
                          toast({
                            title: "Error updating pipeline",
                            description: "Failed to update pipeline status.",
                            variant: "destructive",
                          });
                          return;
                        }

                        // Update local state
                        setProfile({
                          ...profile,
                          pipeline_profile: newPipelineProfile,
                          updated_at: new Date().toISOString()
                        });

                        toast({
                          title: "Pipeline updated",
                          description: `User ${checked ? 'added to' : 'removed from'} pipeline successfully.`,
                        });
                      } catch (error) {
                        console.error('Error updating pipeline status:', error);
                        toast({
                          title: "Error updating pipeline",
                          description: "Failed to update pipeline status.",
                          variant: "destructive",
                        });
                      }
                    }}
                  />
                </div>

                <div>
                  <Label htmlFor="briefing" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Admin Notes / Client Briefing
                  </Label>
                  <Textarea
                    id="briefing"
                    value={briefing}
                    onChange={(e) => setBriefing(e.target.value)}
                    placeholder="Add internal notes or client briefing details..."
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Bot className="h-3 w-3" />
                    Conversation Summary
                  </Label>
                  <div className="bg-gray-50 p-3 rounded-md border text-sm text-gray-900 min-h-[60px]">
                    {profile?.chat_summarize || 'No conversation summary available'}
                  </div>
                  <Button
                    onClick={handleAISummary}
                    disabled={generatingAISummary}
                    className="mt-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white"
                    size="sm"
                  >
                    <Bot className="h-4 w-4 mr-2" />
                    {generatingAISummary ? 'Generating...' : 'AI Summary'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Timestamps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4" />
                  Account History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-gray-600">Created</Label>
                    <p className="text-gray-900">
                      {format(new Date(profile.created_at), 'MMM d, yyyy at HH:mm')}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Last Updated</Label>
                    <p className="text-gray-900">
                      {format(new Date(profile.updated_at), 'MMM d, yyyy at HH:mm')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="bg-rose-500 hover:bg-rose-600 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button 
                variant="outline" 
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>User profile not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};