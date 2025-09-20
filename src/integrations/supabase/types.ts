export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          address: string
          appointment_date: string
          appointment_time: string
          created_at: string
          id: string
          notes: string | null
          service_id: string
          status: string
          user_id: string | null
        }
        Insert: {
          address: string
          appointment_date: string
          appointment_time: string
          created_at?: string
          id?: string
          notes?: string | null
          service_id: string
          status?: string
          user_id?: string | null
        }
        Update: {
          address?: string
          appointment_date?: string
          appointment_time?: string
          created_at?: string
          id?: string
          notes?: string | null
          service_id?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          mode: string | null
          new_msg: string | null
          public_code: string | null
          taken_at: string | null
          taken_by: string | null
          user_email: string | null
          user_name: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          mode?: string | null
          new_msg?: string | null
          public_code?: string | null
          taken_at?: string | null
          taken_by?: string | null
          user_email?: string | null
          user_name?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          mode?: string | null
          new_msg?: string | null
          public_code?: string | null
          taken_at?: string | null
          taken_by?: string | null
          user_email?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      gallery_cards: {
        Row: {
          category: string
          collection_key: string
          created_at: string
          event_season_or_date: string | null
          featured: boolean
          id: string
          is_published: boolean
          location_city: string | null
          order_index: number
          slug: string | null
          subtitle: string | null
          thumb_image_url: string | null
          thumb_mp4_url: string | null
          thumb_webm_url: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_mp4_url: string | null
          video_url: string | null
        }
        Insert: {
          category: string
          collection_key?: string
          created_at?: string
          event_season_or_date?: string | null
          featured?: boolean
          id?: string
          is_published?: boolean
          location_city?: string | null
          order_index?: number
          slug?: string | null
          subtitle?: string | null
          thumb_image_url?: string | null
          thumb_mp4_url?: string | null
          thumb_webm_url?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_mp4_url?: string | null
          video_url?: string | null
        }
        Update: {
          category?: string
          collection_key?: string
          created_at?: string
          event_season_or_date?: string | null
          featured?: boolean
          id?: string
          is_published?: boolean
          location_city?: string | null
          order_index?: number
          slug?: string | null
          subtitle?: string | null
          thumb_image_url?: string | null
          thumb_mp4_url?: string | null
          thumb_webm_url?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_mp4_url?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          audio_url: string | null
          content: string | null
          conversation_id: string
          created_at: string
          id: number
          new_msg: string | null
          role: string
          type: string
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          audio_url?: string | null
          content?: string | null
          conversation_id: string
          created_at?: string
          id?: number
          new_msg?: string | null
          role: string
          type: string
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          audio_url?: string | null
          content?: string | null
          conversation_id?: string
          created_at?: string
          id?: number
          new_msg?: string | null
          role?: string
          type?: string
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          briefing: string | null
          chat_summarize: string | null
          created_at: string
          email: string | null
          event_city: string | null
          event_date: string | null
          gallery_event: string | null
          id: string
          name: string | null
          package_consultation: string | null
          pipeline_profile: string | null
          pipeline_status: string | null
          promotional_phone: string | null
          role: string | null
          sort_order: number | null
          status: string | null
          updated_at: string
          user_number: string | null
          visitor_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          briefing?: string | null
          chat_summarize?: string | null
          created_at?: string
          email?: string | null
          event_city?: string | null
          event_date?: string | null
          gallery_event?: string | null
          id: string
          name?: string | null
          package_consultation?: string | null
          pipeline_profile?: string | null
          pipeline_status?: string | null
          promotional_phone?: string | null
          role?: string | null
          sort_order?: number | null
          status?: string | null
          updated_at?: string
          user_number?: string | null
          visitor_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          briefing?: string | null
          chat_summarize?: string | null
          created_at?: string
          email?: string | null
          event_city?: string | null
          event_date?: string | null
          gallery_event?: string | null
          id?: string
          name?: string | null
          package_consultation?: string | null
          pipeline_profile?: string | null
          pipeline_status?: string | null
          promotional_phone?: string | null
          role?: string | null
          sort_order?: number | null
          status?: string | null
          updated_at?: string
          user_number?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_user_role_only: {
        Args: { _user_id: string }
        Returns: string
      }
      has_role: {
        Args:
          | { _role: Database["public"]["Enums"]["app_role"]; _user_id: string }
          | { _role: string; _user_id: string }
        Returns: boolean
      }
      update_profile_sort_orders: {
        Args: { updates: Json }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
