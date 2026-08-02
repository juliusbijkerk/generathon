// Phase 8 of the plan: paste today's real TLDR AI and Lenny's Newsletter
// content in as newsletter-tagged saves, rather than building real inbound
// email parsing under time pressure.
//
// 1. Copy today's real issue text into:
//      content-profile/seed/tldr-today.txt
//      content-profile/seed/lennys-today.txt
//    (placeholders are checked in so this script runs out of the box, but
//    the classifications will be visibly generic until you paste the real
//    text - each placeholder line says so.)
// 2. Deploy ingest-classify (see docs/SETUP.md step 5).
// 3. Run: npm run seed:newsletters

import { readFileSync } from "node:fs";
import { config } from "dotenv";

config();

const SEEDS: { file: string; sourceName: string; sourceUrl: string }[] = [
  { file: "content-profile/seed/tldr-today.txt", sourceName: "TLDR AI", sourceUrl: "https://tldr.tech/ai" },
  {
    file: "content-profile/seed/lennys-today.txt",
    sourceName: "Lenny's Newsletter",
    sourceUrl: "https://www.lennysnewsletter.com/",
  },
];

async function main() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("SUPABASE_URL / SUPABASE_ANON_KEY not set - copy .env.example to .env and fill them in.");
  }

  for (const seed of SEEDS) {
    const text = readFileSync(seed.file, "utf-8").trim();
    console.log(`Seeding ${seed.sourceName} (${text.length} chars from ${seed.file})...`);

    const res = await fetch(`${url.replace(/\/$/, "")}/functions/v1/ingest-classify`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${anonKey}`, apikey: anonKey },
      body: JSON.stringify({
        profile_slug: "julius",
        source_type: "newsletter",
        source_name: seed.sourceName,
        source_url: seed.sourceUrl,
        raw_text: text,
      }),
    });

    if (!res.ok) {
      console.error(`  Failed (${res.status}): ${await res.text()}`);
      continue;
    }
    const data = await res.json();
    console.log(`  -> ${data.classification.intent}: ${data.classification.one_line_insight}`);
  }

  console.log("\nDone. Re-run rank-brief (or reload /today) to fold these into today's brief.");
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
