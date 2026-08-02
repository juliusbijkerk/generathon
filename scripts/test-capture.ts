// Phase 6 checkpoint: exercise ingest-classify against the two known-working
// public URLs picked during planning (one Instagram, one LinkedIn) so the
// live-capture demo never relies on an arbitrary link picked on stage.
// Run this after deploying ingest-classify and rank-brief:
//   npm run test:capture
// Repeat a few times (Phase 6 asks for at least five runs) to build
// confidence before trusting it live, and to confirm rank-brief stays
// idempotent as more saves accumulate.

import { config } from "dotenv";

config();

const DEMO_URLS: { source_type: "instagram" | "linkedin"; source_url: string; raw_text: string }[] = [
  {
    source_type: "instagram",
    source_url: "https://www.instagram.com/p/DbV8LwXPDxt/",
    raw_text:
      "nick_saraev: Agent Reach - a free open-source CLI giving Claude Code / Cursor scraping access to Twitter, Reddit, YouTube, GitHub, no paid API keys needed.",
  },
  {
    source_type: "linkedin",
    source_url: "https://www.linkedin.com/feed/update/urn:li:activity:7482323240422477824",
    raw_text:
      "Kirill Yerin: a widely-discussed post on why tech layoffs and unfilled roles are happening at the same time in today's job market.",
  },
];

async function main() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("SUPABASE_URL / SUPABASE_ANON_KEY not set - copy .env.example to .env and fill them in.");
  }
  const base = url.replace(/\/$/, "");
  const headers = { "content-type": "application/json", authorization: `Bearer ${anonKey}`, apikey: anonKey };

  for (const demo of DEMO_URLS) {
    console.log(`\nCapturing ${demo.source_type}: ${demo.source_url}`);
    const res = await fetch(`${base}/functions/v1/ingest-classify`, {
      method: "POST",
      headers,
      body: JSON.stringify({ profile_slug: "julius", ...demo }),
    });
    if (!res.ok) {
      console.error(`  FAILED (${res.status}): ${await res.text()}`);
      continue;
    }
    const data = await res.json();
    console.log(`  intent=${data.classification.intent} score=${data.classification.score}`);
    console.log(`  "${data.classification.one_line_insight}"`);
  }

  console.log("\nRe-ranking today's brief...");
  const rankRes = await fetch(`${base}/functions/v1/rank-brief`, {
    method: "POST",
    headers,
    body: JSON.stringify({ profile_slug: "julius" }),
  });
  if (!rankRes.ok) {
    console.error(`rank-brief FAILED (${rankRes.status}): ${await rankRes.text()}`);
    process.exit(1);
  }
  const ranked = await rankRes.json();
  console.log(`Brief now has ${ranked.items.length} items, skipped_noise_count=${ranked.skipped_noise_count}.`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
