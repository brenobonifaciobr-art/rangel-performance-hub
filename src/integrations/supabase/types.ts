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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      evaluation_metrics: {
        Row: {
          created_at: string
          evaluation_id: string
          id: string
          metric_key: string
          metric_text: string | null
          metric_value: number | null
          trainer_id: string
          unit: string | null
        }
        Insert: {
          created_at?: string
          evaluation_id: string
          id?: string
          metric_key: string
          metric_text?: string | null
          metric_value?: number | null
          trainer_id?: string
          unit?: string | null
        }
        Update: {
          created_at?: string
          evaluation_id?: string
          id?: string
          metric_key?: string
          metric_text?: string | null
          metric_value?: number | null
          trainer_id?: string
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_metrics_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "evaluations"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluations: {
        Row: {
          created_at: string
          evaluated_on: string
          id: string
          notes: string | null
          student_id: string
          trainer_id: string
        }
        Insert: {
          created_at?: string
          evaluated_on: string
          id?: string
          notes?: string | null
          student_id: string
          trainer_id?: string
        }
        Update: {
          created_at?: string
          evaluated_on?: string
          id?: string
          notes?: string | null
          student_id?: string
          trainer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string
          description: string
          due_date: string | null
          id: string
          priority: number
          status: Database["public"]["Enums"]["goal_status"]
          student_id: string
          trainer_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          due_date?: string | null
          id?: string
          priority?: number
          status?: Database["public"]["Enums"]["goal_status"]
          student_id: string
          trainer_id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          priority?: number
          status?: Database["public"]["Enums"]["goal_status"]
          student_id?: string
          trainer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      score_configs: {
        Row: {
          active: boolean
          created_at: string
          id: string
          trainer_id: string
          version: number
          weights: Json
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          trainer_id?: string
          version?: number
          weights?: Json
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          trainer_id?: string
          version?: number
          weights?: Json
        }
        Relationships: []
      }
      score_snapshots: {
        Row: {
          breakdown: Json
          config_id: string | null
          created_at: string
          id: string
          reference_date: string
          score: number
          student_id: string
          trainer_id: string
        }
        Insert: {
          breakdown?: Json
          config_id?: string | null
          created_at?: string
          id?: string
          reference_date: string
          score: number
          student_id: string
          trainer_id?: string
        }
        Update: {
          breakdown?: Json
          config_id?: string | null
          created_at?: string
          id?: string
          reference_date?: string
          score?: number
          student_id?: string
          trainer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "score_snapshots_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "score_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "score_snapshots_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      session_exercises: {
        Row: {
          created_at: string
          id: string
          loads_text: string | null
          name: string
          note: string | null
          position: number
          reference_load: number | null
          reps_text: string | null
          rpe: number | null
          session_id: string
          sets: number | null
          trainer_id: string
          unit: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          loads_text?: string | null
          name: string
          note?: string | null
          position: number
          reference_load?: number | null
          reps_text?: string | null
          rpe?: number | null
          session_id: string
          sets?: number | null
          trainer_id?: string
          unit?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          loads_text?: string | null
          name?: string
          note?: string | null
          position?: number
          reference_load?: number | null
          reps_text?: string | null
          rpe?: number | null
          session_id?: string
          sets?: number | null
          trainer_id?: string
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_exercises_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          attendance: Database["public"]["Enums"]["attendance"]
          attention_points: string | null
          created_at: string
          duration_minutes: number | null
          energy: number | null
          evolution_notes: string | null
          id: string
          initial_notes: string | null
          late_minutes: number | null
          mood: string | null
          next_goal: string | null
          pain: number | null
          plan_id: string | null
          positives: string | null
          session_date: string
          sleep: string | null
          student_id: string
          trainer_id: string
          updated_at: string
          week_number: number
          workout_type: string | null
        }
        Insert: {
          attendance: Database["public"]["Enums"]["attendance"]
          attention_points?: string | null
          created_at?: string
          duration_minutes?: number | null
          energy?: number | null
          evolution_notes?: string | null
          id?: string
          initial_notes?: string | null
          late_minutes?: number | null
          mood?: string | null
          next_goal?: string | null
          pain?: number | null
          plan_id?: string | null
          positives?: string | null
          session_date: string
          sleep?: string | null
          student_id: string
          trainer_id?: string
          updated_at?: string
          week_number: number
          workout_type?: string | null
        }
        Update: {
          attendance?: Database["public"]["Enums"]["attendance"]
          attention_points?: string | null
          created_at?: string
          duration_minutes?: number | null
          energy?: number | null
          evolution_notes?: string | null
          id?: string
          initial_notes?: string | null
          late_minutes?: number | null
          mood?: string | null
          next_goal?: string | null
          pain?: number | null
          plan_id?: string | null
          positives?: string | null
          session_date?: string
          sleep?: string | null
          student_id?: string
          trainer_id?: string
          updated_at?: string
          week_number?: number
          workout_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "weekly_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          birth_date: string | null
          created_at: string
          full_name: string
          id: string
          main_goal: string | null
          notes: string | null
          phone: string | null
          public_code: string
          restrictions: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["student_status"]
          trainer_id: string
          updated_at: string
          weekly_frequency: number
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          full_name: string
          id?: string
          main_goal?: string | null
          notes?: string | null
          phone?: string | null
          public_code: string
          restrictions?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["student_status"]
          trainer_id?: string
          updated_at?: string
          weekly_frequency?: number
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          full_name?: string
          id?: string
          main_goal?: string | null
          notes?: string | null
          phone?: string | null
          public_code?: string
          restrictions?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["student_status"]
          trainer_id?: string
          updated_at?: string
          weekly_frequency?: number
        }
        Relationships: []
      }
      weekly_plans: {
        Row: {
          created_at: string
          focus: string | null
          id: string
          note: string | null
          planned_date: string | null
          planned_workout: string | null
          status: Database["public"]["Enums"]["plan_status"]
          student_id: string
          trainer_id: string
          updated_at: string
          week_number: number
          week_start: string
        }
        Insert: {
          created_at?: string
          focus?: string | null
          id?: string
          note?: string | null
          planned_date?: string | null
          planned_workout?: string | null
          status?: Database["public"]["Enums"]["plan_status"]
          student_id: string
          trainer_id?: string
          updated_at?: string
          week_number: number
          week_start: string
        }
        Update: {
          created_at?: string
          focus?: string | null
          id?: string
          note?: string | null
          planned_date?: string | null
          planned_workout?: string | null
          status?: Database["public"]["Enums"]["plan_status"]
          student_id?: string
          trainer_id?: string
          updated_at?: string
          week_number?: number
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_plans_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      save_session: { Args: { payload: Json }; Returns: string }
      seed_demo_data: { Args: never; Returns: string }
    }
    Enums: {
      attendance: "presente" | "reposicao" | "falta" | "cancelada"
      goal_status: "ativo" | "concluido" | "arquivado"
      plan_status:
        | "planejado"
        | "realizado"
        | "falta"
        | "cancelado"
        | "remarcado"
      student_status: "ativo" | "pausado" | "inativo"
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
      attendance: ["presente", "reposicao", "falta", "cancelada"],
      goal_status: ["ativo", "concluido", "arquivado"],
      plan_status: [
        "planejado",
        "realizado",
        "falta",
        "cancelado",
        "remarcado",
      ],
      student_status: ["ativo", "pausado", "inativo"],
    },
  },
} as const
