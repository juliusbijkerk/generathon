# Submission draft

Copy/adapt into the hackathon submission form. Pick the track, attach the
final mp4 and/or a link to `/today`, and go - this is the one step I can't
click for you.

## Project name

FOC (pronounced like it looks - Future of Content)

## Tagline

You don't need to scroll anymore. The good stuff finds you. The bad stuff
never reaches you.

## Track

AI Shorts & Vertical Content (the narrated vertical video is the centerpiece
of the product; don't over-index on the label when pitching).

## Description

I save a lot on Instagram and LinkedIn - AI/agent tooling, weird hardware
projects, GTM tactics, job-market threads - and almost never look at any of
it again. FOC closes that loop.

It ingests what I save (paste a link/text directly, or forward it to a
Telegram bot), classifies each item against a personal content profile
(topic weights, an intent taxonomy - TOOL / BUILD / MARKET / ANCHOR /
DISCOVER / NOISE - and a list of active projects it should ground), and
ranks the day's top items. Anything that's pure engagement bait or an
unlinked vent gets filtered as noise; a vent that touches an active project
(e.g. a tech-layoffs post relevant to my other project, job-ai) survives as
ANCHOR - grounding material instead of noise.

The ranked brief ships three ways every day:

- A ~60-90s narrated vertical video (LLM-written script, TTS narration, one
  card per item, assembled with ffmpeg, polished in CapCut with a Higgsfield
  intro clip)
- A web page (`/today`) with the video, ranked cards, a live capture box, a
  "skipped N noise items" line, and a profile view
- An HTML email with the same ranking

Built solo end-to-end in one hackathon session: Supabase (Postgres, Edge
Functions, Storage, Realtime), Claude/GPT for classification and script
writing, OpenAI TTS, ffmpeg, CapCut, Higgsfield, Resend, and a Vite/React
frontend.

## What's demoable live

- Live capture: paste a URL/text (or message the Telegram bot) and watch it
  get classified and ranked in seconds, no pre-baked step.
- The pre-rendered narrated video and ranked `/today` page.
- The noise-filtering logic explained against a real example (a job-market
  vent kept as ANCHOR because it grounds an active project, versus generic
  engagement bait dropped as NOISE).

## Links

- Repo: (add your GitHub/GitLab URL once pushed)
- Demo video: `video-factory/output/brief-<date>.mp4` (or the Supabase
  Storage public URL from `npm run upload-video`)
- Live page: (your deployed `/today` URL, or `http://localhost:5173/today`
  for a local demo)
