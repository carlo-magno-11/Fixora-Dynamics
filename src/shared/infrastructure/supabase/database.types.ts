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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      fixora_business_memberships: {
        Row: {
          business_id: string
          created_at: string
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          role: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fixora_business_memberships_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "fixora_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      fixora_businesses: {
        Row: {
          business_type: string
          created_at: string
          created_by: string
          currency_code: string
          id: string
          name: string
          timezone: string
          updated_at: string
        }
        Insert: {
          business_type?: string
          created_at?: string
          created_by: string
          currency_code?: string
          id?: string
          name: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          business_type?: string
          created_at?: string
          created_by?: string
          currency_code?: string
          id?: string
          name?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      fixora_calculation_snapshots: {
        Row: {
          business_id: string
          catalog_item_snapshot: Json | null
          created_at: string
          created_by: string
          currency_code: string
          formula_version: string
          id: string
          name: string
          pricing_input: Json
          pricing_result: Json
          schema_version: number
        }
        Insert: {
          business_id: string
          catalog_item_snapshot?: Json | null
          created_at?: string
          created_by?: string
          currency_code: string
          formula_version: string
          id?: string
          name: string
          pricing_input: Json
          pricing_result: Json
          schema_version?: number
        }
        Update: {
          business_id?: string
          catalog_item_snapshot?: Json | null
          created_at?: string
          created_by?: string
          currency_code?: string
          formula_version?: string
          id?: string
          name?: string
          pricing_input?: Json
          pricing_result?: Json
          schema_version?: number
        }
        Relationships: [
          {
            foreignKeyName: "fixora_calculation_snapshots_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "fixora_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      fixora_catalog_items: {
        Row: {
          business_id: string
          created_at: string
          created_by: string
          currency_code: string
          id: string
          is_active: boolean
          kind: string
          name: string
          reference_cost: number
          sku: string
          unit: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by?: string
          currency_code: string
          id?: string
          is_active?: boolean
          kind: string
          name: string
          reference_cost?: number
          sku?: string
          unit: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string
          currency_code?: string
          id?: string
          is_active?: boolean
          kind?: string
          name?: string
          reference_cost?: number
          sku?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fixora_catalog_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "fixora_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      fixora_expense_settings: {
        Row: {
          business_id: string
          created_at: string
          expected_units: number
          period: string
          updated_at: string
          updated_by: string
          version: number
        }
        Insert: {
          business_id: string
          created_at?: string
          expected_units?: number
          period?: string
          updated_at?: string
          updated_by: string
          version?: number
        }
        Update: {
          business_id?: string
          created_at?: string
          expected_units?: number
          period?: string
          updated_at?: string
          updated_by?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "fixora_expense_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "fixora_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      fixora_expenses: {
        Row: {
          amount: number
          business_id: string
          created_at: string
          created_by: string
          expense_type: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          amount: number
          business_id: string
          created_at?: string
          created_by?: string
          expense_type: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          amount?: number
          business_id?: string
          created_at?: string
          created_by?: string
          expense_type?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fixora_expenses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "fixora_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      fixora_profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          locale: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          locale?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          locale?: string
          updated_at?: string
        }
        Relationships: []
      }
      fixora_support_messages: {
        Row: {
          attachments: Json
          body: string
          created_at: string
          id: string
          sender_type: string
          sender_user_id: string
          ticket_id: string
        }
        Insert: {
          attachments?: Json
          body: string
          created_at?: string
          id?: string
          sender_type?: string
          sender_user_id?: string
          ticket_id: string
        }
        Update: {
          attachments?: Json
          body?: string
          created_at?: string
          id?: string
          sender_type?: string
          sender_user_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fixora_support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "fixora_support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      fixora_support_tickets: {
        Row: {
          assigned_to: string | null
          business_id: string | null
          category: string
          closed_at: string | null
          created_at: string
          created_by: string
          id: string
          license_id: string | null
          priority: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          business_id?: string | null
          category: string
          closed_at?: string | null
          created_at?: string
          created_by?: string
          id?: string
          license_id?: string | null
          priority?: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          business_id?: string | null
          category?: string
          closed_at?: string | null
          created_at?: string
          created_by?: string
          id?: string
          license_id?: string | null
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fixora_support_tickets_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "fixora_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      fixora_close_support_ticket: {
        Args: { p_ticket_id: string }
        Returns: undefined
      }
      fixora_create_business: {
        Args: {
          p_business_type?: string
          p_currency_code?: string
          p_name: string
          p_timezone?: string
        }
        Returns: string
      }
      fixora_create_support_ticket: {
        Args: {
          p_body: string
          p_business_id?: string
          p_category: string
          p_subject: string
        }
        Returns: string
      }
      fixora_get_license_access: {
        Args: never
        Returns: {
          activated_at: string
          active_device_count: number
          available_entitlements: string[]
          expires_at: string
          license_id: string
          max_active_devices: number
          product_sku: string
          status: string
        }[]
      }
      fixora_get_my_support_tickets: {
        Args: never
        Returns: {
          category: string
          created_at: string
          message_count: number
          priority: string
          status: string
          subject: string
          ticket_id: string
          updated_at: string
        }[]
      }
      fixora_get_support_messages: {
        Args: { p_ticket_id: string }
        Returns: {
          attachments: Json
          body: string
          created_at: string
          message_id: string
          sender_type: string
        }[]
      }
      fixora_reply_support_ticket: {
        Args: { p_body: string; p_ticket_id: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
