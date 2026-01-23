import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useUnreadAssistantMessages() {
  const [hasUnread, setHasUnread] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setHasUnread(false);
      return;
    }

    const checkUnread = async () => {
      try {
        // Get the user's conversation
        const { data: conversation } = await supabase
          .from("conversations")
          .select("id, new_msg")
          .eq("customer_id", user.id)
          .single();

        if (conversation && conversation.new_msg === "unread") {
          setHasUnread(true);
        } else {
          setHasUnread(false);
        }
      } catch (error) {
        console.error("Error checking unread messages:", error);
        setHasUnread(false);
      }
    };

    checkUnread();

    // Subscribe to conversation changes
    const channel = supabase
      .channel("unread-messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
        },
        (payload) => {
          const updated = payload.new as any;
          if (updated?.customer_id === user.id) {
            setHasUnread(updated.new_msg === "unread");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return hasUnread;
}
