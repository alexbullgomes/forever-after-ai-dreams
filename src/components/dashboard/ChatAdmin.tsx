import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Send, Users, MessageCircle, Clock, ArrowDown, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { UserProfileModal } from './UserProfileModal';
import { QuickActionsButton } from '@/components/chat/QuickActionsButton';
import { EntityPickerModal } from '@/components/chat/EntityPickerModal';
import { ChatCardMessage } from '@/components/chat/ChatCardMessage';
import { CardMessageData } from '@/types/chat';
import { BookingFunnelModal } from '@/components/booking/BookingFunnelModal';
import { AudioPlayer } from '@/components/wedding/components/AudioPlayer';

interface Conversation {
  id: string;
  customer_id: string | null;
  visitor_id: string | null;
  user_name: string | null;
  user_email: string | null;
  mode: string;
  created_at: string;
  taken_by: string | null;
  taken_at: string | null;
  message_count: number;
  last_message_at: string | null;
  new_msg: string;
}

interface Message {
  id: number;
  conversation_id: string;
  role: string;
  type: string;
  content: string | null;
  audio_url: string | null;
  created_at: string;
  user_name: string | null;
  user_email: string | null;
}

const ChatAdmin = () => {
  const { user } = useAuth();
  const { hasRole, loading: roleLoading } = useRole('admin');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showEntityPicker, setShowEntityPicker] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [conversationFilter, setConversationFilter] = useState<'all' | 'visitor' | 'user'>('all');
  
  // Booking state for product cards (admin can also test booking flow)
  const [bookingProduct, setBookingProduct] = useState<{
    id: string;
    title: string;
    price: number;
    currency: string;
  } | null>(null);
  
  // Manual scroll control
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      setHasNewMessage(false); // Reset new message indicator when manually scrolled
    }
  };

  // Check if user is at bottom of chat
  const checkIfAtBottom = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px threshold
      setIsAtBottom(isBottom);
    }
  };

  // Handle scroll events
  const handleScroll = () => {
    checkIfAtBottom();
  };

  useEffect(() => {
    fetchConversations();
    
    // Set up periodic refresh every 15 seconds
    const refreshInterval = setInterval(() => {
      fetchConversations();
    }, 15000);

    return () => clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      markConversationAsRead(selectedConversation.id);
    }
  }, [selectedConversation]);

  // Auto-scroll only when conversation is first opened
  useEffect(() => {
    if (selectedConversation && messages.length > 0) {
      // Use setTimeout to ensure DOM has updated
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [selectedConversation?.id]);

  const fetchConversations = async () => {
    try {
      // Fetch conversations with message count and actual last message timestamp
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          messages!inner(count),
          last_message_timestamp:messages(created_at)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        toast({
          title: "Error loading conversations",
          description: "Failed to load chat conversations.",
          variant: "destructive",
        });
        return;
      }

      // Get the actual last message timestamp for each conversation
      const conversationsWithLastMessage = await Promise.all(
        data.map(async (conv) => {
          // Get the most recent message for this conversation
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...conv,
            message_count: conv.messages?.[0]?.count || 0,
            last_message_at: lastMessage?.created_at || conv.created_at
          };
        })
      );

      // Sort conversations by last message timestamp (most recent first)
      const processedConversations = conversationsWithLastMessage.sort((a, b) => {
        // First, sort by unread status (unread conversations first)
        if (a.new_msg === 'unread' && b.new_msg !== 'unread') return -1;
        if (b.new_msg === 'unread' && a.new_msg !== 'unread') return 1;
        
        // Then sort by last message timestamp (most recent first)
        const aTime = new Date(a.last_message_at).getTime();
        const bTime = new Date(b.last_message_at).getTime();
        return bTime - aTime;
      });

      setConversations(processedConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const currentMessageCount = messages.length;
      
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

      const newMessages = data || [];
      
      // Check if there are new messages and auto-scroll if conversation is active
      if (currentMessageCount > 0 && newMessages.length > currentMessageCount && selectedConversation?.id === conversationId) {
        setHasNewMessage(true);
        // Auto-scroll to new messages
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
      
      setMessages(newMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const markConversationAsRead = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ new_msg: 'read' })
        .eq('id', conversationId);

      if (error) {
        console.error('Error marking conversation as read:', error);
        return;
      }

      // Update local state to reflect the change
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, new_msg: 'read' }
            : conv
        )
      );
      
      setSelectedConversation(prev => 
        prev?.id === conversationId 
          ? { ...prev, new_msg: 'read' }
          : prev
      );
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sendingMessage || selectedConversation.mode === 'ai') return;

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
      
      // Auto-scroll to bottom after sending message
      setTimeout(() => {
        scrollToBottom();
      }, 100);
      
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
    if (e.key === 'Enter' && !e.shiftKey && selectedConversation?.mode === 'human') {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleModeToggle = async (checked: boolean) => {
    if (!selectedConversation) return;

    const newMode = checked ? 'human' : 'ai';
    
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ mode: newMode })
        .eq('id', selectedConversation.id);

      if (error) {
        console.error('Error updating conversation mode:', error);
        toast({
          title: "Error updating mode",
          description: "Failed to update conversation mode.",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setSelectedConversation(prev => prev ? { ...prev, mode: newMode } : null);
      setConversations(prev => 
        prev.map(conv => 
          conv.id === selectedConversation.id 
            ? { ...conv, mode: newMode }
            : conv
        )
      );

      toast({
        title: "Mode updated",
        description: `Conversation mode changed to ${newMode}.`,
      });
    } catch (error) {
      console.error('Error updating conversation mode:', error);
      toast({
        title: "Error updating mode",
        description: "Failed to update conversation mode.",
        variant: "destructive",
      });
    }
  };

  const handleOpenProfileModal = () => {
    setIsProfileModalOpen(true);
  };

  const handleSendCard = async (cardData: CardMessageData) => {
    if (!selectedConversation) return;
    
    setSendingMessage(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          role: 'human',
          type: 'card',
          content: JSON.stringify(cardData),
          user_name: 'Admin',
          user_email: 'admin@everafter.com'
        });

      if (error) throw error;

      await fetchMessages(selectedConversation.id);
      setShowEntityPicker(false);
      
      toast({
        title: "Card sent",
        description: `${cardData.entityType === 'product' ? 'Product' : 'Campaign'} card sent to customer.`,
      });
    } catch (error) {
      console.error('Error sending card:', error);
      toast({
        title: "Error",
        description: "Failed to send card.",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle booking from product card
  const handleBookProduct = (cardData: CardMessageData) => {
    if (cardData.entityType === 'product' && cardData.price !== undefined) {
      setBookingProduct({
        id: cardData.entityId,
        title: cardData.title,
        price: cardData.price,
        currency: cardData.currency || 'USD',
      });
    }
  };

  if (loading || roleLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500">Please log in to access the chat admin panel.</p>
        </div>
      </div>
    );
  }

  if (!hasRole) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500">Access denied. Admin privileges required.</p>
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        {(() => {
          // Computed filter values
          const filteredConversations = conversations.filter((conv) => {
            if (conversationFilter === 'all') return true;
            const isVisitor = !conv.customer_id && !!conv.visitor_id;
            if (conversationFilter === 'visitor') return isVisitor;
            if (conversationFilter === 'user') return !isVisitor;
            return true;
          });
          const visitorCount = conversations.filter(c => !c.customer_id && !!c.visitor_id).length;
          const userCount = conversations.filter(c => !!c.customer_id).length;

          return (
        <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Active Conversations</h3>
              <Badge variant="secondary">{filteredConversations.length}</Badge>
            </div>
            {/* Filter Buttons */}
            <div className="flex items-center gap-1 mt-3">
              <Button
                variant={conversationFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setConversationFilter('all')}
                className="flex-1 text-xs"
              >
                All ({conversations.length})
              </Button>
              <Button
                variant={conversationFilter === 'visitor' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setConversationFilter('visitor')}
                className="flex-1 text-xs"
              >
                Visitors ({visitorCount})
              </Button>
              <Button
                variant={conversationFilter === 'user' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setConversationFilter('user')}
                className="flex-1 text-xs"
              >
                Users ({userCount})
              </Button>
            </div>
          </div>
          <div className="h-96 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-2">
                {filteredConversations.map((conversation) => {
                  const isUnread = conversation.new_msg === 'unread';
                  const isVisitor = !conversation.customer_id && !!conversation.visitor_id;
                  const displayName = isVisitor 
                    ? 'Visitor' 
                    : (conversation.user_name || conversation.user_email || 'Anonymous');
                  const displayInitial = isVisitor 
                    ? 'V' 
                    : (conversation.user_name?.charAt(0).toUpperCase() || 
                       conversation.user_email?.charAt(0).toUpperCase() || 'U');
                  
                  return (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors relative ${
                        selectedConversation?.id === conversation.id
                          ? 'bg-rose-50 border-rose-200'
                          : isUnread 
                            ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {isUnread && (
                        <div className="absolute top-2 right-2 h-3 w-3 bg-blue-500 rounded-full"></div>
                      )}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                            isVisitor 
                              ? 'bg-gradient-to-r from-gray-500 to-gray-600' 
                              : 'bg-gradient-to-r from-rose-500 to-pink-500'
                          }`}>
                            {displayInitial}
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1">
                              <span className={`text-sm ${isUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-900'}`}>
                                {displayName}
                              </span>
                              {isVisitor && (
                                <Badge variant="outline" className="text-xs py-0 px-1 h-4 bg-gray-100 text-gray-600 border-gray-300">
                                  Guest
                                </Badge>
                              )}
                            </div>
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
                  );
                })}
                {filteredConversations.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {conversationFilter === 'all' 
                      ? 'No conversations found' 
                      : `No ${conversationFilter === 'visitor' ? 'visitor' : 'user'} conversations`}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
          );
        })()}

        {/* Chat Interface */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-full">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between">
                  {(() => {
                    const isVisitor = !selectedConversation.customer_id && !!selectedConversation.visitor_id;
                    const displayName = isVisitor 
                      ? 'Visitor' 
                      : (selectedConversation.user_name || selectedConversation.user_email || 'Anonymous User');
                    const displayInitial = isVisitor 
                      ? 'V' 
                      : (selectedConversation.user_name?.charAt(0).toUpperCase() || 
                         selectedConversation.user_email?.charAt(0).toUpperCase() || 'U');
                    
                    return (
                      <div 
                        className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
                        onClick={handleOpenProfileModal}
                      >
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-medium ${
                          isVisitor 
                            ? 'bg-gradient-to-r from-gray-500 to-gray-600' 
                            : 'bg-gradient-to-r from-rose-500 to-pink-500'
                        }`}>
                          {displayInitial}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 hover:text-rose-600 transition-colors">
                              {displayName}
                            </h3>
                            {isVisitor && (
                              <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600 border-gray-300">
                                Guest
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 hover:text-rose-500 transition-colors">
                            {isVisitor 
                              ? `ID: ${selectedConversation.visitor_id?.slice(0, 8)}...` 
                              : selectedConversation.user_email}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                  {roleLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-rose-500"></div>
                  ) : hasRole ? (
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700">AI</span>
                      <Switch
                        checked={selectedConversation.mode === 'human'}
                        onCheckedChange={handleModeToggle}
                        className="data-[state=checked]:bg-rose-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Human</span>
                    </div>
                  ) : (
                    <Badge variant={selectedConversation.mode === 'ai' ? 'default' : 'secondary'}>
                      {selectedConversation.mode} mode
                    </Badge>
                  )}
                </div>
              </div>

              {/* Messages - Fixed height with internal scroll */}
              <div className="h-80 overflow-hidden relative">
                <div 
                  ref={scrollRef} 
                  className="h-full overflow-y-auto"
                  onScroll={handleScroll}
                >
                  <div className="p-4 space-y-4">
                    {messages.map((message) => {
                      // Parse card data if message type is 'card'
                      let cardData: CardMessageData | null = null;
                      if (message.type === 'card' && message.content) {
                        try {
                          cardData = JSON.parse(message.content);
                        } catch (e) {
                          console.error('Failed to parse card data:', e);
                        }
                      }
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] ${message.type !== 'card' ? 'p-3' : 'p-2'} rounded-lg ${
                              message.role === 'user'
                                ? 'bg-rose-500 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            {message.type === 'card' && cardData ? (
                              <ChatCardMessage 
                                data={cardData} 
                                variant={message.role === 'user' ? 'sent' : 'received'}
                                onBookProduct={handleBookProduct}
                              />
                            ) : message.type === 'audio' && message.audio_url ? (
                              <div className="space-y-2">
                                <AudioPlayer
                                  fileUrl={message.audio_url}
                                  fileName="voice-message.webm"
                                  fileId={message.id.toString()}
                                  playingAudio={playingAudio}
                                  onPlay={(url, id) => setPlayingAudio(id)}
                                  isUserMessage={message.role === 'user'}
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className={`h-6 px-2 text-xs ${message.role === 'user' ? 'text-rose-100 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                                  onClick={() => {
                                    navigator.clipboard.writeText(message.audio_url!);
                                    toast({
                                      title: "Copied",
                                      description: "Audio URL copied to clipboard",
                                    });
                                  }}
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copy URL
                                </Button>
                              </div>
                            ) : message.type === 'audio' ? (
                              <p className="text-sm italic opacity-75">Voice message (audio not available)</p>
                            ) : (
                              <p className="text-sm">{message.content}</p>
                            )}
                            <p className={`text-xs mt-1 ${
                              message.role === 'user' ? 'text-rose-100' : 'text-gray-500'
                            }`}>
                              {format(new Date(message.created_at), 'MMM d, HH:mm')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    {messages.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No messages in this conversation yet
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Scroll to Bottom Button - Hidden when at bottom */}
                {messages.length > 0 && !isAtBottom && (
                  <Button
                    onClick={scrollToBottom}
                    className="absolute bottom-4 left-1/2 transform -translate-x-1/2 h-10 w-10 rounded-full shadow-lg transition-all duration-200 bg-rose-500 text-white hover:bg-rose-600"
                    size="sm"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <Separator className="flex-shrink-0" />

              {/* Message Input - Fixed at bottom */}
              <div className="p-4 flex-shrink-0">
                <div className="flex gap-2">
                  {/* Quick Actions Button - Only visible in Human mode */}
                  {selectedConversation.mode === 'human' && (
                    <QuickActionsButton 
                      onClick={() => setShowEntityPicker(true)} 
                      disabled={sendingMessage}
                    />
                  )}
                  <Input
                    placeholder={selectedConversation.mode === 'ai' ? "AI mode active - messages disabled" : "Type your message..."}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={sendingMessage || selectedConversation.mode === 'ai'}
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={!newMessage.trim() || sendingMessage || selectedConversation.mode === 'ai'}
                    className="bg-rose-500 hover:bg-rose-600"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Entity Picker Modal */}
              <EntityPickerModal
                open={showEntityPicker}
                onOpenChange={setShowEntityPicker}
                onSendCard={handleSendCard}
              />
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

      {/* User Profile Modal */}
      {selectedConversation && selectedConversation.customer_id && (
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          customerId={selectedConversation.customer_id}
          userName={selectedConversation.user_name}
          userEmail={selectedConversation.user_email}
        />
      )}
      
      {/* Visitor Info Modal - shown when it's a visitor conversation */}
      {selectedConversation && !selectedConversation.customer_id && selectedConversation.visitor_id && isProfileModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-gray-500 to-gray-600 flex items-center justify-center text-white font-medium">
                V
              </div>
              Visitor Information
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Visitor ID</label>
                <p className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded border break-all">
                  {selectedConversation.visitor_id}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Conversation Started</label>
                <p className="text-sm text-gray-900">
                  {format(new Date(selectedConversation.created_at), 'MMMM d, yyyy HH:mm')}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <Badge variant="outline" className="mt-1">
                  {selectedConversation.mode === 'ai' ? 'AI Handling' : 'Human Takeover'}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                This is an unauthenticated visitor. If they log in, their conversation will be linked to their account.
              </p>
            </div>
            <Button 
              onClick={() => setIsProfileModalOpen(false)} 
              className="w-full mt-6"
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Booking Modal for Product Cards */}
      {bookingProduct && (
        <BookingFunnelModal
          isOpen={!!bookingProduct}
          onClose={() => setBookingProduct(null)}
          productId={bookingProduct.id}
          productTitle={bookingProduct.title}
          productPrice={bookingProduct.price}
          currency={bookingProduct.currency}
        />
      )}
    </div>
  );
};

export default ChatAdmin;