// Thin wrappers around the edge functions and direct table reads. Every
// function here degrades to demo fixture data when isDemoMode is true, so the
// page always renders something real, live keys or not.

import { functionsBaseUrl, isDemoMode, supabase } from "./supabaseClient";
import { DEMO_BRIEF, DEMO_PROFILE } from "./demoData";
import type { BriefView, ProfileView } from "./types";

const PROFILE_SLUG = "julius";

export interface CaptureInput {
  source_type: "instagram" | "linkedin" | "newsletter" | "telegram_forward" | "manual_paste";
  source_url?: string;
  raw_text?: string;
}

export interface CaptureResult {
  intent: string;
  tags: string[];
  one_line_insight: string;
  is_noise: boolean;
}

/** The guaranteed-to-work live-capture path used in the demo: paste a URL or
 * text, get back the classification immediately. */
export async function captureItem(input: CaptureInput): Promise<CaptureResult> {
  if (isDemoMode) {
    // Demo mode has no backend to classify against; return a clearly-labeled
    // stand-in so the UI flow is still demonstrable offline.
    await new Promise((r) => setTimeout(r, 500));
    return {
      intent: "DISCOVER",
      tags: ["demo-mode"],
      one_line_insight: "Demo mode: connect Supabase (see docs/SETUP.md) to classify this for real.",
      is_noise: false,
    };
  }

  const res = await fetch(`${functionsBaseUrl}/ingest-classify`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    },
    body: JSON.stringify({ profile_slug: PROFILE_SLUG, ...input }),
  });
  if (!res.ok) throw new Error(`Capture failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.classification as CaptureResult;
}

export async function rerankToday(): Promise<void> {
  if (isDemoMode) return;
  await fetch(`${functionsBaseUrl}/rank-brief`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    },
    body: JSON.stringify({ profile_slug: PROFILE_SLUG }),
  });
}

export async function fetchTodayBrief(date?: string): Promise<BriefView> {
  if (isDemoMode || !supabase) return DEMO_BRIEF;

  const briefDate = date ?? new Date().toISOString().slice(0, 10);

  const { data: profile } = await supabase.from("profiles").select("id, display_name").eq("slug", PROFILE_SLUG).single();
  if (!profile) return DEMO_BRIEF;

  const { data: brief } = await supabase
    .from("briefs")
    .select("*")
    .eq("profile_id", profile.id)
    .eq("brief_date", briefDate)
    .maybeSingle();

  if (!brief) {
    return { ...DEMO_BRIEF, date: briefDate, display_name: profile.display_name, items: [] };
  }

  const { data: items } = await supabase
    .from("brief_items")
    .select("rank_position, save_id")
    .eq("brief_id", brief.id)
    .order("rank_position");

  const rows = await Promise.all(
    (items ?? []).map(async (bi) => {
      const { data: save } = await supabase!.from("saves").select("*").eq("id", bi.save_id).single();
      const { data: cls } = await supabase!
        .from("save_classifications")
        .select("*")
        .eq("save_id", bi.save_id)
        .single();
      return { bi, save, cls };
    }),
  );

  return {
    date: briefDate,
    display_name: profile.display_name,
    video_url: brief.video_url,
    skipped_count: brief.skipped_count,
    items: rows
      .filter((r) => r.save && r.cls)
      .map((r) => ({
        rank_position: r.bi.rank_position,
        intent: r.cls!.intent,
        tags: r.cls!.tags,
        source_type: r.save!.source_type,
        source_name: r.save!.source_name,
        source_url: r.save!.source_url,
        one_line_insight: r.cls!.one_line_insight,
      })),
  };
}

export async function fetchProfile(): Promise<ProfileView> {
  if (isDemoMode || !supabase) return DEMO_PROFILE;
  const { data } = await supabase.from("profiles").select("slug, display_name, profile_json").eq("slug", PROFILE_SLUG).single();
  if (!data?.profile_json?.topics) return DEMO_PROFILE;
  const p = data.profile_json;
  return {
    slug: data.slug,
    display_name: data.display_name,
    topics: p.topics,
    active_projects: p.active_projects,
    consumption: p.consumption,
  };
}

/** Subscribes to new/updated saves for this profile so /today updates live
 * the instant a Telegram capture (or another tab's paste) gets classified. */
export function subscribeToSaves(onChange: () => void): () => void {
  if (isDemoMode || !supabase) return () => {};
  const channel = supabase
    .channel("saves-live")
    .on("postgres_changes", { event: "*", schema: "public", table: "save_classifications" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "briefs" }, onChange)
    .subscribe();
  return () => {
    supabase!.removeChannel(channel);
  };
}
