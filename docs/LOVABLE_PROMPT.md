# Optional: Lovable build prompt

`app/` already ships a working, tested `/today` + `/profile` page connected
to this exact schema - you do not need this to have a demo. Use this only if
you want a Lovable-built alternative (e.g. for a different visual style) on
top of the same Supabase project. Paste the block below into a new Lovable
project after connecting it to your existing Supabase project (Lovable's
Supabase integration reuses the project you already created in
`docs/SETUP.md`, no new schema needed - point it at the same one).

---

Build a personal daily content brief web app called "FOC" with two pages,
connected to my existing Supabase project (tables already exist, do not
change the schema):

**Tables (read-only from this app, do not modify):**
- `profiles(id, slug, display_name, profile_json jsonb)`
- `saves(id, profile_id, source_type, source_url, source_name, raw_text, captured_at)`
- `save_classifications(id, save_id, intent, tags text[], one_line_insight, score, is_noise)`
- `briefs(id, profile_id, brief_date, status, video_url, skipped_count)`
- `brief_items(id, brief_id, save_id, rank_position, in_video)`

**Page `/today`:**
- Header: brief_date, display_name, link to `/profile`.
- A vertical (9:16) video player showing `briefs.video_url` for today's row
  (`brief_date = current date`, `profiles.slug = 'julius'`). If null, show a
  placeholder saying the video isn't rendered yet.
- A capture box: a text input (accepts a URL or free text) plus a source-type
  select (Instagram / LinkedIn / Newsletter / Paste), and a "Capture" button
  that POSTs to the edge function `ingest-classify` at
  `${SUPABASE_URL}/functions/v1/ingest-classify` with JSON body
  `{ profile_slug: "julius", source_type, source_url, raw_text }` (send
  `source_url` if the input looks like a URL, else `raw_text`). Show the
  returned `classification.intent` and `classification.one_line_insight`
  inline after it responds.
- Below that, a responsive grid of cards, one per `brief_items` row (joined to
  `saves` and `save_classifications`) for today's brief, ordered by
  `rank_position`. Each card: a colored pill for `intent` (TOOL=blue,
  BUILD=green, MARKET=amber, ANCHOR=violet, DISCOVER=cyan), the
  `one_line_insight`, the `source_name`, small tag chips from `tags`, and the
  whole card links out to `source_url` when present.
- Below the grid, a small muted line: "Skipped {briefs.skipped_count} noise
  items today" (only if > 0).
- Subscribe to Supabase Realtime on `save_classifications` and `briefs` so
  new captures (including ones made via Telegram from a phone) appear
  without a manual refresh.

**Page `/profile`:**
- Read `profiles.profile_json` for slug `julius`.
- Render `topics` as horizontal bar chart (weight 0-1).
- Render `active_projects` as cards (name, reason, keyword chips).
- Render `consumption` caps as a small stat list (daily_item_cap,
  video_item_cap, discovery_slots).

**Style:** dark background, near-black, high-contrast white text, generous
spacing, rounded-2xl cards with a subtle 1px light border, no gradients
except on the intent pills - should feel closer to a premium reading app
(mymind, Arc) than a dashboard.
