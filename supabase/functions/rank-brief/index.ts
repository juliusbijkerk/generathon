// POST { profile_slug, brief_date? (YYYY-MM-DD, defaults to today) }
// -> { brief, items }
//
// Pure scoring + selection over already-classified saves. No LLM call here on
// purpose: ranking must be instant and deterministic, unlike classification
// or script generation which can be slow and are always pre-baked before the
// pitch. Re-running this for the same date is idempotent - it replaces the
// brief_items for that day rather than duplicating them.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleOptions, json } from "../_shared/cors.ts";
import { selectBriefItems, type RankableItem } from "../_shared/profile.ts";
import type { ContentProfile } from "../_shared/types.ts";

function getClient() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key);
}

Deno.serve(async (req: Request) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return json({ error: "POST only" }, { status: 405 });

  const body = await req.json().catch(() => ({}));
  const profileSlug = body.profile_slug;
  const briefDate: string = body.brief_date ?? new Date().toISOString().slice(0, 10);
  if (!profileSlug) return json({ error: "profile_slug is required" }, { status: 400 });

  const supabase = getClient();

  const { data: profileRow, error: profileErr } = await supabase
    .from("profiles")
    .select("id, profile_json")
    .eq("slug", profileSlug)
    .single();
  if (profileErr || !profileRow) return json({ error: `Unknown profile "${profileSlug}"` }, { status: 404 });

  const profile = profileRow.profile_json as ContentProfile;

  // All saves for this profile with a classification, joined in one query.
  const { data: rows, error: rowsErr } = await supabase
    .from("saves")
    .select("*, save_classifications(*)")
    .eq("profile_id", profileRow.id);
  if (rowsErr) return json({ error: rowsErr.message }, { status: 500 });

  const rankable: RankableItem[] = (rows ?? [])
    .filter((r: any) => r.save_classifications)
    .map((r: any) => {
      const c = r.save_classifications;
      return {
        save: r,
        intent: c.intent,
        tags: c.tags,
        one_line_insight: c.one_line_insight,
        score: Number(c.score),
        is_noise: c.is_noise,
        matched_active_project: c.matched_active_project,
      };
    });

  const selection = selectBriefItems(profile, rankable);

  const { data: brief, error: briefErr } = await supabase
    .from("briefs")
    .upsert(
      {
        profile_id: profileRow.id,
        brief_date: briefDate,
        status: "ranked",
        skipped_count: selection.skippedNoiseCount,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "profile_id,brief_date" },
    )
    .select()
    .single();
  if (briefErr || !brief) return json({ error: briefErr?.message ?? "brief upsert failed" }, { status: 500 });

  // Replace this brief's items so re-ranking (e.g. after a fresh live capture) is idempotent.
  await supabase.from("brief_items").delete().eq("brief_id", brief.id);

  const videoCap = profile.consumption.video_item_cap;
  const itemsToInsert = selection.selected.map((item, idx) => ({
    brief_id: brief.id,
    save_id: item.save.id,
    rank_position: idx + 1,
    in_video: idx < videoCap,
  }));

  if (itemsToInsert.length > 0) {
    const { error: itemsErr } = await supabase.from("brief_items").insert(itemsToInsert);
    if (itemsErr) return json({ error: itemsErr.message }, { status: 500 });
  }

  return json({
    brief,
    items: selection.selected,
    skipped_noise_count: selection.skippedNoiseCount,
    overflow_count: selection.overflowCount,
  });
});
