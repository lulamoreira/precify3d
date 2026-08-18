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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      materials: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          price_per_kg: number
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          price_per_kg: number
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          price_per_kg?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address_complement: string | null
          address_number: string | null
          cep: string | null
          city: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          address_complement?: string | null
          address_number?: string | null
          cep?: string | null
          city?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          address_complement?: string | null
          address_number?: string | null
          cep?: string | null
          city?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          client: string | null
          cost_energy: number
          cost_labor: number
          cost_machine: number
          cost_material: number
          cost_post: number | null
          cost_setup: number | null
          cost_support: number | null
          created_at: string
          dim_x: number | null
          dim_y: number | null
          dim_z: number | null
          discount_pct: number
          discount_value: number
          engine_version: string | null
          failure_pct: number
          final_price: number
          id: string
          infill_pct: number | null
          margin_pct: number
          margin_value: number
          material_name: string
          notes: string | null
          packaging: number
          platform_fee: number
          platform_fee_value: number
          platform_name: string | null
          profit: number
          project: string | null
          quantity: number | null
          source: string | null
          stl_area_cm2: number | null
          stl_volume_cm3: number | null
          subtotal: number
          tax_pct: number | null
          tax_value: number | null
          time_hours: number
          user_id: string
          weight_g: number
        }
        Insert: {
          client?: string | null
          cost_energy: number
          cost_labor: number
          cost_machine: number
          cost_material: number
          cost_post?: number | null
          cost_setup?: number | null
          cost_support?: number | null
          created_at?: string
          dim_x?: number | null
          dim_y?: number | null
          dim_z?: number | null
          discount_pct: number
          discount_value: number
          engine_version?: string | null
          failure_pct: number
          final_price: number
          id?: string
          infill_pct?: number | null
          margin_pct: number
          margin_value: number
          material_name: string
          notes?: string | null
          packaging: number
          platform_fee: number
          platform_fee_value: number
          platform_name?: string | null
          profit: number
          project?: string | null
          quantity?: number | null
          source?: string | null
          stl_area_cm2?: number | null
          stl_volume_cm3?: number | null
          subtotal: number
          tax_pct?: number | null
          tax_value?: number | null
          time_hours: number
          user_id: string
          weight_g: number
        }
        Update: {
          client?: string | null
          cost_energy?: number
          cost_labor?: number
          cost_machine?: number
          cost_material?: number
          cost_post?: number | null
          cost_setup?: number | null
          cost_support?: number | null
          created_at?: string
          dim_x?: number | null
          dim_y?: number | null
          dim_z?: number | null
          discount_pct?: number
          discount_value?: number
          engine_version?: string | null
          failure_pct?: number
          final_price?: number
          id?: string
          infill_pct?: number | null
          margin_pct?: number
          margin_value?: number
          material_name?: string
          notes?: string | null
          packaging?: number
          platform_fee?: number
          platform_fee_value?: number
          platform_name?: string | null
          profit?: number
          project?: string | null
          quantity?: number | null
          source?: string | null
          stl_area_cm2?: number | null
          stl_volume_cm3?: number | null
          subtotal?: number
          tax_pct?: number | null
          tax_value?: number | null
          time_hours?: number
          user_id?: string
          weight_g?: number
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          engine_version: string | null
          failure: number
          id: string
          kwh: number
          labor: number
          layer_height: number | null
          machine: number
          margin: number
          nozzle_width: number | null
          packaging: number
          platform_fee: number
          post_processing_price_hour: number | null
          setup_minutes: number | null
          tax_pct: number | null
          time_calibration: number | null
          updated_at: string
          user_id: string
          volumetric_rate: number | null
          walls: number | null
          watt: number
        }
        Insert: {
          created_at?: string
          engine_version?: string | null
          failure?: number
          id?: string
          kwh?: number
          labor?: number
          layer_height?: number | null
          machine?: number
          margin?: number
          nozzle_width?: number | null
          packaging?: number
          platform_fee?: number
          post_processing_price_hour?: number | null
          setup_minutes?: number | null
          tax_pct?: number | null
          time_calibration?: number | null
          updated_at?: string
          user_id: string
          volumetric_rate?: number | null
          walls?: number | null
          watt?: number
        }
        Update: {
          created_at?: string
          engine_version?: string | null
          failure?: number
          id?: string
          kwh?: number
          labor?: number
          layer_height?: number | null
          machine?: number
          margin?: number
          nozzle_width?: number | null
          packaging?: number
          platform_fee?: number
          post_processing_price_hour?: number | null
          setup_minutes?: number | null
          tax_pct?: number | null
          time_calibration?: number | null
          updated_at?: string
          user_id?: string
          volumetric_rate?: number | null
          walls?: number | null
          watt?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: { _user_id: string }; Returns: boolean }
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
    Enums: {},
  },
} as const
