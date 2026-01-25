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
      affiliates: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          referral_code: string
          total_referrals: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          referral_code: string
          total_referrals?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          referral_code?: string
          total_referrals?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
      availability_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          payload: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          payload?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          payload?: Json
        }
        Relationships: []
      }
      availability_overrides: {
        Row: {
          capacity_override: number | null
          created_at: string
          created_by: string | null
          date: string | null
          end_at: string | null
          id: string
          product_id: string
          reason: string | null
          start_at: string | null
          status: string
        }
        Insert: {
          capacity_override?: number | null
          created_at?: string
          created_by?: string | null
          date?: string | null
          end_at?: string | null
          id?: string
          product_id: string
          reason?: string | null
          start_at?: string | null
          status: string
        }
        Update: {
          capacity_override?: number | null
          created_at?: string
          created_by?: string | null
          date?: string | null
          end_at?: string | null
          id?: string
          product_id?: string
          reason?: string | null
          start_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_overrides_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_rules: {
        Row: {
          buffer_minutes: number
          capacity_type: string
          created_at: string
          daily_capacity: number
          end_time: string
          id: string
          is_active: boolean
          product_id: string
          slot_capacity: number
          slot_minutes: number
          start_time: string
          timezone: string
          updated_at: string
          workdays: number[]
        }
        Insert: {
          buffer_minutes?: number
          capacity_type?: string
          created_at?: string
          daily_capacity?: number
          end_time?: string
          id?: string
          is_active?: boolean
          product_id: string
          slot_capacity?: number
          slot_minutes?: number
          start_time?: string
          timezone?: string
          updated_at?: string
          workdays?: number[]
        }
        Update: {
          buffer_minutes?: number
          capacity_type?: string
          created_at?: string
          daily_capacity?: number
          end_time?: string
          id?: string
          is_active?: boolean
          product_id?: string
          slot_capacity?: number
          slot_minutes?: number
          start_time?: string
          timezone?: string
          updated_at?: string
          workdays?: number[]
        }
        Relationships: [
          {
            foreignKeyName: "availability_rules_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_requests: {
        Row: {
          availability_version: string
          campaign_card_index: number | null
          campaign_id: string | null
          created_at: string
          event_date: string
          id: string
          last_seen_at: string
          offer_expires_at: string
          product_id: string | null
          selected_time: string | null
          stage: string
          stripe_checkout_session_id: string | null
          timezone: string
          updated_at: string
          user_id: string | null
          visitor_id: string | null
        }
        Insert: {
          availability_version?: string
          campaign_card_index?: number | null
          campaign_id?: string | null
          created_at?: string
          event_date: string
          id?: string
          last_seen_at?: string
          offer_expires_at: string
          product_id?: string | null
          selected_time?: string | null
          stage?: string
          stripe_checkout_session_id?: string | null
          timezone: string
          updated_at?: string
          user_id?: string | null
          visitor_id?: string | null
        }
        Update: {
          availability_version?: string
          campaign_card_index?: number | null
          campaign_id?: string | null
          created_at?: string
          event_date?: string
          id?: string
          last_seen_at?: string
          offer_expires_at?: string
          product_id?: string | null
          selected_time?: string | null
          stage?: string
          stripe_checkout_session_id?: string | null
          timezone?: string
          updated_at?: string
          user_id?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_requests_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "promotional_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_slot_holds: {
        Row: {
          booking_request_id: string
          campaign_id: string | null
          created_at: string
          end_time: string
          event_date: string
          expires_at: string
          id: string
          product_id: string | null
          source: string | null
          start_time: string
          status: string
          user_id: string | null
          visitor_id: string | null
        }
        Insert: {
          booking_request_id: string
          campaign_id?: string | null
          created_at?: string
          end_time: string
          event_date: string
          expires_at: string
          id?: string
          product_id?: string | null
          source?: string | null
          start_time: string
          status?: string
          user_id?: string | null
          visitor_id?: string | null
        }
        Update: {
          booking_request_id?: string
          campaign_id?: string | null
          created_at?: string
          end_time?: string
          event_date?: string
          expires_at?: string
          id?: string
          product_id?: string | null
          source?: string | null
          start_time?: string
          status?: string
          user_id?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_slot_holds_booking_request_id_fkey"
            columns: ["booking_request_id"]
            isOneToOne: false
            referencedRelation: "booking_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_slot_holds_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "promotional_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_slot_holds_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_request_id: string | null
          created_at: string
          customer_email: string | null
          customer_name: string | null
          end_time: string
          event_date: string
          id: string
          product_id: string
          start_time: string
          status: string
          stripe_payment_intent: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          booking_request_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          end_time: string
          event_date: string
          id?: string
          product_id: string
          start_time: string
          status?: string
          stripe_payment_intent?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          booking_request_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          end_time?: string
          event_date?: string
          id?: string
          product_id?: string
          start_time?: string
          status?: string
          stripe_payment_intent?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_booking_request_id_fkey"
            columns: ["booking_request_id"]
            isOneToOne: false
            referencedRelation: "booking_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      business_contents_gallery: {
        Row: {
          category: string
          created_at: string
          event_season_or_date: string | null
          featured: boolean
          full_video_enabled: boolean
          full_video_url: string | null
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
        }
        Insert: {
          category: string
          created_at?: string
          event_season_or_date?: string | null
          featured?: boolean
          full_video_enabled?: boolean
          full_video_url?: string | null
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
        }
        Update: {
          category?: string
          created_at?: string
          event_season_or_date?: string | null
          featured?: boolean
          full_video_enabled?: boolean
          full_video_url?: string | null
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
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
          mode: string | null
          new_msg: string | null
          public_code: string | null
          taken_at: string | null
          taken_by: string | null
          user_email: string | null
          user_name: string | null
          visitor_id: string | null
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
          mode?: string | null
          new_msg?: string | null
          public_code?: string | null
          taken_at?: string | null
          taken_by?: string | null
          user_email?: string | null
          user_name?: string | null
          visitor_id?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
          mode?: string | null
          new_msg?: string | null
          public_code?: string | null
          taken_at?: string | null
          taken_by?: string | null
          user_email?: string | null
          user_name?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      gallery_cards: {
        Row: {
          campaign_id: string | null
          category: string
          collection_key: string
          created_at: string
          custom_url: string | null
          destination_type: string | null
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
          campaign_id?: string | null
          category: string
          collection_key?: string
          created_at?: string
          custom_url?: string | null
          destination_type?: string | null
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
          campaign_id?: string | null
          category?: string
          collection_key?: string
          created_at?: string
          custom_url?: string | null
          destination_type?: string | null
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
        Relationships: [
          {
            foreignKeyName: "gallery_cards_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "promotional_campaigns"
            referencedColumns: ["id"]
          },
        ]
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
          visitor_id: string | null
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
          visitor_id?: string | null
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
          visitor_id?: string | null
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
      our_portfolio_gallery: {
        Row: {
          category: string
          created_at: string
          event_season_or_date: string | null
          featured: boolean
          full_video_enabled: boolean
          full_video_url: string | null
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
        }
        Insert: {
          category: string
          created_at?: string
          event_season_or_date?: string | null
          featured?: boolean
          full_video_enabled?: boolean
          full_video_url?: string | null
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
        }
        Update: {
          category?: string
          created_at?: string
          event_season_or_date?: string | null
          featured?: boolean
          full_video_enabled?: boolean
          full_video_url?: string | null
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
        }
        Relationships: []
      }
      our_wedding_gallery: {
        Row: {
          category: string
          created_at: string
          event_season_or_date: string | null
          featured: boolean
          full_video_enabled: boolean
          full_video_url: string | null
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
        }
        Insert: {
          category: string
          created_at?: string
          event_season_or_date?: string | null
          featured?: boolean
          full_video_enabled?: boolean
          full_video_url?: string | null
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
        }
        Update: {
          category?: string
          created_at?: string
          event_season_or_date?: string | null
          featured?: boolean
          full_video_enabled?: boolean
          full_video_url?: string | null
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
        }
        Relationships: []
      }
      product_booking_rules: {
        Row: {
          calendar_mode: string
          checkout_hold_minutes: number
          created_at: string
          full_window_end: string
          full_window_start: string
          id: string
          limited_slots: Json
          offer_window_hours: number
          product_id: string
          slot_duration_minutes: number
          updated_at: string
        }
        Insert: {
          calendar_mode?: string
          checkout_hold_minutes?: number
          created_at?: string
          full_window_end?: string
          full_window_start?: string
          id?: string
          limited_slots?: Json
          offer_window_hours?: number
          product_id: string
          slot_duration_minutes?: number
          updated_at?: string
        }
        Update: {
          calendar_mode?: string
          checkout_hold_minutes?: number
          created_at?: string
          full_window_end?: string
          full_window_start?: string
          id?: string
          limited_slots?: Json
          offer_window_hours?: number
          product_id?: string
          slot_duration_minutes?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_booking_rules_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          coverage_text: string | null
          created_at: string
          cta_link: string | null
          cta_text: string | null
          currency: string | null
          days: number | null
          deliverable_text: string | null
          description: string | null
          highlight_label: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_highlighted: boolean
          media_type: string | null
          price: number
          price_unit: string | null
          rating: number | null
          show_in_our_products: boolean
          slug: string | null
          sort_order: number
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          coverage_text?: string | null
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          currency?: string | null
          days?: number | null
          deliverable_text?: string | null
          description?: string | null
          highlight_label?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_highlighted?: boolean
          media_type?: string | null
          price: number
          price_unit?: string | null
          rating?: number | null
          show_in_our_products?: boolean
          slug?: string | null
          sort_order?: number
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          coverage_text?: string | null
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          currency?: string | null
          days?: number | null
          deliverable_text?: string | null
          description?: string | null
          highlight_label?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_highlighted?: boolean
          media_type?: string | null
          price?: number
          price_unit?: string | null
          rating?: number | null
          show_in_our_products?: boolean
          slug?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
          video_url?: string | null
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
          referred_by: string | null
          role: string | null
          sort_order: number | null
          status: string | null
          updated_at: string
          user_dashboard: boolean
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
          referred_by?: string | null
          role?: string | null
          sort_order?: number | null
          status?: string | null
          updated_at?: string
          user_dashboard?: boolean
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
          referred_by?: string | null
          role?: string | null
          sort_order?: number | null
          status?: string | null
          updated_at?: string
          user_dashboard?: boolean
          user_number?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      promotional_campaign_gallery: {
        Row: {
          campaign_id: string
          category: string
          created_at: string
          event_season_or_date: string | null
          featured: boolean
          full_video_enabled: boolean
          full_video_url: string | null
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
        }
        Insert: {
          campaign_id: string
          category: string
          created_at?: string
          event_season_or_date?: string | null
          featured?: boolean
          full_video_enabled?: boolean
          full_video_url?: string | null
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
        }
        Update: {
          campaign_id?: string
          category?: string
          created_at?: string
          event_season_or_date?: string | null
          featured?: boolean
          full_video_enabled?: boolean
          full_video_url?: string | null
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
        }
        Relationships: [
          {
            foreignKeyName: "promotional_campaign_gallery_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "promotional_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      promotional_campaign_products: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          is_active: boolean
          product_id: string
          sort_order: number
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          product_id: string
          sort_order?: number
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "promotional_campaign_products_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "promotional_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotional_campaign_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      promotional_campaigns: {
        Row: {
          banner_headline: string | null
          banner_poster_url: string | null
          banner_subheadline: string | null
          banner_tagline: string | null
          banner_video_url: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          meta_description: string | null
          meta_image_url: string | null
          meta_title: string | null
          pricing_card_1_description: string | null
          pricing_card_1_enabled: boolean | null
          pricing_card_1_features: Json | null
          pricing_card_1_ideal_for: string | null
          pricing_card_1_popular: boolean | null
          pricing_card_1_price: string | null
          pricing_card_1_title: string | null
          pricing_card_2_description: string | null
          pricing_card_2_enabled: boolean | null
          pricing_card_2_features: Json | null
          pricing_card_2_ideal_for: string | null
          pricing_card_2_popular: boolean | null
          pricing_card_2_price: string | null
          pricing_card_2_title: string | null
          pricing_card_3_description: string | null
          pricing_card_3_enabled: boolean | null
          pricing_card_3_features: Json | null
          pricing_card_3_ideal_for: string | null
          pricing_card_3_popular: boolean | null
          pricing_card_3_price: string | null
          pricing_card_3_title: string | null
          products_section_enabled: boolean
          promotional_footer_enabled: boolean | null
          slug: string
          title: string
          tracking_scripts: Json | null
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          banner_headline?: string | null
          banner_poster_url?: string | null
          banner_subheadline?: string | null
          banner_tagline?: string | null
          banner_video_url?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          meta_description?: string | null
          meta_image_url?: string | null
          meta_title?: string | null
          pricing_card_1_description?: string | null
          pricing_card_1_enabled?: boolean | null
          pricing_card_1_features?: Json | null
          pricing_card_1_ideal_for?: string | null
          pricing_card_1_popular?: boolean | null
          pricing_card_1_price?: string | null
          pricing_card_1_title?: string | null
          pricing_card_2_description?: string | null
          pricing_card_2_enabled?: boolean | null
          pricing_card_2_features?: Json | null
          pricing_card_2_ideal_for?: string | null
          pricing_card_2_popular?: boolean | null
          pricing_card_2_price?: string | null
          pricing_card_2_title?: string | null
          pricing_card_3_description?: string | null
          pricing_card_3_enabled?: boolean | null
          pricing_card_3_features?: Json | null
          pricing_card_3_ideal_for?: string | null
          pricing_card_3_popular?: boolean | null
          pricing_card_3_price?: string | null
          pricing_card_3_title?: string | null
          products_section_enabled?: boolean
          promotional_footer_enabled?: boolean | null
          slug: string
          title: string
          tracking_scripts?: Json | null
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          banner_headline?: string | null
          banner_poster_url?: string | null
          banner_subheadline?: string | null
          banner_tagline?: string | null
          banner_video_url?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          meta_description?: string | null
          meta_image_url?: string | null
          meta_title?: string | null
          pricing_card_1_description?: string | null
          pricing_card_1_enabled?: boolean | null
          pricing_card_1_features?: Json | null
          pricing_card_1_ideal_for?: string | null
          pricing_card_1_popular?: boolean | null
          pricing_card_1_price?: string | null
          pricing_card_1_title?: string | null
          pricing_card_2_description?: string | null
          pricing_card_2_enabled?: boolean | null
          pricing_card_2_features?: Json | null
          pricing_card_2_ideal_for?: string | null
          pricing_card_2_popular?: boolean | null
          pricing_card_2_price?: string | null
          pricing_card_2_title?: string | null
          pricing_card_3_description?: string | null
          pricing_card_3_enabled?: boolean | null
          pricing_card_3_features?: Json | null
          pricing_card_3_ideal_for?: string | null
          pricing_card_3_popular?: boolean | null
          pricing_card_3_price?: string | null
          pricing_card_3_title?: string | null
          products_section_enabled?: boolean
          promotional_footer_enabled?: boolean | null
          slug?: string
          title?: string
          tracking_scripts?: Json | null
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: []
      }
      promotional_popups: {
        Row: {
          bg_gradient: string
          countdown_hours: number
          created_at: string
          cta_label: string
          delay_seconds: number
          discount_label: string
          end_at: string | null
          icon: string
          id: string
          is_active: boolean
          legal_note: string | null
          phone_required: boolean
          show_once_per_session: boolean
          start_at: string | null
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          bg_gradient?: string
          countdown_hours?: number
          created_at?: string
          cta_label: string
          delay_seconds?: number
          discount_label: string
          end_at?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          legal_note?: string | null
          phone_required?: boolean
          show_once_per_session?: boolean
          start_at?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          bg_gradient?: string
          countdown_hours?: number
          created_at?: string
          cta_label?: string
          delay_seconds?: number
          discount_label?: string
          end_at?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          legal_note?: string | null
          phone_required?: boolean
          show_once_per_session?: boolean
          start_at?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          admin_notes: string | null
          affiliate_id: string
          campaign_source: string | null
          commission_amount: number | null
          commission_paid_at: string | null
          conversion_data: Json | null
          conversion_type: string
          created_at: string
          deal_status: string | null
          id: string
          referral_code: string
          referred_user_id: string | null
          visitor_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          affiliate_id: string
          campaign_source?: string | null
          commission_amount?: number | null
          commission_paid_at?: string | null
          conversion_data?: Json | null
          conversion_type: string
          created_at?: string
          deal_status?: string | null
          id?: string
          referral_code: string
          referred_user_id?: string | null
          visitor_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          affiliate_id?: string
          campaign_source?: string | null
          commission_amount?: number | null
          commission_paid_at?: string | null
          conversion_data?: Json | null
          conversion_type?: string
          created_at?: string
          deal_status?: string | null
          id?: string
          referral_code?: string
          referred_user_id?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_gallery_cards: {
        Row: {
          category: string
          created_at: string
          event_season_or_date: string | null
          featured: boolean
          full_video_enabled: boolean
          full_video_url: string | null
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
        }
        Insert: {
          category: string
          created_at?: string
          event_season_or_date?: string | null
          featured?: boolean
          full_video_enabled?: boolean
          full_video_url?: string | null
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
        }
        Update: {
          category?: string
          created_at?: string
          event_season_or_date?: string | null
          featured?: boolean
          full_video_enabled?: boolean
          full_video_url?: string | null
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
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      visitor_events: {
        Row: {
          created_at: string
          event_name: string | null
          event_payload: Json | null
          event_type: string
          id: string
          page_title: string | null
          page_url: string | null
          session_id: string | null
          visitor_id: string
        }
        Insert: {
          created_at?: string
          event_name?: string | null
          event_payload?: Json | null
          event_type: string
          id?: string
          page_title?: string | null
          page_url?: string | null
          session_id?: string | null
          visitor_id: string
        }
        Update: {
          created_at?: string
          event_name?: string | null
          event_payload?: Json | null
          event_type?: string
          id?: string
          page_title?: string | null
          page_url?: string | null
          session_id?: string | null
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visitor_events_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "visitors"
            referencedColumns: ["visitor_id"]
          },
        ]
      }
      visitor_popup_submissions: {
        Row: {
          id: string
          metadata: Json | null
          phone_number: string
          popup_id: string
          submitted_at: string
          synced_at: string | null
          synced_to_profile: boolean
          user_id: string | null
          visitor_id: string
        }
        Insert: {
          id?: string
          metadata?: Json | null
          phone_number: string
          popup_id: string
          submitted_at?: string
          synced_at?: string | null
          synced_to_profile?: boolean
          user_id?: string | null
          visitor_id: string
        }
        Update: {
          id?: string
          metadata?: Json | null
          phone_number?: string
          popup_id?: string
          submitted_at?: string
          synced_at?: string | null
          synced_to_profile?: boolean
          user_id?: string | null
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visitor_popup_submissions_popup_id_fkey"
            columns: ["popup_id"]
            isOneToOne: false
            referencedRelation: "promotional_popups"
            referencedColumns: ["id"]
          },
        ]
      }
      visitors: {
        Row: {
          browser: string | null
          created_at: string
          device_type: string | null
          first_landing_url: string | null
          id: string
          last_seen_at: string
          last_url: string | null
          linked_user_id: string | null
          metadata: Json | null
          os: string | null
          referrer: string | null
          screen_resolution: string | null
          status: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          visitor_id: string
        }
        Insert: {
          browser?: string | null
          created_at?: string
          device_type?: string | null
          first_landing_url?: string | null
          id?: string
          last_seen_at?: string
          last_url?: string | null
          linked_user_id?: string | null
          metadata?: Json | null
          os?: string | null
          referrer?: string | null
          screen_resolution?: string | null
          status?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id: string
        }
        Update: {
          browser?: string | null
          created_at?: string
          device_type?: string | null
          first_landing_url?: string | null
          id?: string
          last_seen_at?: string
          last_url?: string | null
          linked_user_id?: string | null
          metadata?: Json | null
          os?: string | null
          referrer?: string | null
          screen_resolution?: string | null
          status?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visitors_linked_user_id_fkey"
            columns: ["linked_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_booking_hold_rate_limit: {
        Args: { p_user_id?: string; p_visitor_id: string }
        Returns: boolean
      }
      check_popup_submission_rate_limit: {
        Args: { p_visitor_id: string }
        Returns: boolean
      }
      check_user_role_only: { Args: { _user_id: string }; Returns: string }
      generate_referral_code: { Args: { user_name?: string }; Returns: string }
      get_day_availability: {
        Args: { p_day: string; p_product_id: string }
        Returns: Json
      }
      get_slot_availability: {
        Args: { p_product_id: string; p_slot_end: string; p_slot_start: string }
        Returns: Json
      }
      has_role:
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
        | { Args: { _role: string; _user_id: string }; Returns: boolean }
      track_referral_conversion: {
        Args: {
          p_conversion_data?: Json
          p_conversion_type: string
          p_referral_code: string
          p_referred_user_id?: string
          p_visitor_id?: string
        }
        Returns: string
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
