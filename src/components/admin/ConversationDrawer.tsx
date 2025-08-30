import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Send, User, Shield } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

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

interface ConversationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: Conversation | null;
  messages: Message[];
  onSendMessage: (content: string) => Promise<void>;
}

export const ConversationDrawer = ({
  open,
  onOpenChange,
  conversation,
  messages,
  onSendMessage,
}: ConversationDrawerProps) => {
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await onSendMessage(newMessage.trim());
      setNewMessage('');
      toast({
        title: 'Message sent',
        description: 'Your message has been sent to the customer.',
      });
    } catch (error) {
      toast({
        title: 'Error sending message',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!conversation) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[80vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Conversation with {conversation.user_name || conversation.user_email}
          </DrawerTitle>
          <DrawerDescription>
            Started {formatDistanceToNow(new Date(conversation.created_at), { addSuffix: true })} • 
            Customer ID: {conversation.customer_id.slice(0, 8)}...
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col h-full px-6 pb-6">
          {/* Messages */}
          <ScrollArea className="flex-1 mb-4">
            <div className="space-y-4 pr-4">
              {messages.map((message) => (
                <Card key={message.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {message.role === 'admin' ? (
                        <Shield className="h-4 w-4 text-primary" />
                      ) : (
                        <User className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-medium text-sm">
                        {message.role === 'admin' ? 'Admin' : (message.user_name || 'Customer')}
                      </span>
                      <Badge variant={message.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                        {message.role}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  
                  <div className="text-sm">
                    {message.content || 'No content available'}
                  </div>
                </Card>
              ))}
              
              {messages.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No messages in this conversation yet</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sending}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};