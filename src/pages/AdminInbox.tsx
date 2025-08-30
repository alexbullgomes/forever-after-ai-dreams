import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { ConversationsList } from '@/components/admin/ConversationsList';
import { ConversationDrawer } from '@/components/admin/ConversationDrawer';
import LoadingState from '@/components/wedding/LoadingState';
import { supabase } from '@/integrations/supabase/client';

interface Conversation {
  id: string;
  user_email: string;
  user_name: string;
  created_at: string;
  customer_id: string;
}

interface Message {
  id: number;
  content: string;
  role: 'user' | 'admin';
  created_at: string;
  user_name?: string;
  user_email?: string;
}

export default function AdminInbox() {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useRole();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, roleLoading, navigate]);

  // Fetch conversations
  useEffect(() => {
    if (!isAdmin) return;

    const fetchConversations = async () => {
      try {
        const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching conversations:', error);
        } else {
          setConversations(data || []);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();

    // Set up real-time subscription for conversations
    const conversationsSubscription = supabase
      .channel('admin-conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversationsSubscription);
    };
  }, [isAdmin]);

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedConversation) return;

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', selectedConversation.id)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching messages:', error);
        } else {
          const typedMessages = (data || []).map(msg => ({
            ...msg,
            role: msg.role as 'user' | 'admin'
          }));
          setMessages(typedMessages);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();

    // Set up real-time subscription for messages
    const messagesSubscription = supabase
      .channel(`admin-messages-${selectedConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation.id}`
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesSubscription);
    };
  }, [selectedConversation]);

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setDrawerOpen(true);
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedConversation || !user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          role: 'admin',
          type: 'text',
          content,
          user_name: 'Admin',
          user_email: user.email,
        });

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }

      // Send webhook via edge function
      try {
        await fetch('https://hmdnronxajctsrlgrhey.functions.supabase.co/admin-message-webhook', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'admin_message',
            conversation_id: selectedConversation.id,
            customer_id: selectedConversation.customer_id,
            user_email: selectedConversation.user_email,
            message: content,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (webhookError) {
        console.error('Error sending webhook:', webhookError);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  if (roleLoading || loading) {
    return <LoadingState />;
  }

  if (!isAdmin) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
            Admin Inbox
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage customer conversations and support requests
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <ConversationsList
              conversations={conversations}
              onConversationSelect={handleConversationSelect}
              selectedConversationId={selectedConversation?.id}
            />
          </div>
          
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <div className="border rounded-lg p-4 bg-card">
                <h3 className="font-semibold mb-4">
                  Conversation with {selectedConversation.user_name || selectedConversation.user_email}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Click a conversation on the left to view messages in a drawer
                </p>
              </div>
            ) : (
              <div className="border rounded-lg p-8 text-center bg-card">
                <p className="text-muted-foreground">
                  Select a conversation to view messages
                </p>
              </div>
            )}
          </div>
        </div>

        <ConversationDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          conversation={selectedConversation}
          messages={messages}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
}