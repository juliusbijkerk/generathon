// Pushes a human-edited content-profile/<slug>.yaml into the profiles table's
// profile_json column. Run this whenever the yaml changes - the ranking and
// classification edge functions read profile_json at call time, so no
// redeploy is needed after a sync.
//
// Usage:
//   npm run profile:sync -- --slug=julius --file=content-profile/julius.yaml
//
// Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env (root).

import { readFileSync } from "node:fs";
import { config } from "dotenv";
import yaml from "js-yaml";
import { createClient } from "@supabase/supabase-js";

config();

function arg(name: string, fallback?: string): string {
  const found = process.argv.find((a) => a.startsWith(`--${name}=`));
  const value = found?.split("=").slice(1).join("=");
  if (!value && !fallback) throw new Error(`Missing required --${name}=... argument`);
  return value ?? fallback!;
}

async function main() {
  const slug = arg("slug", "julius");
  const file = arg("file", `content-profile/${slug}.yaml`);

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set - copy .env.example to .env and fill them in.");
  }

  const raw = readFileSync(file, "utf-8");
  const profileJson = yaml.load(raw) as Record<string, unknown>;
  if (!profileJson || typeof profileJson !== "object" || !("topics" in profileJson)) {
    throw new Error(`${file} does not look like a valid content profile (missing "topics")`);
  }

  const supabase = createClient(url, key);
  const displayName = (profileJson as any).display_name ?? slug;

  const { error } = await supabase
    .from("profiles")
    .upsert(
      { slug, display_name: displayName, profile_json: profileJson, updated_at: new Date().toISOString() },
      { onConflict: "slug" },
    );

  if (error) throw new Error(`Supabase upsert failed: ${error.message}`);
  console.log(`Synced ${file} -> profiles.slug = "${slug}" (${Object.keys(profileJson).length} top-level keys).`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
