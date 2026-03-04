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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tender_alerts: {
        Row: {
          categories: Database["public"]["Enums"]["tender_category"][] | null
          created_at: string
          id: string
          is_active: boolean
          keywords: string[] | null
          locations: string[] | null
          max_value: number | null
          min_value: number | null
          name: string
          user_id: string
        }
        Insert: {
          categories?: Database["public"]["Enums"]["tender_category"][] | null
          created_at?: string
          id?: string
          is_active?: boolean
          keywords?: string[] | null
          locations?: string[] | null
          max_value?: number | null
          min_value?: number | null
          name: string
          user_id: string
        }
        Update: {
          categories?: Database["public"]["Enums"]["tender_category"][] | null
          created_at?: string
          id?: string
          is_active?: boolean
          keywords?: string[] | null
          locations?: string[] | null
          max_value?: number | null
          min_value?: number | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      tenders: {
        Row: {
          ai_insights: Json | null
          ai_summary: string | null
          category: Database["public"]["Enums"]["tender_category"]
          contact_info: Json | null
          created_at: string
          deadline: string | null
          description: string | null
          file_name: string | null
          file_path: string | null
          id: string
          location: string | null
          organization: string | null
          raw_text: string | null
          requirements: string[] | null
          source_url: string | null
          status: Database["public"]["Enums"]["tender_status"]
          title: string
          updated_at: string
          user_id: string | null
          value_estimate: number | null
        }
        Insert: {
          ai_insights?: Json | null
          ai_summary?: string | null
          category?: Database["public"]["Enums"]["tender_category"]
          contact_info?: Json | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          location?: string | null
          organization?: string | null
          raw_text?: string | null
          requirements?: string[] | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["tender_status"]
          title: string
          updated_at?: string
          user_id?: string | null
          value_estimate?: number | null
        }
        Update: {
          ai_insights?: Json | null
          ai_summary?: string | null
          category?: Database["public"]["Enums"]["tender_category"]
          contact_info?: Json | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          location?: string | null
          organization?: string | null
          raw_text?: string | null
          requirements?: string[] | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["tender_status"]
          title?: string
          updated_at?: string
          user_id?: string | null
          value_estimate?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      tender_category:
        | "obras"
        | "servicos"
        | "compras"
        | "tecnologia"
        | "saude"
        | "educacao"
        | "outros"
      tender_status: "new" | "analyzing" | "analyzed" | "archived"
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
      tender_category: [
        "obras",
        "servicos",
        "compras",
        "tecnologia",
        "saude",
        "educacao",
        "outros",
      ],
      tender_status: ["new", "analyzing", "analyzed", "archived"],
    },
  },
} as const
