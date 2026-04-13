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
      campaign_performance: {
        Row: {
          acr: number | null
          advertiser_code: string
          advertiser_name: string | null
          booked_impressions: number | null
          campaign_day: string
          created_at: string
          creative_duration: number | null
          creative_name: string | null
          day_of_week: string | null
          daypart: string | null
          device_type: string | null
          digital_channel: string | null
          dma: string | null
          flight_end: string | null
          flight_start: string | null
          frequency: number | null
          genre: string | null
          goal: string | null
          hour_of_day: number | null
          id: string
          impressions: number | null
          line_item_name: string | null
          publisher: string | null
          reach: number | null
          upload_batch_id: string | null
          vcr: number | null
          zip: string | null
        }
        Insert: {
          acr?: number | null
          advertiser_code: string
          advertiser_name?: string | null
          booked_impressions?: number | null
          campaign_day: string
          created_at?: string
          creative_duration?: number | null
          creative_name?: string | null
          day_of_week?: string | null
          daypart?: string | null
          device_type?: string | null
          digital_channel?: string | null
          dma?: string | null
          flight_end?: string | null
          flight_start?: string | null
          frequency?: number | null
          genre?: string | null
          goal?: string | null
          hour_of_day?: number | null
          id?: string
          impressions?: number | null
          line_item_name?: string | null
          publisher?: string | null
          reach?: number | null
          upload_batch_id?: string | null
          vcr?: number | null
          zip?: string | null
        }
        Update: {
          acr?: number | null
          advertiser_code?: string
          advertiser_name?: string | null
          booked_impressions?: number | null
          campaign_day?: string
          created_at?: string
          creative_duration?: number | null
          creative_name?: string | null
          day_of_week?: string | null
          daypart?: string | null
          device_type?: string | null
          digital_channel?: string | null
          dma?: string | null
          flight_end?: string | null
          flight_start?: string | null
          frequency?: number | null
          genre?: string | null
          goal?: string | null
          hour_of_day?: number | null
          id?: string
          impressions?: number | null
          line_item_name?: string | null
          publisher?: string | null
          reach?: number | null
          upload_batch_id?: string | null
          vcr?: number | null
          zip?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      mv_report_by_advertiser: {
        Row: {
          advertiser_code: string | null
          advertiser_name: string | null
          channel_count: number | null
          dma_count: number | null
          goal: string | null
          impressions: number | null
          max_day: string | null
          min_day: string | null
          reach: number | null
          row_count: number | null
        }
        Relationships: []
      }
      mv_report_by_channel: {
        Row: {
          advertiser_code: string | null
          channel: string | null
          goal: string | null
          impressions: number | null
          max_day: string | null
          min_day: string | null
          reach: number | null
          row_count: number | null
        }
        Relationships: []
      }
      mv_report_by_dma: {
        Row: {
          advertiser_code: string | null
          dma: string | null
          goal: string | null
          impressions: number | null
          max_day: string | null
          min_day: string | null
          reach: number | null
          row_count: number | null
        }
        Relationships: []
      }
      mv_report_filters: {
        Row: {
          code: string | null
          filter_type: string | null
          name: string | null
        }
        Relationships: []
      }
      mv_report_summary: {
        Row: {
          advertiser_code: string | null
          avg_frequency: number | null
          avg_vcr: number | null
          digital_channel: string | null
          goal: string | null
          max_day: string | null
          min_day: string | null
          total_impressions: number | null
          total_reach: number | null
          total_rows: number | null
          unique_dmas: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      refresh_report_views: { Args: never; Returns: undefined }
      report_advertisers_list: {
        Args: never
        Returns: {
          code: string
          name: string
        }[]
      }
      report_by_advertiser: {
        Args: {
          p_advertiser?: string
          p_channel?: string
          p_date_from?: string
          p_date_to?: string
          p_goal?: string
        }
        Returns: {
          advertiser_code: string
          advertiser_name: string
          channel_count: number
          dma_count: number
          impressions: number
          reach: number
          row_count: number
        }[]
      }
      report_by_channel: {
        Args: {
          p_advertiser?: string
          p_channel?: string
          p_date_from?: string
          p_date_to?: string
          p_goal?: string
        }
        Returns: {
          channel: string
          impressions: number
          reach: number
          row_count: number
        }[]
      }
      report_by_dma: {
        Args: {
          p_advertiser?: string
          p_channel?: string
          p_date_from?: string
          p_date_to?: string
          p_goal?: string
        }
        Returns: {
          dma: string
          impressions: number
          reach: number
          row_count: number
        }[]
      }
      report_channels_list: {
        Args: never
        Returns: {
          channel: string
        }[]
      }
      report_goals_list: {
        Args: never
        Returns: {
          goal: string
        }[]
      }
      report_summary: {
        Args: {
          p_advertiser?: string
          p_channel?: string
          p_date_from?: string
          p_date_to?: string
          p_goal?: string
        }
        Returns: {
          avg_frequency: number
          avg_vcr: number
          total_impressions: number
          total_reach: number
          total_rows: number
          unique_advertisers: number
          unique_channels: number
          unique_dmas: number
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
