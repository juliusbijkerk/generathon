# Setup: going from demo mode to fully live

Everything in this repo is written and tested (see the video-factory dry run
and the app's demo mode). These are the remaining steps that need your own
accounts and logins - I can't do these for you, but each one is a few
minutes of copy-paste.

## 0. Fill in `.env`

```bash
cp .env.example .env
cp app/.env.example app/.env
```

You'll fill in the values as you go through the steps below.

## 1. Create the Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) -> New
   project. Any region close to Paris (e.g. `eu-west-3`) minimizes latency
   for the live demo.
2. Once created, go to **Project Settings -> API** and copy:
   - `Project URL` -> `SUPABASE_URL` and `VITE_SUPABASE_URL` in both `.env` files
   - `anon public` key -> `SUPABASE_ANON_KEY` and `VITE_SUPABASE_ANON_KEY`
   - `service_role` key -> `SUPABASE_SERVICE_ROLE_KEY` (root `.env` only -
     never put this in `app/.env`, it's admin-level and must never ship to
     the browser)

## 2. Run the schema

Easiest path without installing the Supabase CLI: open **SQL Editor** in the
dashboard, paste the entire contents of `supabase/migrations/0001_init.sql`,
and run it. Confirm the five tables (`profiles`, `saves`,
`save_classifications`, `briefs`, `brief_items`) show up under **Table
Editor**.

(If you do have the Supabase CLI: `supabase link --project-ref <ref>` then
`supabase db push` does the same thing.)

## 3. Sync your content profile

```bash
npm install
npm run profile:sync
```

This reads `content-profile/julius.yaml` and writes it into the `profiles`
row's `profile_json` column via the service role key. Re-run this any time
you tweak topic weights or `active_projects` - no redeploy needed, the edge
functions read it live.

## 4. Deploy the edge functions

Install the Supabase CLI once (`brew install supabase/tap/supabase`), then:

```bash
supabase link --project-ref <your-project-ref>
supabase secrets set \
  SUPABASE_URL=https://<ref>.supabase.co \
  SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \
  ANTHROPIC_API_KEY=<key> \
  OPENAI_API_KEY=<key> \
  CLASSIFY_MODEL_LIVE=gpt-4o-mini \
  CLASSIFY_MODEL_BATCH=claude-sonnet-4-6 \
  TELEGRAM_BOT_TOKEN=<from step 6> \
  RESEND_API_KEY=<from step 7> \
  RESEND_FROM="FOC <brief@yourdomain.dev>" \
  RESEND_TO=<your email>

supabase functions deploy ingest-classify --no-verify-jwt
supabase functions deploy rank-brief --no-verify-jwt
supabase functions deploy telegram-webhook --no-verify-jwt
supabase functions deploy send-brief-email --no-verify-jwt
```

Smoke test:

```bash
npm run test:capture
```

This calls `ingest-classify` with the two known-working demo URLs (one
Instagram, one LinkedIn) picked during planning, then calls `rank-brief`.
Phase 6 of the plan asks you to run this at least five times before trusting
it live - it's idempotent, safe to repeat.

## 5. Run the app against the live project

```bash
npm run app:dev
```

The amber "demo mode" banner on `/today` disappears once `app/.env` has real
values - that's your signal it's live.

## 6. Telegram bot (BotFather)

1. In Telegram, message [@BotFather](https://t.me/BotFather) -> `/newbot` ->
   follow the prompts -> copy the token into `TELEGRAM_BOT_TOKEN` (root
   `.env` and the Supabase secret from step 4).
2. Point the bot at your deployed webhook:

```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://<ref>.functions.supabase.co/telegram-webhook"
```

3. Message the bot a link or pasted text from your phone - it should reply
   within a few seconds with the tag it assigned (`Tagged: TOOL - ...`).

## 7. Email (Resend)

1. Sign up at [resend.com](https://resend.com), verify a sending domain (or
   use their shared test domain for the demo if you don't own a domain -
   fine for a hackathon).
2. Create an API key -> `RESEND_API_KEY`.
3. After ranking a brief: `curl -X POST https://<ref>.functions.supabase.co/send-brief-email -H "content-type: application/json" -d '{"profile_slug":"julius"}'`

## 8. Newsletter seed (Phase 8)

Paste today's real TLDR AI and Lenny's Newsletter content into:

- `content-profile/seed/tldr-today.txt`
- `content-profile/seed/lennys-today.txt`

Then:

```bash
npm run seed:newsletters
```

## 9. CapCut + Higgsfield (manual, GUI tools)

These are apps you use directly, not APIs this repo calls:

1. Run `npm run video:dry-run` (or `npm run video:live` once step 4's keys
   are set) to produce the rough cut in `video-factory/output/`.
2. **CapCut**: open the app, claim today's fresh daily credit grant first
   (the prior 90-credit batch expired at 2026-08-02 00:00), import the rough
   cut, polish/re-time captions, export.
3. **Higgsfield**: generate one 2-3 second intro clip with your 10 free
   credits, save it as an mp4.
4. Prepend the Higgsfield clip to the CapCut-polished cut (CapCut can do this
   directly, or `ffmpeg -f concat` the same way `video-factory/src/assemble.ts`
   does).
5. Get the final file into two storage locations:

```bash
npm run upload-video -- --file=/path/to/final.mp4 --date=2026-08-02
```

This uploads to Supabase Storage (location #2 - your local export is
location #1) and points today's `briefs.video_url` at it, so both `/today`
and the email pick it up automatically.

## 10. Lovable (optional)

`app/` is a fully working, already-tested `/today` + `/profile` page - you
don't need Lovable to have a working demo. If you want a Lovable-built
alternative or a visual polish pass on top of the same Supabase schema, see
`docs/LOVABLE_PROMPT.md` for a ready-to-paste build brief.
