export type Intent = "TOOL" | "BUILD" | "MARKET" | "ANCHOR" | "DISCOVER";

export interface BriefItem {
  rank_position: number;
  intent: Intent;
  tags: string[];
  source_type: string;
  source_name: string;
  source_url: string;
  one_line_insight: string;
  /** Marks a placeholder that must be swapped for a real pasted newsletter issue before the real demo (see Phase 8 of the plan). */
  fixture?: boolean;
}

export interface Brief {
  date: string;
  display_name: string;
  skipped_count: number;
  items: BriefItem[];
}

export interface ScriptLine {
  rank_position: number;
  intent: Intent;
  text: string;
}

export interface Script {
  opener: string;
  lines: ScriptLine[];
  closer: string;
}
