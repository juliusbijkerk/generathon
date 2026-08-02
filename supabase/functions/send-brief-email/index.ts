// POST { profile_slug, brief_date?, web_base_url? } -> { sent: boolean }
//
// Sends the same brief that /today shows, embedded in an email. Skipped
// entirely if there is nothing ranked yet for that date - the anti-noise rule
// applies to delivery too: no brief, no email.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleOptions, json } from "../_shared/cors.ts";
import { renderBriefEmail, type EmailBriefItem } from "./template.ts";

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
  const webBaseUrl: string = body.web_base_url ?? Deno.env.get("WEB_BASE_URL") ?? "http://localhost:5173";
  if (!profileSlug) return json({ error: "profile_slug is required" }, { status: 400 });

  const supabase = getClient();

  const { data: profileRow } = await supabase.from("profiles").select("id, display_name").eq("slug", profileSlug).single();
  if (!profileRow) return json({ error: `Unknown profile "${profileSlug}"` }, { status: 404 });

  const { data: brief } = await supabase
    .from("briefs")
    .select("*")
    .eq("profile_id", profileRow.id)
    .eq("brief_date", briefDate)
    .single();
  if (!brief) return json({ sent: false, reason: "No brief ranked for this date yet - run rank-brief first" });

  // Fetched as three plain queries rather than one nested PostgREST embed -
  // more verbose, but avoids depending on embed-shape quirks across
  // Supabase client versions for a query that only runs once a day.
  const { data: fullItems } = await supabase
    .from("brief_items")
    .select("rank_position, save_id")
    .eq("brief_id", brief.id)
    .order("rank_position");

  const emailItems: EmailBriefItem[] = [];
  for (const bi of fullItems ?? []) {
    const { data: save } = await supabase.from("saves").select("*").eq("id", bi.save_id).single();
    const { data: cls } = await supabase
      .from("save_classifications")
      .select("*")
      .eq("save_id", bi.save_id)
      .single();
    if (!save || !cls) continue;
    emailItems.push({
      rank_position: bi.rank_position,
      intent: cls.intent,
      tags: cls.tags,
      one_line_insight: cls.one_line_insight,
      source_url: save.source_url,
      source_name: save.source_name,
      source_type: save.source_type,
    });
  }

  const html = renderBriefEmail({
    displayName: profileRow.display_name,
    briefDate,
    videoUrl: brief.video_url,
    webUrl: `${webBaseUrl.replace(/\/$/, "")}/today?date=${briefDate}`,
    skippedCount: brief.skipped_count,
    items: emailItems,
  });

  const resendKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM");
  const to = Deno.env.get("RESEND_TO");
  if (!resendKey || !from || !to) {
    return json({ sent: false, reason: "RESEND_API_KEY / RESEND_FROM / RESEND_TO not set", preview_html: html });
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${resendKey}` },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `${profileRow.display_name}'s brief - ${briefDate}`,
      html,
    }),
  });

  if (!res.ok) {
    return json({ sent: false, reason: `Resend ${res.status}: ${await res.text()}` }, { status: 502 });
  }

  await supabase.from("briefs").update({ status: "sent" }).eq("id", brief.id);
  return json({ sent: true });
});
