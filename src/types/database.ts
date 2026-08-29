/**
 * Database types — hand-authored to match supabase/migrations/0001_init.sql.
 * When the Supabase CLI is wired up this can be replaced by
 * `supabase gen types typescript`. Kept in sync manually until then.
 */

export type ContentStatus = "draft" | "published";
export type Role = "student" | "admin";
export type Difficulty = "easy" | "medium" | "hard";
export type GsPaper = "GS-I" | "GS-II" | "GS-III" | "GS-IV" | "Essay";

type Timestamps = {
  created_at: string;
  updated_at: string;
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; role: Role; full_name: string | null } & Timestamps;
        Insert: {
          id: string;
          role?: Role;
          full_name?: string | null;
        };
        Update: Partial<{ role: Role; full_name: string | null }>;
        Relationships: [];
      };
      classes: {
        Row: { id: string; number: number; label: string; created_at: string };
        Insert: { id?: string; number: number; label: string };
        Update: Partial<{ number: number; label: string }>;
        Relationships: [];
      };
      subjects: {
        Row: {
          id: string;
          slug: string;
          name: string;
          ncert_name: string | null;
          code_prefix: string;
          order: number;
          enabled: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          ncert_name?: string | null;
          code_prefix: string;
          order?: number;
          enabled?: boolean;
        };
        Update: Partial<{
          slug: string;
          name: string;
          ncert_name: string | null;
          code_prefix: string;
          order: number;
          enabled: boolean;
        }>;
        Relationships: [];
      };
      books: {
        Row: {
          id: string;
          title: string;
          class_id: string;
          subject_id: string;
          order: number;
        } & Timestamps;
        Insert: {
          id?: string;
          title: string;
          class_id: string;
          subject_id: string;
          order?: number;
        };
        Update: Partial<{
          title: string;
          class_id: string;
          subject_id: string;
          order: number;
        }>;
        Relationships: [];
      };
      chapters: {
        Row: {
          id: string;
          book_id: string;
          chapter_code: string;
          chapter_number: number;
          title: string;
          official_pdf_url: string | null;
          order: number;
          status: ContentStatus;
        } & Timestamps;
        Insert: {
          id?: string;
          book_id: string;
          chapter_code: string;
          chapter_number: number;
          title: string;
          official_pdf_url?: string | null;
          order?: number;
          status?: ContentStatus;
        };
        Update: Partial<{
          book_id: string;
          chapter_code: string;
          chapter_number: number;
          title: string;
          official_pdf_url: string | null;
          order: number;
          status: ContentStatus;
        }>;
        Relationships: [];
      };
      gs_tags: {
        Row: {
          id: string;
          code: string;
          label: string;
          note: string | null;
          order: number;
        };
        Insert: {
          id?: string;
          code: string;
          label: string;
          note?: string | null;
          order?: number;
        };
        Update: Partial<{
          code: string;
          label: string;
          note: string | null;
          order: number;
        }>;
        Relationships: [];
      };
      chapter_gs_tags: {
        Row: { chapter_id: string; gs_tag_id: string };
        Insert: { chapter_id: string; gs_tag_id: string };
        Update: Partial<{ chapter_id: string; gs_tag_id: string }>;
        Relationships: [];
      };
      gists: {
        Row: {
          id: string;
          chapter_id: string;
          content_json: unknown | null;
          content_html: string | null;
          status: ContentStatus;
          author_id: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          chapter_id: string;
          content_json?: unknown | null;
          content_html?: string | null;
          status?: ContentStatus;
          author_id?: string | null;
        };
        Update: Partial<{
          content_json: unknown | null;
          content_html: string | null;
          status: ContentStatus;
          author_id: string | null;
        }>;
        Relationships: [];
      };
      mcqs: {
        Row: {
          id: string;
          chapter_id: string;
          stem: string;
          options: string[];
          correct_index: number;
          solution: string | null;
          difficulty: Difficulty;
          source_note: string | null;
          status: ContentStatus;
          author_id: string | null;
          order: number;
        } & Timestamps;
        Insert: {
          id?: string;
          chapter_id: string;
          stem: string;
          options: string[];
          correct_index: number;
          solution?: string | null;
          difficulty?: Difficulty;
          source_note?: string | null;
          status?: ContentStatus;
          author_id?: string | null;
          order?: number;
        };
        Update: Partial<{
          stem: string;
          options: string[];
          correct_index: number;
          solution: string | null;
          difficulty: Difficulty;
          source_note: string | null;
          status: ContentStatus;
          author_id: string | null;
          order: number;
        }>;
        Relationships: [];
      };
      mains_questions: {
        Row: {
          id: string;
          chapter_id: string;
          question: string;
          model_answer_json: unknown | null;
          model_answer_html: string | null;
          directive_word: string | null;
          word_limit: number | null;
          gs_paper: GsPaper | null;
          status: ContentStatus;
          author_id: string | null;
          order: number;
        } & Timestamps;
        Insert: {
          id?: string;
          chapter_id: string;
          question: string;
          model_answer_json?: unknown | null;
          model_answer_html?: string | null;
          directive_word?: string | null;
          word_limit?: number | null;
          gs_paper?: GsPaper | null;
          status?: ContentStatus;
          author_id?: string | null;
          order?: number;
        };
        Update: Partial<{
          question: string;
          model_answer_json: unknown | null;
          model_answer_html: string | null;
          directive_word: string | null;
          word_limit: number | null;
          gs_paper: GsPaper | null;
          status: ContentStatus;
          author_id: string | null;
          order: number;
        }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// Convenience row aliases.
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
