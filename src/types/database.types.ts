// Database Types for Supabase Tables
// Manually maintained to match migration 006/007

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: string | null
          is_premium: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: string | null
          is_premium?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: string | null
          is_premium?: boolean
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
        }
        Insert: {
          id?: string
          consultant_id: string
          service_id?: string | null
          day_of_week: number
          start_time: string
          end_time: string
          is_active?: boolean
        }
        Update: {
          id?: string
          consultant_id?: string
          service_id?: string | null
          day_of_week?: number
          start_time?: string
          end_time?: string
          is_active?: boolean
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
        }
        Insert: {
          id?: string
          consultant_id: string
          service_id?: string | null
          exception_date: string
          start_time: string
          end_time: string
          is_available: boolean
        }
        Update: {
          id?: string
          consultant_id?: string
          service_id?: string | null
          exception_date?: string
          start_time?: string
          end_time?: string
          is_available?: boolean
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
          status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show"
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          service_id: string
          consultant_id: string
          client_id: string
          start_time: string
          end_time: string
          status?: "pending" | "confirmed" | "cancelled" | "completed" | "no_show"
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          service_id?: string
          consultant_id?: string
          client_id?: string
          start_time?: string
          end_time?: string
          status?: "pending" | "confirmed" | "cancelled" | "completed" | "no_show"
          notes?: string | null
          created_at?: string
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
        }
        Insert: {
          id?: string
          user_id: string
          mood_score: number
          intention?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          mood_score?: number
          intention?: string | null
          created_at?: string
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
        }
        Insert: {
          id?: string
          user_id: string
          admin_id?: string | null
          content: string
          is_private?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          admin_id?: string | null
          content?: string
          is_private?: boolean
          created_at?: string
        }
      }
    }
  }
}
