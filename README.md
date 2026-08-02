# FOC - Future of Content

A personal daily "content debrief": capture what you save on Instagram,
LinkedIn, Telegram, and newsletters, classify and rank it against a personal
content profile, and get the top items back as a narrated vertical video, a
web page, and an email - instead of a save pile you never revisit.

> You don't need to scroll anymore. The good stuff finds you. The bad stuff
> never reaches you.

Built solo in ~14 hours for Generathon (Paris, Aug 2026). Full build plan:
`.cursor/plans/foc_hackathon_build_plan_7d3c446f.plan.md`.

## How it fits together

```
capture (paste / Telegram)  ->  classify (LLM)  ->  rank (content profile)
        ->  script + TTS + cards + ffmpeg  ->  CapCut/Higgsfield polish
        ->  /today web page  +  email
```

See the plan file for the full architecture diagram and rationale.

## Repo layout

- `supabase/` - Postgres schema (`migrations/`) and edge functions
  (`functions/`): `ingest-classify`, `rank-brief`, `telegram-webhook`,
  `send-brief-email`.
- `content-profile/` - the human-edited scoring rubric (`julius.yaml`) and
  newsletter seed text (`seed/`).
- `video-factory/` - local Node/ffmpeg pipeline that turns a ranked brief
  into a vertical mp4 (script -> TTS -> cards -> ffmpeg assembly).
- `app/` - the `/today` and `/profile` web pages (Vite + React + Tailwind +
  Supabase). Works with zero keys in demo mode (fixture data) so it's always
  showable.
- `scripts/` - one-off CLI helpers: sync the profile into Supabase, seed
  newsletter saves, smoke-test the capture pipeline, upload the final video.
- `docs/` - `SETUP.md` (the manual account/key steps only you can do),
  `DEMO_SCRIPT.md` (the rehearsed live-demo sequence), `LOVABLE_PROMPT.md`
  (optional: a ready-to-paste prompt if you want a Lovable-built version of
  the web page instead of/alongside `app/`).

## What's already verified working, right now, offline

```bash
npm install
npm run video:dry-run   # produces a real 1080x1920 mp4 in video-factory/output/
                         # using silent placeholder audio + fixture data - no
                         # API keys needed. Proves the mechanical pipeline.

npm run app:dev         # /today and /profile render fully in "demo mode"
                         # using the same fixture data, no Supabase needed yet.
```

## What still needs your accounts and keys

I cannot create your Supabase project, your Lovable project, your Telegram
bot, or sign into CapCut/Higgsfield for you - those all require your own
login. Everything code-side is ready to go the moment you provide the keys.
Follow `docs/SETUP.md` step by step (it's short, mostly copy-paste) to go
from "demo mode" to fully live.
