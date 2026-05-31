export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed" | "no_show"

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
    }
    Functions: {
      jwt_is_admin: {
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
    }
  }
}
