import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAffiliate } from '@/hooks/useAffiliate';
import { format } from 'date-fns';
import { Send, MessageCircle, Clock, ArrowDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { AudioPlayer } from '@/components/wedding/components/AudioPlayer';
import { ChatCardMessage } from '@/components/chat/ChatCardMessage';
import { CardMessageData } from '@/types/chat';

interface Conversation {
  id: string;
  customer_id: string | null;
  visitor_id: string | null;
  user_name: string | null;
  user_email: string | null;
  mode: string;
  created_at: string;
  new_msg: string;
  referral_code: string | null;
  last_message_at: string | null;
  message_count: number;
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

const AffiliateConversations = () => {
  const { user } = useAuth();
  const { affiliate, loading: affiliateLoading } = useAffiliate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      setHasNewMessage(false);
    }
  };

  useEffect(() => {
    if (affiliate?.referral_code) {
      fetchConversations();
      const interval = setInterval(fetchConversations, 15000);
      return () => clearInterval(interval);
    } else if (!affiliateLoading) {
      setLoading(false);
    }
  }, [affiliate?.referral_code, affiliateLoading]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation?.id]);

  useEffect(() => {
    if (selectedConversation && messages.length > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [selectedConversation?.id]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!selectedConversation) return;

    const channel = supabase
      .channel(`affiliate-messages-${selectedConversation.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${selectedConversation.id}`
      }, () => {
        fetchMessages(selectedConversation.id);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation?.id]);

  const fetchConversations = async () => {
    if (!affiliate?.referral_code) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('referral_code', affiliate.referral_code)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        return;
      }

      // Get last message timestamps
      const enriched = await Promise.all(
        (data || []).map(async (conv) => {
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id);

          return {
            ...conv,
            last_message_at: lastMsg?.created_at || conv.created_at,
            message_count: count || 0,
          };
        })
      );

      enriched.sort((a, b) => {
        if (a.new_msg === 'unread' && b.new_msg !== 'unread') return -1;
        if (b.new_msg === 'unread' && a.new_msg !== 'unread') return 1;
        return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
      });

      setConversations(enriched);
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
        return;
      }

      const prev = messages.length;
      const newMsgs = data || [];
      if (prev > 0 && newMsgs.length > prev) {
        setHasNewMessage(true);
        setTimeout(scrollToBottom, 100);
      }
      setMessages(newMsgs);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sendingMessage) return;
    if (selectedConversation.mode !== 'human') {
      toast({
        title: "AI mode active",
        description: "You can only reply when conversation is in human mode.",
        variant: "destructive",
      });
      return;
    }

    setSendingMessage(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          role: 'human',
          type: 'text',
          content: newMessage.trim(),
          user_name: user?.user_metadata?.full_name || 'Affiliate',
          user_email: user?.email || null,
        });

      if (error) {
        console.error('Error sending message:', error);
        toast({ title: "Error", description: "Failed to send message.", variant: "destructive" });
        return;
      }

      await fetchMessages(selectedConversation.id);
      setNewMessage('');
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error sending message:', error);
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

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      conv.user_name?.toLowerCase().includes(q) ||
      conv.user_email?.toLowerCase().includes(q) ||
      conv.visitor_id?.toLowerCase().includes(q)
    );
  });

  const getDisplayName = (conv: Conversation) => conv.user_name || conv.user_email || conv.visitor_id || 'Unknown';

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'user': return <Badge variant="secondary" className="text-xs">User</Badge>;
      case 'assistant': return <Badge className="text-xs bg-blue-100 text-blue-800">AI</Badge>;
      case 'human': return <Badge className="text-xs bg-green-100 text-green-800">Human</Badge>;
      default: return <Badge variant="outline" className="text-xs">{role}</Badge>;
    }
  };

  if (affiliateLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>You need an active affiliate account to access conversations.</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-card rounded-lg border border-border overflow-hidden">
      {/* Conversation List */}
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Referral Conversations
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Code: <span className="font-mono">{affiliate.referral_code}</span>
          </p>
          <div className="mt-3 relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 text-sm"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No conversations found
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.id}
                className={`p-3 cursor-pointer border-b border-border hover:bg-muted/50 transition-colors ${
                  selectedConversation?.id === conv.id ? 'bg-muted' : ''
                }`}
                onClick={() => setSelectedConversation(conv)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm text-foreground truncate">
                    {getDisplayName(conv)}
                  </span>
                  {conv.new_msg === 'unread' && (
                    <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">
                    {conv.message_count} messages
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(conv.last_message_at || conv.created_at), 'MMM d')}
                  </span>
                </div>
                <div className="mt-1">
                  <Badge variant="outline" className="text-xs">
                    {conv.mode === 'human' ? 'Human' : 'AI'}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Message View */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">
                  {getDisplayName(selectedConversation)}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {selectedConversation.user_email || selectedConversation.visitor_id || ''}
                  {' · '}Mode: {selectedConversation.mode}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
              {messages.map((msg) => {
                // Handle card messages
                if (msg.type === 'card' && msg.content) {
                  try {
                    const cardData: CardMessageData = JSON.parse(msg.content);
                    return (
                      <div key={msg.id} className="flex justify-start">
                        <div className="max-w-[80%]">
                          <ChatCardMessage cardData={cardData} onBookProduct={() => {}} />
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(msg.created_at), 'HH:mm')}
                          </p>
                        </div>
                      </div>
                    );
                  } catch { /* fall through to text */ }
                }

                const isUser = msg.role === 'user';
                return (
                  <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg p-3 ${
                      isUser
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        {getRoleBadge(msg.role)}
                        <span className="text-xs opacity-70">
                          {msg.user_name || (isUser ? 'User' : msg.role === 'assistant' ? 'AI' : 'Support')}
                        </span>
                      </div>
                      {msg.audio_url ? (
                        <AudioPlayer
                          audioUrl={msg.audio_url}
                          isPlaying={playingAudio === msg.audio_url}
                          onPlayPause={() =>
                            setPlayingAudio(playingAudio === msg.audio_url ? null : msg.audio_url!)
                          }
                        />
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      )}
                      <p className="text-xs opacity-50 mt-1">
                        {format(new Date(msg.created_at), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {hasNewMessage && (
              <div className="flex justify-center py-1">
                <Button size="sm" variant="outline" onClick={scrollToBottom} className="rounded-full">
                  <ArrowDown className="h-3 w-3 mr-1" /> New messages
                </Button>
              </div>
            )}

            {/* Reply Input */}
            <div className="p-4 border-t border-border">
              {selectedConversation.mode === 'human' ? (
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type a reply..."
                    disabled={sendingMessage}
                  />
                  <Button onClick={sendMessage} disabled={sendingMessage || !newMessage.trim()} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center">
                  Conversation is in AI mode. Replies are disabled.
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Select a conversation to view messages</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AffiliateConversations;
