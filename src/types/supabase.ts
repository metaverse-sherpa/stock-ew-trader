export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      stock_prices: {
        Row: {
          close: number
          created_at: string
          high: number
          id: string
          low: number
          open: number
          symbol: string
          timeframe: string
          timestamp: string
          updated_at: string
          volume: number
          wave1_start: boolean | null
        }
        Insert: {
          close: number
          created_at?: string
          high: number
          id?: string
          low: number
          open: number
          symbol: string
          timeframe: string
          timestamp: string
          updated_at?: string
          volume: number
          wave1_start?: boolean | null
        }
        Update: {
          close?: number
          created_at?: string
          high?: number
          id?: string
          low?: number
          open?: number
          symbol?: string
          timeframe?: string
          timestamp?: string
          updated_at?: string
          volume?: number
          wave1_start?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_prices_symbol_fkey"
            columns: ["symbol"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["symbol"]
          },
        ]
      }
      stocks: {
        Row: {
          created_at: string | null
          exchange: string | null
          industry: string | null
          market_cap: number | null
          name: string | null
          price: number | null
          sector: string | null
          symbol: string
          updated_at: string | null
          volume: number | null
        }
        Insert: {
          created_at?: string | null
          exchange?: string | null
          industry?: string | null
          market_cap?: number | null
          name?: string | null
          price?: number | null
          sector?: string | null
          symbol: string
          updated_at?: string | null
          volume?: number | null
        }
        Update: {
          created_at?: string | null
          exchange?: string | null
          industry?: string | null
          market_cap?: number | null
          name?: string | null
          price?: number | null
          sector?: string | null
          symbol?: string
          updated_at?: string | null
          volume?: number | null
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          created_at: string | null
          id: string
          name: string | null
          notifications_enabled: boolean | null
          symbol: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name?: string | null
          notifications_enabled?: boolean | null
          symbol: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string | null
          notifications_enabled?: boolean | null
          symbol?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string | null
          default_timeframe: string
          email: string | null
          email_subscribed: boolean | null
          id: string
          updated_at: string | null
          user_id: string | null
          wave_alerts_enabled: boolean | null
        }
        Insert: {
          created_at?: string | null
          default_timeframe?: string
          email?: string | null
          email_subscribed?: boolean | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
          wave_alerts_enabled?: boolean | null
        }
        Update: {
          created_at?: string | null
          default_timeframe?: string
          email?: string | null
          email_subscribed?: boolean | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
          wave_alerts_enabled?: boolean | null
        }
        Relationships: []
      }
      wave_patterns: {
        Row: {
          confidence: number
          created_at: string | null
          current_price: number
          exchange: string | null
          id: string
          start_time: string
          status: string
          symbol: string
          target_price1: number
          target_price2: number
          target_price3: number
          timeframe: string
          updated_at: string | null
          wave_a_end: number | null
          wave_a_end_time: string | null
          wave_a_start: number | null
          wave_b_end: number | null
          wave_b_end_time: string | null
          wave_b_start: number | null
          wave_c_end: number | null
          wave_c_end_time: string | null
          wave_c_start: number | null
          wave1_end: number | null
          wave1_end_time: string | null
          wave1_start: number
          wave1_start_time: string | null
          wave2_end: number | null
          wave2_end_time: string | null
          wave2_start: number | null
          wave3_end: number | null
          wave3_end_time: string | null
          wave3_start: number | null
          wave4_end: number | null
          wave4_end_time: string | null
          wave4_start: number | null
          wave5_end: number | null
          wave5_end_time: string | null
          wave5_start: number | null
        }
        Insert: {
          confidence: number
          created_at?: string | null
          current_price: number
          exchange?: string | null
          id: string
          start_time: string
          status: string
          symbol: string
          target_price1: number
          target_price2: number
          target_price3: number
          timeframe: string
          updated_at?: string | null
          wave_a_end?: number | null
          wave_a_end_time?: string | null
          wave_a_start?: number | null
          wave_b_end?: number | null
          wave_b_end_time?: string | null
          wave_b_start?: number | null
          wave_c_end?: number | null
          wave_c_end_time?: string | null
          wave_c_start?: number | null
          wave1_end?: number | null
          wave1_end_time?: string | null
          wave1_start: number
          wave1_start_time?: string | null
          wave2_end?: number | null
          wave2_end_time?: string | null
          wave2_start?: number | null
          wave3_end?: number | null
          wave3_end_time?: string | null
          wave3_start?: number | null
          wave4_end?: number | null
          wave4_end_time?: string | null
          wave4_start?: number | null
          wave5_end?: number | null
          wave5_end_time?: string | null
          wave5_start?: number | null
        }
        Update: {
          confidence?: number
          created_at?: string | null
          current_price?: number
          exchange?: string | null
          id?: string
          start_time?: string
          status?: string
          symbol?: string
          target_price1?: number
          target_price2?: number
          target_price3?: number
          timeframe?: string
          updated_at?: string | null
          wave_a_end?: number | null
          wave_a_end_time?: string | null
          wave_a_start?: number | null
          wave_b_end?: number | null
          wave_b_end_time?: string | null
          wave_b_start?: number | null
          wave_c_end?: number | null
          wave_c_end_time?: string | null
          wave_c_start?: number | null
          wave1_end?: number | null
          wave1_end_time?: string | null
          wave1_start?: number
          wave1_start_time?: string | null
          wave2_end?: number | null
          wave2_end_time?: string | null
          wave2_start?: number | null
          wave3_end?: number | null
          wave3_end_time?: string | null
          wave3_start?: number | null
          wave4_end?: number | null
          wave4_end_time?: string | null
          wave4_start?: number | null
          wave5_end?: number | null
          wave5_end_time?: string | null
          wave5_start?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "wave_patterns_symbol_fkey"
            columns: ["symbol"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["symbol"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_new_wave5_patterns: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_stocks_with_wave_patterns: {
        Args: {
          timeframe: string
          status: string
        }
        Returns: {
          symbol: string
          name: string
        }[]
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
