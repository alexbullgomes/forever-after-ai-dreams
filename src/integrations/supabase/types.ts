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
          price: number
          price_unit: string | null
          rating: number | null
          slug: string | null
          sort_order: number
          title: string
          updated_at: string
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
          price: number
          price_unit?: string | null
          rating?: number | null
          slug?: string | null
          sort_order?: number
          title: string
          updated_at?: string
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
          price?: number
          price_unit?: string | null
          rating?: number | null
          slug?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
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
          affiliate_id: string
          conversion_data: Json | null
          conversion_type: string
          created_at: string
          id: string
          referral_code: string
          referred_user_id: string | null
          visitor_id: string | null
        }
        Insert: {
          affiliate_id: string
          conversion_data?: Json | null
          conversion_type: string
          created_at?: string
          id?: string
          referral_code: string
          referred_user_id?: string | null
          visitor_id?: string | null
        }
        Update: {
          affiliate_id?: string
          conversion_data?: Json | null
          conversion_type?: string
          created_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_user_role_only: { Args: { _user_id: string }; Returns: string }
      generate_referral_code: { Args: { user_name?: string }; Returns: string }
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
