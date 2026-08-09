/**
 * Typed Supabase schema mirror — keep in sync with `supabase/schema.sql` and
 * `supabase/schema_pgvector.sql` (AGENTS.md section 7 / section 20).
 * Shape follows what `supabase gen types typescript` emits so
 * `createServiceClient().from("products")` is fully typed.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      sources: {
        Row: {
          id: string;
          name: string;
          listing_url: string;
          parser_strategy: string | null;
          logo_url: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          listing_url: string;
          parser_strategy?: string | null;
          logo_url?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          listing_url?: string;
          parser_strategy?: string | null;
          logo_url?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          source_id: string;
          original_url: string;
          canonical_url: string;
          title: string;
          image_url: string;
          price: number | null;
          category: string | null;
          first_seen_at: string;
          last_scraped_at: string;
          analyzed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          source_id: string;
          original_url: string;
          canonical_url: string;
          title: string;
          image_url: string;
          price?: number | null;
          category?: string | null;
          first_seen_at?: string;
          last_scraped_at?: string;
          analyzed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          source_id?: string;
          original_url?: string;
          canonical_url?: string;
          title?: string;
          image_url?: string;
          price?: number | null;
          category?: string | null;
          first_seen_at?: string;
          last_scraped_at?: string;
          analyzed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
        ];
      };
      reviews: {
        Row: {
          id: string;
          product_id: string;
          review_identifier: string | null;
          rating: number;
          raw_text: string;
          review_date: string | null;
          verified_purchase: boolean;
          scraped_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          review_identifier?: string | null;
          rating: number;
          raw_text: string;
          review_date?: string | null;
          verified_purchase?: boolean;
          scraped_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          review_identifier?: string | null;
          rating?: number;
          raw_text?: string;
          review_date?: string | null;
          verified_purchase?: boolean;
          scraped_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_trust_analyses: {
        Row: {
          id: string;
          product_id: string;
          trust_score: number;
          trust_label: string;
          positive_pct: number;
          neutral_pct: number;
          negative_pct: number;
          fake_review_pct: number;
          authenticity_confidence: number;
          red_flags: Json;
          neutral_summary: string;
          disclaimer: string | null;
          model_name: string | null;
          created_at: string;
          /** vector(768); serialized as a string like "[0.1,0.2,…]" by PostgREST. */
          embedding: string | null;
        };
        Insert: {
          id?: string;
          product_id: string;
          trust_score: number;
          trust_label: string;
          positive_pct: number;
          neutral_pct: number;
          negative_pct: number;
          fake_review_pct: number;
          authenticity_confidence: number;
          red_flags?: Json;
          neutral_summary: string;
          disclaimer?: string | null;
          model_name?: string | null;
          created_at?: string;
          embedding?: string | null;
        };
        Update: {
          id?: string;
          product_id?: string;
          trust_score?: number;
          trust_label?: string;
          positive_pct?: number;
          neutral_pct?: number;
          negative_pct?: number;
          fake_review_pct?: number;
          authenticity_confidence?: number;
          red_flags?: Json;
          neutral_summary?: string;
          disclaimer?: string | null;
          model_name?: string | null;
          created_at?: string;
          embedding?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_trust_analyses_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: true;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      logs: {
        Row: {
          id: number;
          level: string;
          source: string;
          message: string;
          context: Json | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          level: string;
          source: string;
          message: string;
          context?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          level?: string;
          source?: string;
          message?: string;
          context?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      oxylabs_schedules: {
        Row: {
          id: string;
          source_id: string;
          /** Exact 64-bit Oxylabs schedule id as text (AGENTS.md section 18). */
          oxylabs_schedule_id: string;
          schedule_name: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          source_id: string;
          oxylabs_schedule_id: string;
          schedule_name?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          source_id?: string;
          oxylabs_schedule_id?: string;
          schedule_name?: string | null;
          status?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "oxylabs_schedules_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
        ];
      };
      oxylabs_schedule_runs: {
        Row: {
          id: string;
          schedule_id: string;
          oxylabs_run_id: string | null;
          job_id: string | null;
          status: string | null;
          result_status: string | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          schedule_id: string;
          oxylabs_run_id?: string | null;
          job_id?: string | null;
          status?: string | null;
          result_status?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          schedule_id?: string;
          oxylabs_run_id?: string | null;
          job_id?: string | null;
          status?: string | null;
          result_status?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "oxylabs_schedule_runs_schedule_id_fkey";
            columns: ["schedule_id"];
            isOneToOne: false;
            referencedRelation: "oxylabs_schedules";
            referencedColumns: ["id"];
          },
        ];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          plan: string;
          status: string;
          trial_ends_at: string | null;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan?: string;
          status?: string;
          trial_ends_at?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan?: string;
          status?: string;
          trial_ends_at?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      match_similar_products: {
        Args: {
          query_embedding: string;
          match_category: string | null;
          match_threshold?: number;
          match_count?: number;
          exclude_product_id?: string;
        };
        Returns: Array<{
          id: string;
          title: string;
          image_url: string;
          price: number | null;
          category: string | null;
          original_url: string;
          source_id: string;
          trust_score: number;
          trust_label: string;
          similarity: number;
        }>;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
