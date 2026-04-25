// Auto-generated database types for qi-chief-tracker (Supabase: ixthdiezadmpmyczmckf)
// Reflects the actual schema used in the app.

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
      projects: {
        Row: {
          id: string
          status: string
          title: string
          category: string | null
          subcategory: string | null
          primary_outcome: string | null
          pdsa_cycle: number
          proponents: string[]
          lead_proponents: string[]
          proponent_ids: string[]
          lead_proponent_ids: string[]
          faculty: string | null
          faculty_id: string | null
          updates_and_barriers: string | null
          internal_notes: string | null
          last_updated_date: string
          created_at: string
          updated_at: string
          updated_by: string | null
          protocol_url: string | null
          presentation_url: string | null
          target_conference: string | null
          faculty_approved_protocol: boolean
          faculty_approved_pdsa: boolean
          total_patients_impacted: number | null
          estimated_cost_savings: number | null
          abstract_summary: string | null
        }
        Insert: {
          id?: string
          status?: string
          title: string
          category?: string | null
          subcategory?: string | null
          primary_outcome?: string | null
          pdsa_cycle?: number
          proponents?: string[]
          lead_proponents?: string[]
          proponent_ids?: string[]
          lead_proponent_ids?: string[]
          faculty?: string | null
          faculty_id?: string | null
          updates_and_barriers?: string | null
          internal_notes?: string | null
          last_updated_date?: string
          created_at?: string
          updated_at?: string
          updated_by?: string | null
          protocol_url?: string | null
          presentation_url?: string | null
          target_conference?: string | null
          faculty_approved_protocol?: boolean
          faculty_approved_pdsa?: boolean
          total_patients_impacted?: number | null
          estimated_cost_savings?: number | null
          abstract_summary?: string | null
        }
        Update: {
          id?: string
          status?: string
          title?: string
          category?: string | null
          subcategory?: string | null
          primary_outcome?: string | null
          pdsa_cycle?: number
          proponents?: string[]
          lead_proponents?: string[]
          proponent_ids?: string[]
          lead_proponent_ids?: string[]
          faculty?: string | null
          faculty_id?: string | null
          updates_and_barriers?: string | null
          internal_notes?: string | null
          last_updated_date?: string
          created_at?: string
          updated_at?: string
          updated_by?: string | null
          protocol_url?: string | null
          presentation_url?: string | null
          target_conference?: string | null
          faculty_approved_protocol?: boolean
          faculty_approved_pdsa?: boolean
          total_patients_impacted?: number | null
          estimated_cost_savings?: number | null
          abstract_summary?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          role: string
          created_at: string
          email: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          role?: string
          created_at?: string
          email?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          role?: string
          created_at?: string
          email?: string | null
        }
      }
      comments: {
        Row: {
          id: string
          project_id: string
          user_id: string
          content: string
          parent_id: string | null
          is_resolved: boolean
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          content: string
          parent_id?: string | null
          is_resolved?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          content?: string
          parent_id?: string | null
          is_resolved?: boolean
          created_at?: string
        }
      }
      metrics: {
        Row: {
          id: string
          project_id: string
          label: string
          month: string
          value: number
          pdsa_cycle_id: number | null
        }
        Insert: {
          id?: string
          project_id: string
          label: string
          month: string
          value: number
          pdsa_cycle_id?: number | null
        }
        Update: {
          id?: string
          project_id?: string
          label?: string
          month?: string
          value?: number
          pdsa_cycle_id?: number | null
        }
      }
      directory: {
        Row: {
          id: string
          name: string
          email: string
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: string
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          table_name: string
          record_id: string
          action: string
          old_data: Json | null
          new_data: Json | null
          changed_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          table_name: string
          record_id: string
          action: string
          old_data?: Json | null
          new_data?: Json | null
          changed_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          table_name?: string
          record_id?: string
          action?: string
          old_data?: Json | null
          new_data?: Json | null
          changed_by?: string | null
          created_at?: string
        }
      }
      audit_log: {
        Row: {
          id: string
          project_id: string | null
          user_id: string | null
          field_name: string | null
          old_value: string | null
          new_value: string | null
          action: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id?: string | null
          user_id?: string | null
          field_name?: string | null
          old_value?: string | null
          new_value?: string | null
          action?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string | null
          user_id?: string | null
          field_name?: string | null
          old_value?: string | null
          new_value?: string | null
          action?: string | null
          created_at?: string
        }
      }
      system_errors: {
        Row: {
          id: string
          message: string | null
          stack: string | null
          context: string | null
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          message?: string | null
          stack?: string | null
          context?: string | null
          user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          message?: string | null
          stack?: string | null
          context?: string | null
          user_id?: string | null
          created_at?: string
        }
      }
      'project-documents': {
        Row: {
          id: string
          project_id: string
          name: string
          url: string
          type: string | null
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          url: string
          type?: string | null
          uploaded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          url?: string
          type?: string | null
          uploaded_by?: string | null
          created_at?: string
        }
      }
      attachments: {
        Row: {
          id: string
          project_id: string
          name: string
          url: string
          type: string | null
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          url: string
          type?: string | null
          uploaded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          url?: string
          type?: string | null
          uploaded_by?: string | null
          created_at?: string
        }
      }
      conferences_registry: {
        Row: {
          id: string
          name: string
          full_name: string | null
          short_name: string | null
          deadline_month: number | null
          deadline_day: number | null
          website: string | null
          last_ai_check: string | null
          ai_confidence: number | null
          abstract_deadline: string | null
          event_date: string | null
          url: string | null
          specialty: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          full_name?: string | null
          short_name?: string | null
          deadline_month?: number | null
          deadline_day?: number | null
          website?: string | null
          last_ai_check?: string | null
          ai_confidence?: number | null
          abstract_deadline?: string | null
          event_date?: string | null
          url?: string | null
          specialty?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          full_name?: string | null
          short_name?: string | null
          deadline_month?: number | null
          deadline_day?: number | null
          website?: string | null
          last_ai_check?: string | null
          ai_confidence?: number | null
          abstract_deadline?: string | null
          event_date?: string | null
          url?: string | null
          specialty?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
