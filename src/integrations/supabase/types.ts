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
      clients: {
        Row: {
          address: string | null
          company: string | null
          created_at: string
          document: string | null
          email: string | null
          id: string
          logo_path: string | null
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          company?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          logo_path?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          company?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          logo_path?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
      plan_price_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          plan_id: string | null
          price_month: number
          price_year: number
          stripe_price_month_id: string | null
          stripe_price_year_id: string | null
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          plan_id?: string | null
          price_month: number
          price_year: number
          stripe_price_month_id?: string | null
          stripe_price_year_id?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          plan_id?: string | null
          price_month?: number
          price_year?: number
          stripe_price_month_id?: string | null
          stripe_price_year_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_price_history_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          active: boolean
          code: string
          created_at: string
          daily_quota: number | null
          description: string | null
          features: Json | null
          id: string
          is_free: boolean
          name: string
          price_month: number
          price_year: number
          sort_order: number
          stripe_price_month_id: string | null
          stripe_price_year_id: string | null
          stripe_product_id: string | null
          trial_days: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          daily_quota?: number | null
          description?: string | null
          features?: Json | null
          id?: string
          is_free?: boolean
          name: string
          price_month?: number
          price_year?: number
          sort_order?: number
          stripe_price_month_id?: string | null
          stripe_price_year_id?: string | null
          stripe_product_id?: string | null
          trial_days?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          daily_quota?: number | null
          description?: string | null
          features?: Json | null
          id?: string
          is_free?: boolean
          name?: string
          price_month?: number
          price_year?: number
          sort_order?: number
          stripe_price_month_id?: string | null
          stripe_price_year_id?: string | null
          stripe_product_id?: string | null
          trial_days?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address_complement: string | null
          address_number: string | null
          brand_color: string | null
          cep: string | null
          city: string | null
          company_document: string | null
          company_email: string | null
          company_logo_path: string | null
          company_name: string | null
          company_phone: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          phone: string | null
          quote_counter: number
          role: string
          updated_at: string
        }
        Insert: {
          address_complement?: string | null
          address_number?: string | null
          brand_color?: string | null
          cep?: string | null
          city?: string | null
          company_document?: string | null
          company_email?: string | null
          company_logo_path?: string | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          quote_counter?: number
          role?: string
          updated_at?: string
        }
        Update: {
          address_complement?: string | null
          address_number?: string | null
          brand_color?: string | null
          cep?: string | null
          city?: string | null
          company_document?: string | null
          company_email?: string | null
          company_logo_path?: string | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          quote_counter?: number
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      quote_items: {
        Row: {
          cost_direct: number | null
          created_at: string
          description: string | null
          id: string
          material_name: string | null
          name: string
          partial_plate_hours: number | null
          pieces_per_plate: number | null
          plate_time_hours: number | null
          position: number
          preview_png: string | null
          profit: number | null
          quantity: number
          quote_id: string
          single_time_hours: number | null
          stl_filename: string | null
          stl_hash: string | null
          stl_path: string | null
          stl_size_bytes: number | null
          time_hours: number | null
          time_source: string | null
          total_pieces: number | null
          total_price: number
          total_print_hours: number | null
          unit_price: number
          user_id: string
          weight_g: number | null
          weight_input_mode: string | null
        }
        Insert: {
          cost_direct?: number | null
          created_at?: string
          description?: string | null
          id?: string
          material_name?: string | null
          name: string
          partial_plate_hours?: number | null
          pieces_per_plate?: number | null
          plate_time_hours?: number | null
          position?: number
          preview_png?: string | null
          profit?: number | null
          quantity?: number
          quote_id: string
          single_time_hours?: number | null
          stl_filename?: string | null
          stl_hash?: string | null
          stl_path?: string | null
          stl_size_bytes?: number | null
          time_hours?: number | null
          time_source?: string | null
          total_pieces?: number | null
          total_price: number
          total_print_hours?: number | null
          unit_price: number
          user_id: string
          weight_g?: number | null
          weight_input_mode?: string | null
        }
        Update: {
          cost_direct?: number | null
          created_at?: string
          description?: string | null
          id?: string
          material_name?: string | null
          name?: string
          partial_plate_hours?: number | null
          pieces_per_plate?: number | null
          plate_time_hours?: number | null
          position?: number
          preview_png?: string | null
          profit?: number | null
          quantity?: number
          quote_id?: string
          single_time_hours?: number | null
          stl_filename?: string | null
          stl_hash?: string | null
          stl_path?: string | null
          stl_size_bytes?: number | null
          time_hours?: number | null
          time_source?: string | null
          total_pieces?: number | null
          total_price?: number
          total_print_hours?: number | null
          unit_price?: number
          user_id?: string
          weight_g?: number | null
          weight_input_mode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          client: string | null
          client_id: string | null
          cost_energy: number
          cost_labor: number
          cost_machine: number
          cost_material: number
          cost_post: number | null
          cost_setup: number | null
          cost_support: number | null
          created_at: string
          delivery_days: number | null
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
          kind: string
          lost_reason: string | null
          margin_pct: number
          margin_value: number
          material_name: string
          notes: string | null
          packaging: number
          partial_plate_hours: number | null
          payment_terms: string | null
          pieces_per_plate: number | null
          plate_time_hours: number | null
          platform_fee: number
          platform_fee_value: number
          platform_name: string | null
          profit: number
          project: string | null
          public_expires_at: string | null
          public_notes: string | null
          public_token: string | null
          quantity: number | null
          quote_number: string | null
          shipping_price: number | null
          single_time_hours: number | null
          sold_at: string | null
          sold_price: number | null
          sold_profit: number | null
          source: string | null
          status: string
          status_changed_at: string | null
          stl_area_cm2: number | null
          stl_volume_cm3: number | null
          subtotal: number
          tax_pct: number | null
          tax_value: number | null
          time_hours: number
          time_source: string | null
          title: string | null
          total_pieces: number | null
          total_print_hours: number | null
          user_id: string
          valid_until: string | null
          viewed_at: string | null
          weight_g: number
          weight_input_mode: string | null
        }
        Insert: {
          client?: string | null
          client_id?: string | null
          cost_energy: number
          cost_labor: number
          cost_machine: number
          cost_material: number
          cost_post?: number | null
          cost_setup?: number | null
          cost_support?: number | null
          created_at?: string
          delivery_days?: number | null
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
          kind?: string
          lost_reason?: string | null
          margin_pct: number
          margin_value: number
          material_name: string
          notes?: string | null
          packaging: number
          partial_plate_hours?: number | null
          payment_terms?: string | null
          pieces_per_plate?: number | null
          plate_time_hours?: number | null
          platform_fee: number
          platform_fee_value: number
          platform_name?: string | null
          profit: number
          project?: string | null
          public_expires_at?: string | null
          public_notes?: string | null
          public_token?: string | null
          quantity?: number | null
          quote_number?: string | null
          shipping_price?: number | null
          single_time_hours?: number | null
          sold_at?: string | null
          sold_price?: number | null
          sold_profit?: number | null
          source?: string | null
          status?: string
          status_changed_at?: string | null
          stl_area_cm2?: number | null
          stl_volume_cm3?: number | null
          subtotal: number
          tax_pct?: number | null
          tax_value?: number | null
          time_hours: number
          time_source?: string | null
          title?: string | null
          total_pieces?: number | null
          total_print_hours?: number | null
          user_id: string
          valid_until?: string | null
          viewed_at?: string | null
          weight_g: number
          weight_input_mode?: string | null
        }
        Update: {
          client?: string | null
          client_id?: string | null
          cost_energy?: number
          cost_labor?: number
          cost_machine?: number
          cost_material?: number
          cost_post?: number | null
          cost_setup?: number | null
          cost_support?: number | null
          created_at?: string
          delivery_days?: number | null
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
          kind?: string
          lost_reason?: string | null
          margin_pct?: number
          margin_value?: number
          material_name?: string
          notes?: string | null
          packaging?: number
          partial_plate_hours?: number | null
          payment_terms?: string | null
          pieces_per_plate?: number | null
          plate_time_hours?: number | null
          platform_fee?: number
          platform_fee_value?: number
          platform_name?: string | null
          profit?: number
          project?: string | null
          public_expires_at?: string | null
          public_notes?: string | null
          public_token?: string | null
          quantity?: number | null
          quote_number?: string | null
          shipping_price?: number | null
          single_time_hours?: number | null
          sold_at?: string | null
          sold_price?: number | null
          sold_profit?: number | null
          source?: string | null
          status?: string
          status_changed_at?: string | null
          stl_area_cm2?: number | null
          stl_volume_cm3?: number | null
          subtotal?: number
          tax_pct?: number | null
          tax_value?: number | null
          time_hours?: number
          time_source?: string | null
          title?: string | null
          total_pieces?: number | null
          total_print_hours?: number | null
          user_id?: string
          valid_until?: string | null
          viewed_at?: string | null
          weight_g?: number
          weight_input_mode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_period: string | null
          created_at: string
          current_period_ends_at: string | null
          plan_code: string
          status: string
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_period?: string | null
          created_at?: string
          current_period_ends_at?: string | null
          plan_code: string
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_period?: string | null
          created_at?: string
          current_period_ends_at?: string | null
          plan_code?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_code_fkey"
            columns: ["plan_code"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["code"]
          },
        ]
      }
      usage_events: {
        Row: {
          created_at: string
          fingerprint: string
          id: string
          label: string | null
          period_start: string
          quote_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          fingerprint: string
          id?: string
          label?: string | null
          period_start: string
          quote_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          fingerprint?: string
          id?: string
          label?: string | null
          period_start?: string
          quote_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_events_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          engine_version: string | null
          failure: number
          fixed_time_share: number
          hours_per_day: number
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
          store_files: boolean | null
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
          fixed_time_share?: number
          hours_per_day?: number
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
          store_files?: boolean | null
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
          fixed_time_share?: number
          hours_per_day?: number
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
          store_files?: boolean | null
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
      consume_pricing: {
        Args: { _fingerprint: string; _label?: string }
        Returns: {
          allowed: boolean
          quota: number
          remaining: number
          resets_at: string
          reused: boolean
          unlimited: boolean
          used: number
        }[]
      }
      current_day_start: { Args: never; Returns: string }
      get_public_quote: { Args: { _token: string }; Returns: Json }
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      next_quote_number: { Args: never; Returns: string }
      quota_status: {
        Args: never
        Returns: {
          daily_quota: number
          plan_code: string
          plan_name: string
          remaining: number
          resets_at: string
          status: string
          unlimited: boolean
          used: number
        }[]
      }
    }
    Enums: {
      app_role: "owner" | "admin" | "user"
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
      app_role: ["owner", "admin", "user"],
    },
  },
} as const
