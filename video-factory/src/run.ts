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
import { generateScript } from "./generateScript.js";
import { assembleVideo } from "./assemble.js";
import { checkFfmpegAvailable } from "./ffmpegUtil.js";
import type { Brief } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function loadBrief(dryRun: boolean): Promise<Brief> {
  if (dryRun) {
    const raw = await readFile(path.join(__dirname, "fixtures", "sample-brief.json"), "utf-8");
    return JSON.parse(raw) as Brief;
  }

  // Live path: fetch the ranked brief for today from Supabase instead of the
  // fixture. Left as a documented extension point rather than guessed at,
  // since it depends on a real deployed project (see docs/SETUP.md, step 4).
  throw new Error(
    "Live brief loading not wired yet - deploy rank-brief, call it once for today, then " +
      "either export its response to JSON and point loadBrief() at that file, or add a " +
      "@supabase/supabase-js fetch here using SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY.",
  );
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
