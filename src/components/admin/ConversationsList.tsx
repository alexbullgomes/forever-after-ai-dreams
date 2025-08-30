import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, User } from 'lucide-react';

interface Conversation {
  id: string;
  user_email: string;
  user_name: string;
  created_at: string;
  customer_id: string;
}

interface ConversationsListProps {
  conversations: Conversation[];
  onConversationSelect: (conversation: Conversation) => void;
  selectedConversationId?: string;
}

export const ConversationsList = ({
  conversations,
  onConversationSelect,
  selectedConversationId,
}: ConversationsListProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h2 className="font-semibold">Conversations ({conversations.length})</h2>
      </div>
      
      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {conversations.map((conversation) => (
          <Card
            key={conversation.id}
            className={`cursor-pointer hover:bg-muted/50 transition-colors ${
              selectedConversationId === conversation.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => onConversationSelect(conversation)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {conversation.user_name || 'Anonymous User'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {conversation.user_email}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {formatDistanceToNow(new Date(conversation.created_at), { addSuffix: true })}
                </Badge>
              </div>
              
              <div className="mt-3 text-xs text-muted-foreground">
                ID: {conversation.id.slice(0, 8)}...
              </div>
            </CardContent>
          </Card>
        ))}
        
        {conversations.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No conversations yet</p>
          </div>
        )}
      </div>
    </div>
  );
};