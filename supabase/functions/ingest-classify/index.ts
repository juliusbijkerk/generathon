// POST { profile_slug, source_type, source_url?, source_name?, raw_text? }
// -> { save, classification }
//
// This is the guaranteed-to-work live capture path used in the demo: the
// /today page's paste box calls this directly, no external bot dependency.

import { handleOptions, json } from "../_shared/cors.ts";
import { ingestAndClassify } from "../_shared/ingest.ts";
import type { IngestInput } from "../_shared/types.ts";

Deno.serve(async (req: Request) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    return json({ error: "POST only" }, { status: 405 });
  }

  let body: IngestInput;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.profile_slug || !body.source_type) {
    return json({ error: "profile_slug and source_type are required" }, { status: 400 });
  }
  if (!body.source_url && !body.raw_text) {
    return json({ error: "Provide source_url and/or raw_text" }, { status: 400 });
  }

  try {
    const result = await ingestAndClassify(body);
    return json(result, { status: 201 });
  } catch (err) {
    console.error("ingest-classify failed", err);
    return json({ error: String(err instanceof Error ? err.message : err) }, { status: 500 });
  }
});
