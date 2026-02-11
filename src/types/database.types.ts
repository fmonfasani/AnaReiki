// Database Types for Supabase Tables
// Auto-generated types based on database schema

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          is_premium: boolean;
          role: "user" | "admin";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          is_premium?: boolean;
          role?: "user" | "admin";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          is_premium?: boolean;
          role?: "user" | "admin";
          created_at?: string;
          updated_at?: string;
        };
      };
      availability: {
        Row: {
          id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          day_of_week?: number;
          start_time?: string;
          end_time?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      content: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          type: "video" | "podcast";
          external_id: string;
          thumbnail_url: string | null;
          duration: number | null;
          is_premium: boolean;
          published_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          type: "video" | "podcast";
          external_id: string;
          thumbnail_url?: string | null;
          duration?: number | null;
          is_premium?: boolean;
          published_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          type?: "video" | "podcast";
          external_id?: string;
          thumbnail_url?: string | null;
          duration?: number | null;
          is_premium?: boolean;
          published_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
