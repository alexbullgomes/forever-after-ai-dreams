import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Send, Users, MessageCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

interface Conversation {
  id: string;
  customer_id: string;
  user_name: string | null;
  user_email: string | null;
  mode: string;
  created_at: string;
  taken_by: string | null;
  taken_at: string | null;
  message_count: number;
  last_message_at: string | null;
}

interface Message {
  id: number;
  conversation_id: string;
  role: string;
  content: string | null;
  created_at: string;
  user_name: string | null;
  user_email: string | null;
}

const ChatAdmin = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      // Fetch ALL conversations for admin view with basic info
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select('*')
        .order('created_at', { ascending: false });

      if (conversationsError) {
        console.error('Error fetching conversations:', conversationsError);
        toast({
          title: "Error loading conversations",
          description: "Failed to load chat conversations.",
          variant: "destructive",
        });
        return;
      }

      // For each conversation, get message count and last message
      const processedConversations = await Promise.all(
        (conversationsData || []).map(async (conv) => {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id);

          const { data: lastMessage } = await supabase
            .from('messages')
            .select('created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...conv,
            message_count: count || 0,
            last_message_at: lastMessage?.created_at || null
          };
        })
      );

      setConversations(processedConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        toast({
          title: "Error loading messages",
          description: "Failed to load conversation messages.",
          variant: "destructive",
        });
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sendingMessage) return;

    setSendingMessage(true);
    try {
      // Insert the admin message directly into the messages table
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          role: selectedConversation.mode, // Use the conversation's mode as the role
          type: 'text', // Add required type field
          content: newMessage.trim(),
          user_name: 'Admin',
          user_email: 'admin@everafter.com'
        });

      if (error) {
        console.error('Error sending message:', error);
        toast({
          title: "Error sending message",
          description: "Failed to send your message.",
          variant: "destructive",
        });
        return;
      }

      // Refresh messages and clear input
      await fetchMessages(selectedConversation.id);
      setNewMessage('');
      
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error sending message",
        description: "Failed to send your message.",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Chat Admin</h1>
        <p className="text-gray-600 mt-1">Manage customer conversations and provide support</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-300px)]">
        {/* Conversations List */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Active Conversations</h3>
              <Badge variant="secondary">{conversations.length}</Badge>
            </div>
          </div>
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedConversation?.id === conversation.id
                      ? 'bg-rose-50 border-rose-200'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
                        {conversation.user_name?.charAt(0).toUpperCase() || 
                         conversation.user_email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">
                          {conversation.user_name || conversation.user_email || 'Anonymous'}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MessageCircle className="h-3 w-3" />
                          {conversation.message_count} messages
                        </div>
                      </div>
                    </div>
                    <Badge variant={conversation.mode === 'ai' ? 'default' : 'secondary'}>
                      {conversation.mode}
                    </Badge>
                  </div>
                  {conversation.last_message_at && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {format(new Date(conversation.last_message_at), 'MMM d, HH:mm')}
                    </div>
                  )}
                </div>
              ))}
              {conversations.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No conversations found
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-full">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center text-white font-medium">
                      {selectedConversation.user_name?.charAt(0).toUpperCase() || 
                       selectedConversation.user_email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {selectedConversation.user_name || selectedConversation.user_email || 'Anonymous User'}
                      </h3>
                      <p className="text-sm text-gray-600">{selectedConversation.user_email}</p>
                    </div>
                  </div>
                  <Badge variant={selectedConversation.mode === 'ai' ? 'default' : 'secondary'}>
                    {selectedConversation.mode} mode
                  </Badge>
                </div>
              </div>

              {/* Messages - Fixed height with internal scroll */}
              <div className="h-80 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-rose-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.role === 'user' ? 'text-rose-100' : 'text-gray-500'
                          }`}>
                            {format(new Date(message.created_at), 'MMM d, HH:mm')}
                          </p>
                        </div>
                      </div>
                    ))}
                    {messages.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No messages in this conversation yet
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>

              <Separator className="flex-shrink-0" />

              {/* Message Input - Fixed at bottom */}
              <div className="p-4 flex-shrink-0">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={sendingMessage}
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={!newMessage.trim() || sendingMessage}
                    className="bg-rose-500 hover:bg-rose-600"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatAdmin;