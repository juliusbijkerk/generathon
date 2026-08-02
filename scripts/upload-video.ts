// Phase 4 close-out: get the CapCut/Higgsfield-polished final mp4 into
// Supabase Storage and point today's brief row at it, so /today and the
// email both pick it up. The local copy in video-factory/output/ (or
// wherever CapCut exported to) is storage location #1; this script creates
// location #2.
//
// Usage:
//   npm run upload-video -- --file=video-factory/output/brief-2026-08-02.mp4 --date=2026-08-02

import { readFileSync } from "node:fs";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config();

function arg(name: string, fallback?: string): string {
  const found = process.argv.find((a) => a.startsWith(`--${name}=`));
  const value = found?.split("=").slice(1).join("=");
  if (!value && !fallback) throw new Error(`Missing required --${name}=... argument`);
  return value ?? fallback!;
}

const BUCKET = "briefs";

async function main() {
  const file = arg("file");
  const date = arg("date", new Date().toISOString().slice(0, 10));
  const slug = arg("slug", "julius");

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set - copy .env.example to .env and fill them in.");
  }

  const supabase = createClient(url, key);

  const { error: bucketErr } = await supabase.storage.createBucket(BUCKET, { public: true });
  if (bucketErr && !bucketErr.message.includes("already exists")) {
    throw new Error(`Could not create/confirm bucket: ${bucketErr.message}`);
  }

  const bytes = readFileSync(file);
  const storagePath = `${date}.mp4`;
  console.log(`Uploading ${file} (${(bytes.length / 1024 / 1024).toFixed(1)} MB) -> ${BUCKET}/${storagePath}...`);

  const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(storagePath, bytes, {
    contentType: "video/mp4",
    upsert: true,
  });
  if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  console.log(`Public URL: ${pub.publicUrl}`);

  const { data: profile } = await supabase.from("profiles").select("id").eq("slug", slug).single();
  if (!profile) throw new Error(`Unknown profile "${slug}"`);

  const { error: updateErr } = await supabase
    .from("briefs")
    .update({ video_url: pub.publicUrl, status: "rendered", updated_at: new Date().toISOString() })
    .eq("profile_id", profile.id)
    .eq("brief_date", date);
  if (updateErr) throw new Error(`Could not update brief.video_url: ${updateErr.message}`);

  console.log(`Done. brief_date=${date} now points at this video. Local copy stays at: ${file}`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
