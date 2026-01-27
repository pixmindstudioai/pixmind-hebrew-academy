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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string
          changes: Json | null
          entity_id: string
          entity_type: string
          id: string
          timestamp: string
        }
        Insert: {
          action: string
          admin_id: string
          changes?: Json | null
          entity_id: string
          entity_type: string
          id?: string
          timestamp?: string
        }
        Update: {
          action?: string
          admin_id?: string
          changes?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_log_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bundle_modules: {
        Row: {
          bundle_id: string
          created_at: string
          id: string
          module_id: string
          order_index: number
        }
        Insert: {
          bundle_id: string
          created_at?: string
          id?: string
          module_id: string
          order_index?: number
        }
        Update: {
          bundle_id?: string
          created_at?: string
          id?: string
          module_id?: string
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "bundle_modules_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      bundles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_paid: boolean
          order_index: number
          payment_url: string | null
          regular_price: number | null
          sale_active: boolean | null
          sale_end_date: string | null
          sale_price: number | null
          sale_start_date: string | null
          status: string
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_paid?: boolean
          order_index?: number
          payment_url?: string | null
          regular_price?: number | null
          sale_active?: boolean | null
          sale_end_date?: string | null
          sale_price?: number | null
          sale_start_date?: string | null
          status?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_paid?: boolean
          order_index?: number
          payment_url?: string | null
          regular_price?: number | null
          sale_active?: boolean | null
          sale_end_date?: string | null
          sale_price?: number | null
          sale_start_date?: string | null
          status?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      chapters: {
        Row: {
          cohort_id: string | null
          created_at: string
          description: string | null
          id: string
          module_id: string
          order_index: number
          published_at: string | null
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
          visibility_mode: string
        }
        Insert: {
          cohort_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          module_id: string
          order_index?: number
          published_at?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
          visibility_mode?: string
        }
        Update: {
          cohort_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          module_id?: string
          order_index?: number
          published_at?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
          visibility_mode?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapters_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      cohort_students: {
        Row: {
          cohort_id: string
          created_at: string
          email: string
          id: string
          status: string
          user_id: string | null
        }
        Insert: {
          cohort_id: string
          created_at?: string
          email: string
          id?: string
          status?: string
          user_id?: string | null
        }
        Update: {
          cohort_id?: string
          created_at?: string
          email?: string
          id?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cohort_students_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohort_students_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cohorts: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean
          module_id: string
          name: string
          start_date: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          module_id: string
          name: string
          start_date?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          module_id?: string
          name?: string
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cohorts_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_reports: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          reason: string
          reported_by: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          reason: string
          reported_by: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          reason?: string
          reported_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "lesson_comments_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_reports_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          lesson_id: string
          parent_comment_id: string | null
          report_count: number
          status: Database["public"]["Enums"]["comment_status"]
          updated_at: string
          upvotes: number
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          lesson_id: string
          parent_comment_id?: string | null
          report_count?: number
          status?: Database["public"]["Enums"]["comment_status"]
          updated_at?: string
          upvotes?: number
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          lesson_id?: string
          parent_comment_id?: string | null
          report_count?: number
          status?: Database["public"]["Enums"]["comment_status"]
          updated_at?: string
          upvotes?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "lesson_comments_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_messages: {
        Row: {
          admin_notes: string | null
          assigned_to: string | null
          closed_at: string | null
          created_at: string
          id: string
          message_text: string
          message_type: Database["public"]["Enums"]["message_type"]
          related_lesson_id: string | null
          related_module_id: string | null
          status: Database["public"]["Enums"]["message_status"]
          tags: string[] | null
          updated_at: string
          user_email: string
          user_id: string | null
          user_name: string | null
          viewed_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          assigned_to?: string | null
          closed_at?: string | null
          created_at?: string
          id?: string
          message_text: string
          message_type?: Database["public"]["Enums"]["message_type"]
          related_lesson_id?: string | null
          related_module_id?: string | null
          status?: Database["public"]["Enums"]["message_status"]
          tags?: string[] | null
          updated_at?: string
          user_email: string
          user_id?: string | null
          user_name?: string | null
          viewed_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          assigned_to?: string | null
          closed_at?: string | null
          created_at?: string
          id?: string
          message_text?: string
          message_type?: Database["public"]["Enums"]["message_type"]
          related_lesson_id?: string | null
          related_module_id?: string | null
          status?: Database["public"]["Enums"]["message_status"]
          tags?: string[] | null
          updated_at?: string
          user_email?: string
          user_id?: string | null
          user_name?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_messages_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_messages_related_lesson_id_fkey"
            columns: ["related_lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_messages_related_module_id_fkey"
            columns: ["related_module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_attachments: {
        Row: {
          id: string
          kind: Database["public"]["Enums"]["attachment_kind"]
          lesson_id: string
          mime: string
          name: string
          order_index: number
          size: number
          uploaded_at: string
          url: string
        }
        Insert: {
          id?: string
          kind: Database["public"]["Enums"]["attachment_kind"]
          lesson_id: string
          mime: string
          name: string
          order_index?: number
          size: number
          uploaded_at?: string
          url: string
        }
        Update: {
          id?: string
          kind?: Database["public"]["Enums"]["attachment_kind"]
          lesson_id?: string
          mime?: string
          name?: string
          order_index?: number
          size?: number
          uploaded_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_attachments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_embeds: {
        Row: {
          created_at: string
          description: string | null
          id: string
          lesson_id: string
          order_index: number
          title: string | null
          type: Database["public"]["Enums"]["embed_type"]
          url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          lesson_id: string
          order_index?: number
          title?: string | null
          type: Database["public"]["Enums"]["embed_type"]
          url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          lesson_id?: string
          order_index?: number
          title?: string | null
          type?: Database["public"]["Enums"]["embed_type"]
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_embeds_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_ratings: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_ratings_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_tasks: {
        Row: {
          allowed_types: string[]
          created_at: string
          id: string
          instructions: string
          is_active: boolean
          is_mandatory: boolean
          lesson_id: string
          updated_at: string
        }
        Insert: {
          allowed_types?: string[]
          created_at?: string
          id?: string
          instructions: string
          is_active?: boolean
          is_mandatory?: boolean
          lesson_id: string
          updated_at?: string
        }
        Update: {
          allowed_types?: string[]
          created_at?: string
          id?: string
          instructions?: string
          is_active?: boolean
          is_mandatory?: boolean
          lesson_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_tasks_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_transcripts: {
        Row: {
          content: Json
          created_at: string
          id: string
          language: string
          lesson_id: string
          updated_at: string
        }
        Insert: {
          content: Json
          created_at?: string
          id?: string
          language?: string
          lesson_id: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          language?: string
          lesson_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_transcripts_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          attachments: Json | null
          chapter_id: string
          cohort_id: string | null
          created_at: string
          description: string
          duration_sec: number | null
          embeds: Json | null
          id: string
          images: Json | null
          lesson_type: string
          links: Json | null
          order_index: number
          published_at: string | null
          rich_text: string | null
          status: Database["public"]["Enums"]["content_status"]
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_id: string | null
          video_provider: Database["public"]["Enums"]["video_provider"] | null
          video_start_time: number | null
          video_thumbnail: string | null
          video_url: string | null
          visibility_mode: string
        }
        Insert: {
          attachments?: Json | null
          chapter_id: string
          cohort_id?: string | null
          created_at?: string
          description: string
          duration_sec?: number | null
          embeds?: Json | null
          id?: string
          images?: Json | null
          lesson_type?: string
          links?: Json | null
          order_index?: number
          published_at?: string | null
          rich_text?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_id?: string | null
          video_provider?: Database["public"]["Enums"]["video_provider"] | null
          video_start_time?: number | null
          video_thumbnail?: string | null
          video_url?: string | null
          visibility_mode?: string
        }
        Update: {
          attachments?: Json | null
          chapter_id?: string
          cohort_id?: string | null
          created_at?: string
          description?: string
          duration_sec?: number | null
          embeds?: Json | null
          id?: string
          images?: Json | null
          lesson_type?: string
          links?: Json | null
          order_index?: number
          published_at?: string | null
          rich_text?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_id?: string | null
          video_provider?: Database["public"]["Enums"]["video_provider"] | null
          video_start_time?: number | null
          video_thumbnail?: string | null
          video_url?: string | null
          visibility_mode?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
        ]
      }
      mcp_tool_settings: {
        Row: {
          allowed_roles: string[]
          category: string
          description_en: string | null
          description_he: string | null
          id: string
          is_enabled: boolean
          rate_limit_per_minute: number | null
          tool_name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          allowed_roles?: string[]
          category?: string
          description_en?: string | null
          description_he?: string | null
          id?: string
          is_enabled?: boolean
          rate_limit_per_minute?: number | null
          tool_name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          allowed_roles?: string[]
          category?: string
          description_en?: string | null
          description_he?: string | null
          id?: string
          is_enabled?: boolean
          rate_limit_per_minute?: number | null
          tool_name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      moderation_actions: {
        Row: {
          action: Database["public"]["Enums"]["moderation_action"]
          comment_id: string
          id: string
          moderator_id: string
          reason: string | null
          timestamp: string
        }
        Insert: {
          action: Database["public"]["Enums"]["moderation_action"]
          comment_id: string
          id?: string
          moderator_id: string
          reason?: string | null
          timestamp?: string
        }
        Update: {
          action?: Database["public"]["Enums"]["moderation_action"]
          comment_id?: string
          id?: string
          moderator_id?: string
          reason?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_actions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_actions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "lesson_comments_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_actions_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          became_paid_at: string | null
          created_at: string
          created_by: string
          description: string
          id: string
          image_url: string | null
          is_hidden: boolean
          is_paid: boolean
          is_verified: boolean | null
          order_index: number
          payment_url: string | null
          published_at: string | null
          regular_price: number | null
          sale_active: boolean | null
          sale_end_date: string | null
          sale_price: number | null
          sale_start_date: string | null
          status: Database["public"]["Enums"]["content_status"]
          thumbnail_url: string | null
          title: string
          updated_at: string
          was_free_before: boolean
        }
        Insert: {
          became_paid_at?: string | null
          created_at?: string
          created_by: string
          description: string
          id?: string
          image_url?: string | null
          is_hidden?: boolean
          is_paid?: boolean
          is_verified?: boolean | null
          order_index?: number
          payment_url?: string | null
          published_at?: string | null
          regular_price?: number | null
          sale_active?: boolean | null
          sale_end_date?: string | null
          sale_price?: number | null
          sale_start_date?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          was_free_before?: boolean
        }
        Update: {
          became_paid_at?: string | null
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          image_url?: string | null
          is_hidden?: boolean
          is_paid?: boolean
          is_verified?: boolean | null
          order_index?: number
          payment_url?: string | null
          published_at?: string | null
          regular_price?: number | null
          sale_active?: boolean | null
          sale_end_date?: string | null
          sale_price?: number | null
          sale_start_date?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          was_free_before?: boolean
        }
        Relationships: []
      }
      oauth_auth_codes: {
        Row: {
          client_id: string
          code: string
          code_challenge: string
          code_challenge_method: string
          created_at: string
          expires_at: string
          id: string
          redirect_uri: string
          scope: string
          used_at: string | null
          user_email: string
          user_id: string
          user_role: string
        }
        Insert: {
          client_id: string
          code: string
          code_challenge: string
          code_challenge_method?: string
          created_at?: string
          expires_at: string
          id?: string
          redirect_uri: string
          scope?: string
          used_at?: string | null
          user_email: string
          user_id: string
          user_role?: string
        }
        Update: {
          client_id?: string
          code?: string
          code_challenge?: string
          code_challenge_method?: string
          created_at?: string
          expires_at?: string
          id?: string
          redirect_uri?: string
          scope?: string
          used_at?: string | null
          user_email?: string
          user_id?: string
          user_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_auth_codes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients"
            referencedColumns: ["client_id"]
          },
        ]
      }
      oauth_clients: {
        Row: {
          active: boolean
          allowed_scopes: string[]
          client_id: string
          client_name: string
          client_secret_hash: string | null
          created_at: string
          id: string
          redirect_uris: string[]
          updated_at: string
        }
        Insert: {
          active?: boolean
          allowed_scopes?: string[]
          client_id: string
          client_name: string
          client_secret_hash?: string | null
          created_at?: string
          id?: string
          redirect_uris?: string[]
          updated_at?: string
        }
        Update: {
          active?: boolean
          allowed_scopes?: string[]
          client_id?: string
          client_name?: string
          client_secret_hash?: string | null
          created_at?: string
          id?: string
          redirect_uris?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      oauth_tokens: {
        Row: {
          client_id: string
          created_at: string
          expires_at: string
          id: string
          revoked_at: string | null
          scope: string
          token_hash: string
          user_email: string
          user_id: string
          user_role: string
        }
        Insert: {
          client_id: string
          created_at?: string
          expires_at: string
          id?: string
          revoked_at?: string | null
          scope?: string
          token_hash: string
          user_email: string
          user_id: string
          user_role?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          revoked_at?: string | null
          scope?: string
          token_hash?: string
          user_email?: string
          user_id?: string
          user_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_tokens_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients"
            referencedColumns: ["client_id"]
          },
        ]
      }
      payment_product_map: {
        Row: {
          module_id: string | null
          product_id: string | null
          provider: string | null
        }
        Insert: {
          module_id?: string | null
          product_id?: string | null
          provider?: string | null
        }
        Update: {
          module_id?: string | null
          product_id?: string | null
          provider?: string | null
        }
        Relationships: []
      }
      publish_events: {
        Row: {
          action: string
          created_at: string
          entity_id: string
          entity_type: string
          executed_at: string | null
          id: string
          scheduled_at: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id: string
          entity_type: string
          executed_at?: string | null
          id?: string
          scheduled_at?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          executed_at?: string | null
          id?: string
          scheduled_at?: string | null
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount: number | null
          created_at: string | null
          currency: string | null
          full_name: string | null
          id: string
          module_id: string | null
          payment_date: string
          payment_desc: string | null
          provider: string | null
          status: string | null
          transaction_id: string
          updated_at: string | null
          user_email: string
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          full_name?: string | null
          id?: string
          module_id?: string | null
          payment_date: string
          payment_desc?: string | null
          provider?: string | null
          status?: string | null
          transaction_id: string
          updated_at?: string | null
          user_email: string
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          full_name?: string | null
          id?: string
          module_id?: string | null
          payment_date?: string
          payment_desc?: string | null
          provider?: string | null
          status?: string | null
          transaction_id?: string
          updated_at?: string | null
          user_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      task_submissions: {
        Row: {
          ai_confidence: number | null
          ai_explanation: string | null
          ai_status: string
          content_text: string | null
          content_url: string | null
          created_at: string
          id: string
          manual_by: string | null
          manual_override: boolean | null
          manual_status: string | null
          submission_type: string
          task_id: string
          updated_at: string
          user_email: string
          user_id: string | null
        }
        Insert: {
          ai_confidence?: number | null
          ai_explanation?: string | null
          ai_status?: string
          content_text?: string | null
          content_url?: string | null
          created_at?: string
          id?: string
          manual_by?: string | null
          manual_override?: boolean | null
          manual_status?: string | null
          submission_type: string
          task_id: string
          updated_at?: string
          user_email: string
          user_id?: string | null
        }
        Update: {
          ai_confidence?: number | null
          ai_explanation?: string | null
          ai_status?: string
          content_text?: string | null
          content_url?: string | null
          created_at?: string
          id?: string
          manual_by?: string | null
          manual_override?: boolean | null
          manual_status?: string | null
          submission_type?: string
          task_id?: string
          updated_at?: string
          user_email?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_submissions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "lesson_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_usage_logs: {
        Row: {
          actor_email: string
          actor_role: string
          created_at: string
          error_message: string | null
          execution_time_ms: number | null
          id: string
          input_params: Json | null
          lesson_id: string | null
          module_id: string | null
          response_preview: string | null
          status: string
          tool_name: string
        }
        Insert: {
          actor_email: string
          actor_role: string
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          input_params?: Json | null
          lesson_id?: string | null
          module_id?: string | null
          response_preview?: string | null
          status?: string
          tool_name: string
        }
        Update: {
          actor_email?: string
          actor_role?: string
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          input_params?: Json | null
          lesson_id?: string | null
          module_id?: string | null
          response_preview?: string | null
          status?: string
          tool_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_usage_logs_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_usage_logs_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_log: {
        Row: {
          action_details: Json | null
          action_type: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_bundle_access: {
        Row: {
          bundle_id: string
          expires_at: string | null
          granted_at: string
          granted_by: string | null
          id: string
          notes: string | null
          transaction_id: string | null
          user_email: string
        }
        Insert: {
          bundle_id: string
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          notes?: string | null
          transaction_id?: string | null
          user_email: string
        }
        Update: {
          bundle_id?: string
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          notes?: string | null
          transaction_id?: string | null
          user_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_bundle_access_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "bundles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_module_access: {
        Row: {
          expires_at: string | null
          granted_at: string
          granted_by: string | null
          id: string
          module_id: string
          notes: string | null
          provider: string | null
          transaction_id: string | null
          user_email: string
        }
        Insert: {
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          module_id: string
          notes?: string | null
          provider?: string | null
          transaction_id?: string | null
          user_email: string
        }
        Update: {
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          module_id?: string
          notes?: string | null
          provider?: string | null
          transaction_id?: string | null
          user_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_module_access_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          lesson_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          device_count: number | null
          email: string
          full_name: string
          id: string
          last_login_at: string | null
          preferences: Json | null
          profile_picture_url: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          device_count?: number | null
          email: string
          full_name: string
          id?: string
          last_login_at?: string | null
          preferences?: Json | null
          profile_picture_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          device_count?: number | null
          email?: string
          full_name?: string
          id?: string
          last_login_at?: string | null
          preferences?: Json | null
          profile_picture_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_type: string | null
          id: string
          payload: Json
          processed: boolean | null
          provider: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_type?: string | null
          id?: string
          payload: Json
          processed?: boolean | null
          provider: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_type?: string | null
          id?: string
          payload?: Json
          processed?: boolean | null
          provider?: string
        }
        Relationships: []
      }
    }
    Views: {
      lesson_comments_public: {
        Row: {
          content: string | null
          created_at: string | null
          id: string | null
          lesson_id: string | null
          parent_comment_id: string | null
          upvotes: number | null
          user_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "lesson_comments_public"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_rating_stats: {
        Row: {
          average_rating: number | null
          five_star_count: number | null
          four_star_count: number | null
          lesson_id: string | null
          one_star_count: number | null
          three_star_count: number | null
          total_ratings: number | null
          two_star_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_ratings_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      assign_message: {
        Args: { p_assigned_to: string; p_message_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_admin_user: { Args: { user_id: string }; Returns: boolean }
      log_user_activity: {
        Args: {
          p_action_details?: Json
          p_action_type: string
          p_user_id: string
        }
        Returns: undefined
      }
      reset_user_module_progress: {
        Args: { p_module_id: string; p_user_id: string }
        Returns: undefined
      }
      set_current_user_admin: {
        Args: { secret_code: string }
        Returns: boolean
      }
      update_message_status: {
        Args: {
          p_message_id: string
          p_status: Database["public"]["Enums"]["message_status"]
        }
        Returns: undefined
      }
      update_user_status: {
        Args: { p_status: string; p_user_id: string }
        Returns: undefined
      }
      upsert_user_access: {
        Args: {
          p_email: string
          p_expires?: string
          p_module: string
          p_notes?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      attachment_kind:
        | "pdf"
        | "docx"
        | "xlsx"
        | "pptx"
        | "zip"
        | "image"
        | "other"
      comment_status: "pending" | "approved" | "hidden" | "flagged"
      content_status: "draft" | "active" | "archived"
      embed_type: "link" | "iframe"
      message_status: "new" | "viewed" | "closed"
      message_type: "support" | "question" | "feedback" | "purchase" | "general"
      moderation_action: "approve" | "hide" | "flag" | "restore"
      moderation_action_type: "approve" | "hide" | "flag" | "restore"
      user_role: "student" | "admin" | "moderator"
      video_provider: "youtube" | "vimeo" | "file"
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
      attachment_kind: ["pdf", "docx", "xlsx", "pptx", "zip", "image", "other"],
      comment_status: ["pending", "approved", "hidden", "flagged"],
      content_status: ["draft", "active", "archived"],
      embed_type: ["link", "iframe"],
      message_status: ["new", "viewed", "closed"],
      message_type: ["support", "question", "feedback", "purchase", "general"],
      moderation_action: ["approve", "hide", "flag", "restore"],
      moderation_action_type: ["approve", "hide", "flag", "restore"],
      user_role: ["student", "admin", "moderator"],
      video_provider: ["youtube", "vimeo", "file"],
    },
  },
} as const
