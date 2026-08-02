// Shared types for all edge functions. Kept dependency-free (no zod) so every
// function stays a small, fast Deno bundle.

export type SourceType = "instagram" | "linkedin" | "newsletter" | "telegram_forward" | "manual_paste";

export type Intent = "TOOL" | "BUILD" | "MARKET" | "ANCHOR" | "DISCOVER" | "NOISE";

export interface TopicWeight {
  name: string;
  weight: number;
}

export interface SourceWeight {
  type: SourceType;
  weight: number;
  known_feeds?: string[];
}

export interface NoiseRule {
  pattern: string;
  action: "suppress" | "keep_as_anchor";
}

export interface ActiveProject {
  name: string;
  keywords: string[];
  reason: string;
}

export interface ConsumptionConfig {
  daily_item_cap: number;
  video_item_cap: number;
  discovery_slots: number;
  min_score_threshold: number;
  tone: string;
  video_style: string;
  video_aspect?: "vertical" | "horizontal";
}

export interface ContentProfile {
  slug: string;
  display_name: string;
  locale: string[];
  topics: TopicWeight[];
  intent_priority: Record<Intent, number>;
  sources: SourceWeight[];
  noise_rules: NoiseRule[];
  active_projects: ActiveProject[];
  consumption: ConsumptionConfig;
  delivery: {
    channels: string[];
    email_send_time_local: string;
  };
}

export interface Save {
  id: string;
  profile_id: string;
  source_type: SourceType;
  source_url: string | null;
  source_name: string | null;
  raw_text: string | null;
  fetched_title: string | null;
  fetched_description: string | null;
  fetch_status: "pending" | "ok" | "blocked" | "failed" | "skipped";
  captured_at: string;
}

export interface Classification {
  id: string;
  save_id: string;
  intent: Intent;
  tags: string[];
  one_line_insight: string;
  score: number;
  matched_active_project: string | null;
  is_noise: boolean;
  model_used: string | null;
  classified_at: string;
}

// The exact JSON shape the classifier LLM call must return. Kept small and
// flat on purpose: every field is directly usable by the ranking engine and
// the video script generator without another transform step.
export interface ClassifierResult {
  intent: Intent;
  tags: string[];
  one_line_insight: string;
  matched_active_project: string | null;
  is_noise: boolean;
}

export interface IngestInput {
  profile_slug: string;
  source_type: SourceType;
  source_url?: string;
  source_name?: string;
  raw_text?: string;
}
