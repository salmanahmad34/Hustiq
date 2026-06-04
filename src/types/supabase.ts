/**
 * Supabase Database Types Generated from Schema
 * This file is used by the Supabase client for type safety
 */

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          name: string | null
          role: 'student' | 'provider'
          avatar_url: string | null
          bio: string | null
          phone: string | null
          onboarding_completed: boolean
          metadata: Record<string, any> | null
          created_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          name?: string | null
          role?: 'student' | 'provider'
          avatar_url?: string | null
          bio?: string | null
          phone?: string | null
          onboarding_completed?: boolean
          metadata?: Record<string, any> | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          name?: string | null
          role?: 'student' | 'provider'
          avatar_url?: string | null
          bio?: string | null
          phone?: string | null
          onboarding_completed?: boolean
          metadata?: Record<string, any> | null
          created_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          title: string
          business_name: string
          description: string | null
          payout: number
          payout_type: 'hr' | 'shift' | 'month' | 'task'
          is_urgent: boolean
          is_premium: boolean
          is_verified: boolean
          location: string | null
          distance: string | null
          timing: string | null
          posted_time: string | null
          tags: string[] | null
          logo_placeholder: string | null
          provider_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          business_name: string
          description?: string | null
          payout: number
          payout_type: 'hr' | 'shift' | 'month' | 'task'
          is_urgent?: boolean
          is_premium?: boolean
          is_verified?: boolean
          location?: string | null
          distance?: string | null
          timing?: string | null
          posted_time?: string | null
          tags?: string[] | null
          logo_placeholder?: string | null
          provider_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          business_name?: string
          description?: string | null
          payout?: number
          payout_type?: 'hr' | 'shift' | 'month' | 'task'
          is_urgent?: boolean
          is_premium?: boolean
          is_verified?: boolean
          location?: string | null
          distance?: string | null
          timing?: string | null
          posted_time?: string | null
          tags?: string[] | null
          logo_placeholder?: string | null
          provider_id?: string | null
          created_at?: string
        }
      }
      applications: {
        Row: {
          id: string
          job_id: string | null
          student_id: string | null
          status: 'applied' | 'viewed' | 'accepted' | 'rejected'
          applied_date: string | null
          response_estimate: string | null
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          job_id?: string | null
          student_id?: string | null
          status?: 'applied' | 'viewed' | 'accepted' | 'rejected'
          applied_date?: string | null
          response_estimate?: string | null
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          job_id?: string | null
          student_id?: string | null
          status?: 'applied' | 'viewed' | 'accepted' | 'rejected'
          applied_date?: string | null
          response_estimate?: string | null
          note?: string | null
          created_at?: string
        }
      }
      saved_jobs: {
        Row: {
          id: string
          student_id: string | null
          job_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          student_id?: string | null
          job_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string | null
          job_id?: string | null
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string | null
          recipient_id: string | null
          content: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          sender_id?: string | null
          recipient_id?: string | null
          content: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string | null
          recipient_id?: string | null
          content?: string
          is_read?: boolean
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          reviewer_id: string | null
          reviewee_id: string | null
          rating: number
          tags: string[] | null
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          reviewer_id?: string | null
          reviewee_id?: string | null
          rating: number
          tags?: string[] | null
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          reviewer_id?: string | null
          reviewee_id?: string | null
          rating?: number
          tags?: string[] | null
          comment?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string | null
          type: string
          title: string
          content: string
          is_read: boolean
          is_important: boolean
          metadata: Record<string, any> | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          type: string
          title: string
          content: string
          is_read?: boolean
          is_important?: boolean
          metadata?: Record<string, any> | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          type?: string
          title?: string
          content?: string
          is_read?: boolean
          is_important?: boolean
          metadata?: Record<string, any> | null
          created_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}
