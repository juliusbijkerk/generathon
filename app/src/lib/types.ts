export type Intent = "TOOL" | "BUILD" | "MARKET" | "ANCHOR" | "DISCOVER" | "NOISE";

export interface BriefItemView {
  rank_position: number;
  intent: Intent;
  tags: string[];
  source_type: string;
  source_name: string | null;
  source_url: string | null;
  one_line_insight: string;
}

export interface BriefView {
  date: string;
  display_name: string;
  video_url: string | null;
  skipped_count: number;
  items: BriefItemView[];
}

export interface TopicWeight {
  name: string;
  weight: number;
}

export interface ActiveProject {
  name: string;
  keywords: string[];
  reason: string;
}

export interface ProfileView {
  slug: string;
  display_name: string;
  topics: TopicWeight[];
  active_projects: ActiveProject[];
  consumption: {
    daily_item_cap: number;
    video_item_cap: number;
    discovery_slots: number;
  };
}
