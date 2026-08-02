// CLI entry point.
//   npm run video:dry-run   -> fixture data, no API keys, silence instead of
//                              real voice - proves the whole mechanical
//                              pipeline (script -> tts -> cards -> ffmpeg)
//                              produces a real mp4.
//   npm run video:live      -> real ranked brief pulled from Supabase, real
//                              OpenAI TTS, real script from Claude.
//
// The live path needs SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY plus a profile
// slug and date; wire that fetch in once the Supabase project exists (see
// docs/SETUP.md) - the --dry-run path has zero external dependencies and is
// what this build verified end to end.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { generateScript } from "./generateScript.js";
import { assembleVideo } from "./assemble.js";
import { checkFfmpegAvailable } from "./ffmpegUtil.js";
import type { Brief, BriefItem } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function loadBrief(dryRun: boolean): Promise<Brief> {
  if (dryRun) {
    const raw = await readFile(path.join(__dirname, "fixtures", "sample-brief.json"), "utf-8");
    return JSON.parse(raw) as Brief;
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set - can't load the live brief.");
  }
  const profileSlug = process.env.DEFAULT_PROFILE_SLUG ?? "julius";
  const briefDate =
    process.argv.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a)) ?? new Date().toISOString().slice(0, 10);

  const supabase = createClient(url, key);

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("slug", profileSlug)
    .single();
  if (profileErr || !profile) throw new Error(`Unknown profile "${profileSlug}": ${profileErr?.message}`);

  const { data: brief, error: briefErr } = await supabase
    .from("briefs")
    .select("*")
    .eq("profile_id", profile.id)
    .eq("brief_date", briefDate)
    .single();
  if (briefErr || !brief) {
    throw new Error(
      `No ranked brief for ${profileSlug} on ${briefDate} - call rank-brief first. (${briefErr?.message})`,
    );
  }

  const { data: briefItemRows } = await supabase
    .from("brief_items")
    .select("rank_position, save_id")
    .eq("brief_id", brief.id)
    .order("rank_position");

  const items: BriefItem[] = [];
  for (const row of briefItemRows ?? []) {
    const { data: save } = await supabase.from("saves").select("*").eq("id", row.save_id).single();
    const { data: cls } = await supabase
      .from("save_classifications")
      .select("*")
      .eq("save_id", row.save_id)
      .single();
    if (!save || !cls) continue;
    items.push({
      rank_position: row.rank_position,
      intent: cls.intent,
      tags: cls.tags,
      source_type: save.source_type,
      source_name: save.source_name ?? save.source_type,
      source_url: save.source_url ?? "",
      one_line_insight: cls.one_line_insight,
    });
  }

  return {
    date: briefDate,
    display_name: profile.display_name,
    skipped_count: brief.skipped_count ?? 0,
    items,
  };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run") || (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY);

  if (dryRun && !process.argv.includes("--dry-run")) {
    console.log("No ANTHROPIC_API_KEY/OPENAI_API_KEY found - running in --dry-run mode automatically.");
  }

  const ffmpegOk = await checkFfmpegAvailable();
  if (!ffmpegOk) {
    console.error("ffmpeg is not on PATH. Install it (brew install ffmpeg) and re-run.");
    process.exit(1);
  }

  const outDir = path.join(__dirname, "..", "output");
  await mkdir(outDir, { recursive: true });

  console.log(`Loading brief (dryRun=${dryRun})...`);
  const brief = await loadBrief(dryRun);
  const fixtureItems = brief.items.filter((i) => i.fixture);
  if (fixtureItems.length > 0) {
    console.warn(
      `${fixtureItems.length} item(s) in this brief are placeholders (fixture: true) - ` +
        `replace with real pasted TLDR/Lenny's content before the real pitch (see Phase 8 of the plan).`,
    );
  }

  console.log(`Generating script for ${brief.items.length} items...`);
  const script = await generateScript(brief, { dryRun });
  await writeFile(path.join(outDir, `script-${brief.date}.json`), JSON.stringify(script, null, 2));

  console.log("Assembling video (this runs ffmpeg per item, it takes a minute)...");
  const result = await assembleVideo(brief, script, { dryRun, outDir });

  console.log("");
  console.log("Done.");
  console.log(`  Output:        ${result.finalPath}`);
  console.log(`  Duration:      ${result.totalDurationSeconds.toFixed(1)}s`);
  console.log(`  Motion items:  ${result.itemsWithMotion} (zoompan + staged word-reveal, no drawtext/libass needed)`);
  console.log(`  Real voice:    ${result.synthesizedRealVoice ? "yes (OpenAI TTS, two voices)" : "no (silence placeholder - dry run)"}`);
  if (dryRun) {
    console.log("");
    console.log("This was a dry run: silent audio, fixture data. Add OPENAI_API_KEY and");
    console.log("ANTHROPIC_API_KEY to .env and re-run with `npm run video:live` (after wiring");
    console.log("the live brief fetch, see the comment in run.ts) for the real narrated version.");
  }
}

main().catch((err) => {
  console.error("video-factory failed:", err);
  process.exit(1);
});
