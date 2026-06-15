export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type AppointmentStatus = "pending_payment" | "pending_confirmation" | "confirmed" | "cancelled" | "completed"

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          is_premium: boolean
          role: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          is_premium?: boolean
          role?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          is_premium?: boolean
          role?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      services: {
        Row: {
          id: string
          slug: string
          name: string
          description: string | null
          duration_minutes: number
          buffer_minutes: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          description?: string | null
          duration_minutes: number
          buffer_minutes?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          description?: string | null
          duration_minutes?: number
          buffer_minutes?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      availability_rules: {
        Row: {
          id: string
          consultant_id: string
          service_id: string | null
          day_of_week: number
          start_time: string
          end_time: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          consultant_id: string
          service_id?: string | null
          day_of_week: number
          start_time: string
          end_time: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          consultant_id?: string
          service_id?: string | null
          day_of_week?: number
          start_time?: string
          end_time?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      availability_exceptions: {
        Row: {
          id: string
          consultant_id: string
          service_id: string | null
          exception_date: string
          start_time: string
          end_time: string
          is_available: boolean
          created_at: string
        }
        Insert: {
          id?: string
          consultant_id: string
          service_id?: string | null
          exception_date: string
          start_time: string
          end_time: string
          is_available: boolean
          created_at?: string
        }
        Update: {
          id?: string
          consultant_id?: string
          service_id?: string | null
          exception_date?: string
          start_time?: string
          end_time?: string
          is_available?: boolean
          created_at?: string
        }
      }
      availability_rules_v2: {
        Row: {
          id: string
          day_of_week: number | null
          specific_date: string | null
          start_time: string
          end_time: string
          duration_minutes: number
          modality: string
          session_type: string
          max_participants: number
          max_online: number | null
          max_presencial: number | null
          service_id: string | null
          is_active: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          day_of_week?: number | null
          specific_date?: string | null
          start_time: string
          end_time: string
          duration_minutes: number
          modality?: string
          session_type?: string
          max_participants?: number
          max_online?: number | null
          max_presencial?: number | null
          service_id?: string | null
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          day_of_week?: number | null
          specific_date?: string | null
          start_time?: string
          end_time?: string
          duration_minutes?: number
          modality?: string
          session_type?: string
          max_participants?: number
          max_online?: number | null
          max_presencial?: number | null
          service_id?: string | null
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          service_id: string
          consultant_id: string
          client_id: string
          start_time: string
          end_time: string
          status: AppointmentStatus
          notes: string | null
          created_at: string
          updated_at: string
          confirmed_at: string | null
          confirmed_by: string | null
          cancelled_at: string | null
          cancelled_by: string | null
        }
        Insert: {
          id?: string
          service_id: string
          consultant_id: string
          client_id: string
          start_time: string
          end_time: string
          status?: AppointmentStatus
          notes?: string | null
          created_at?: string
          updated_at?: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
        }
        Update: {
          id?: string
          service_id?: string
          consultant_id?: string
          client_id?: string
          start_time?: string
          end_time?: string
          status?: AppointmentStatus
          notes?: string | null
          created_at?: string
          updated_at?: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
        }
      }
      content: {
        Row: {
          id: string
          title: string
          description: string | null
          type: "video" | "podcast"
          external_id: string
          thumbnail_url: string | null
          duration: number | null
          is_premium: boolean
          published_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          type: "video" | "podcast"
          external_id: string
          thumbnail_url?: string | null
          duration?: number | null
          is_premium?: boolean
          published_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          type?: "video" | "podcast"
          external_id?: string
          thumbnail_url?: string | null
          duration?: number | null
          is_premium?: boolean
          published_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      daily_reflections: {
        Row: {
          id: string
          user_id: string
          mood_score: number
          intention: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          mood_score: number
          intention?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          mood_score?: number
          intention?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      session_notes: {
        Row: {
          id: string
          user_id: string
          admin_id: string | null
          content: string
          is_private: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          admin_id?: string | null
          content: string
          is_private?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          admin_id?: string | null
          content?: string
          is_private?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      availability: {
        Row: {
          id: string
          day_of_week: number
          start_time: string
          end_time: string
          is_active: boolean
          consultant_id: string | null
          specific_date: string | null
          is_available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          day_of_week: number
          start_time: string
          end_time: string
          is_active?: boolean
          consultant_id?: string | null
          specific_date?: string | null
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          is_active?: boolean
          consultant_id?: string | null
          specific_date?: string | null
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      admin_users: {
        Row: {
          id: string
          user_id: string
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: string
          created_at?: string
        }
      }
      consultants: {
        Row: {
          id: string
          full_name: string
          title: string | null
          bio: string | null
          avatar_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          title?: string | null
          bio?: string | null
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          title?: string | null
          bio?: string | null
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      mp_credentials: {
        Row: {
          id: string
          owner_id: string
          mp_user_id: number
          access_token: string
          refresh_token: string
          token_expires_at: string
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          owner_id: string
          mp_user_id: number
          access_token: string
          refresh_token: string
          token_expires_at: string
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          owner_id?: string
          mp_user_id?: number
          access_token?: string
          refresh_token?: string
          token_expires_at?: string
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      pending_approvals: {
        Row: {
          id: string
          resource_type: string
          resource_id: string | null
          requested_by: string
          requested_at: string
          action: string
          payload: Json
          status: string
          reviewed_by: string | null
          reviewed_at: string | null
          review_note: string | null
          expires_at: string
        }
        Insert: {
          id?: string
          resource_type: string
          resource_id?: string | null
          requested_by: string
          requested_at?: string
          action: string
          payload: Json
          status?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_note?: string | null
          expires_at?: string
        }
        Update: {
          id?: string
          resource_type?: string
          resource_id?: string | null
          requested_by?: string
          requested_at?: string
          action?: string
          payload?: Json
          status?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_note?: string | null
          expires_at?: string
        }
      }
      email_campaigns: {
        Row: {
          id: string
          created_by: string
          subject: string
          segment: string
          tags: string[] | null
          recipient_count: number
          sent_count: number
          failed_count: number
          created_at: string
        }
        Insert: {
          id?: string
          created_by: string
          subject: string
          segment: string
          tags?: string[] | null
          recipient_count?: number
          sent_count?: number
          failed_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          created_by?: string
          subject?: string
          segment?: string
          tags?: string[] | null
          recipient_count?: number
          sent_count?: number
          failed_count?: number
          created_at?: string
        }
      }
      promotions: {
        Row: {
          id: string
          name: string
          description: string | null
          discount_percent: number | null
          discount_fixed: number | null
          price_override: number | null
          allowed_tiers: string[] | null
          max_purchases: number | null
          current_purchases: number
          is_active: boolean
          starts_at: string | null
          expires_at: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          discount_percent?: number | null
          discount_fixed?: number | null
          price_override?: number | null
          allowed_tiers?: string[] | null
          max_purchases?: number | null
          current_purchases?: number
          is_active?: boolean
          starts_at?: string | null
          expires_at?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          discount_percent?: number | null
          discount_fixed?: number | null
          price_override?: number | null
          allowed_tiers?: string[] | null
          max_purchases?: number | null
          current_purchases?: number
          is_active?: boolean
          starts_at?: string | null
          expires_at?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      promotion_sessions: {
        Row: {
          id: string
          promotion_id: string
          session_type: string
          modality: string
          session_count: number
          duration_minutes: number
        }
        Insert: {
          id?: string
          promotion_id: string
          session_type?: string
          modality?: string
          session_count?: number
          duration_minutes?: number
        }
        Update: {
          id?: string
          promotion_id?: string
          session_type?: string
          modality?: string
          session_count?: number
          duration_minutes?: number
        }
      }
      promo_purchases: {
        Row: {
          id: string
          promotion_id: string
          user_id: string
          mp_preference_id: string | null
          mp_payment_id: string | null
          amount_paid: number
          status: string
          sessions_remaining: number
          created_at: string
          paid_at: string | null
        }
        Insert: {
          id?: string
          promotion_id: string
          user_id: string
          mp_preference_id?: string | null
          mp_payment_id?: string | null
          amount_paid: number
          status?: string
          sessions_remaining?: number
          created_at?: string
          paid_at?: string | null
        }
        Update: {
          id?: string
          promotion_id?: string
          user_id?: string
          mp_preference_id?: string | null
          mp_payment_id?: string | null
          amount_paid?: number
          status?: string
          sessions_remaining?: number
          created_at?: string
          paid_at?: string | null
        }
      }
    }
    Functions: {
      jwt_is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      is_admin_user: {
        Args: Record<string, never>
        Returns: boolean
      }
      is_owner_user: {
        Args: Record<string, never>
        Returns: boolean
      }
      admin_manage_appointment: {
        Args: {
          p_appointment_id: string
          p_status?: AppointmentStatus
          p_notes?: string
          p_new_start_time?: string
        }
        Returns: Json
      }
      reschedule_appointment: {
        Args: {
          p_appointment_id: string
          p_new_start_time: string
          p_new_end_time: string
        }
        Returns: Json
      }
      cancel_appointment: {
        Args: {
          p_appointment_id: string
        }
        Returns: Json
      }
      get_available_slots_v2: {
        Args: {
          p_rule_id?: string
          p_date?: string
          p_modality?: string
          p_service_id?: string
        }
        Returns: Json
      }
      get_available_dates_v2: {
        Args: {
          p_year?: number
          p_month?: number
          p_modality?: string
          p_service_id?: string
        }
        Returns: Json
      }
      count_available_slots_v2: {
        Args: {
          p_date?: string
          p_modality?: string
          p_service_id?: string
        }
        Returns: number
      }
      expire_old_approvals: {
        Args: Record<string, never>
        Returns: number
      }
    }
  }
}
