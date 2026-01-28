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
      kenya_counties: {
        Row: {
          area_km2: number | null
          capital: string | null
          code: string
          created_at: string
          id: string
          name: string
          population: number | null
        }
        Insert: {
          area_km2?: number | null
          capital?: string | null
          code: string
          created_at?: string
          id?: string
          name: string
          population?: number | null
        }
        Update: {
          area_km2?: number | null
          capital?: string | null
          code?: string
          created_at?: string
          id?: string
          name?: string
          population?: number | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          opportunity_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          opportunity_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          opportunity_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          ai_confidence_score: number | null
          asset_type: string
          city: string | null
          county: string
          created_at: string
          description: string | null
          district: string | null
          estimated_value: number
          id: string
          image_url: string | null
          improvement_cost_estimate: number | null
          improvement_recommendations: Json | null
          listed_price: number
          net_profit_potential: number | null
          profit_percentage: number | null
          profit_potential: number | null
          scraped_at: string | null
          seller_contact: string | null
          seller_credibility_score: number | null
          seller_name: string | null
          source_platform: string | null
          source_url: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          ai_confidence_score?: number | null
          asset_type: string
          city?: string | null
          county: string
          created_at?: string
          description?: string | null
          district?: string | null
          estimated_value: number
          id?: string
          image_url?: string | null
          improvement_cost_estimate?: number | null
          improvement_recommendations?: Json | null
          listed_price: number
          net_profit_potential?: number | null
          profit_percentage?: number | null
          profit_potential?: number | null
          scraped_at?: string | null
          seller_contact?: string | null
          seller_credibility_score?: number | null
          seller_name?: string | null
          source_platform?: string | null
          source_url?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          ai_confidence_score?: number | null
          asset_type?: string
          city?: string | null
          county?: string
          created_at?: string
          description?: string | null
          district?: string | null
          estimated_value?: number
          id?: string
          image_url?: string | null
          improvement_cost_estimate?: number | null
          improvement_recommendations?: Json | null
          listed_price?: number
          net_profit_potential?: number | null
          profit_percentage?: number | null
          profit_potential?: number | null
          scraped_at?: string | null
          seller_contact?: string | null
          seller_credibility_score?: number | null
          seller_name?: string | null
          source_platform?: string | null
          source_url?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          alert_frequency: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          notifications_enabled: boolean | null
          preferred_asset_types: string[] | null
          preferred_regions: string[] | null
          role: string
          updated_at: string
          user_id: string
          whatsapp_number: string | null
        }
        Insert: {
          alert_frequency?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          notifications_enabled?: boolean | null
          preferred_asset_types?: string[] | null
          preferred_regions?: string[] | null
          role?: string
          updated_at?: string
          user_id: string
          whatsapp_number?: string | null
        }
        Update: {
          alert_frequency?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          notifications_enabled?: boolean | null
          preferred_asset_types?: string[] | null
          preferred_regions?: string[] | null
          role?: string
          updated_at?: string
          user_id?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      regional_pricing: {
        Row: {
          asset_category: string | null
          asset_type: string
          average_price: number
          city: string | null
          county: string
          created_at: string
          district: string | null
          id: string
          last_updated: string | null
          max_price: number | null
          min_price: number | null
          sample_size: number | null
        }
        Insert: {
          asset_category?: string | null
          asset_type: string
          average_price: number
          city?: string | null
          county: string
          created_at?: string
          district?: string | null
          id?: string
          last_updated?: string | null
          max_price?: number | null
          min_price?: number | null
          sample_size?: number | null
        }
        Update: {
          asset_category?: string | null
          asset_type?: string
          average_price?: number
          city?: string | null
          county?: string
          created_at?: string
          district?: string | null
          id?: string
          last_updated?: string | null
          max_price?: number | null
          min_price?: number | null
          sample_size?: number | null
        }
        Relationships: []
      }
      saved_opportunities: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          opportunity_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          opportunity_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          opportunity_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_opportunities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
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
