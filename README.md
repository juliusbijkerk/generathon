# FOC - Future of Content

Your AI-powered second brain for saved content. Capture what you save on Instagram,
LinkedIn, Telegram, and newsletters - then **chat with an AI** that helps you explore
connections, build on ideas, and turn saves into action.

> You don't need to scroll anymore. An AI companion helps you understand, connect,
> and act on the content that matters.

**NEW: Interactive AI Chat + Knowledge Graph** 🤖

Built solo in ~14 hours for Generathon (Paris, Aug 2026). Full build plan:
`.cursor/plans/foc_hackathon_build_plan_7d3c446f.plan.md`.

## How it fits together

```
capture (paste / Telegram)  ->  classify (LLM)  ->  rank (content profile)
        ->  AI chat interface  ->  knowledge graph connections
        ->  explore, build, & act on ideas
```

**Original video pipeline still available** for narrated briefs when you want passive consumption.

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
