# Demo script (Phase 9 rehearsal)

Working name: **FOC** (Future of Content). Lead line: *"You don't need to
scroll anymore. The good stuff finds you. The bad stuff never reaches you."*
Fallback names if the room reaction to FOC is mixed: Ahead, Unscroll.

Target length: ~90 seconds live demo + short Q&A buffer.

## Before you go on stage

- [ ] `briefs.video_url` is set (via `npm run upload-video`) and plays on
      the venue wifi - test this exact network, not just localhost.
- [ ] `/today` is deployed/reachable (or run `npm run app:dev` locally with
      real `.env` and demo from `localhost:5173`).
- [ ] Two demo URLs from `scripts/test-capture.ts` are fresh in
      `save_classifications` (run `npm run test:capture` once right before
      going on, so scores/tags are current).
- [ ] Telegram bot replies within a few seconds when you message it (test
      right before - if flaky, skip it and use the paste box instead, same
      pipeline either way).
- [ ] A screen recording of one full clean run exists as an absolute
      fallback (Phase 9 requirement) - QuickTime screen recording of exactly
      the sequence below.
- [ ] Final mp4 is saved in two places: local disk and Supabase Storage.

## Live sequence

1. **Open on `/today`.** Let the video autoplay/click play - this is the
   "wow": a real narrated brief built from your own actual saved posts
   (Agent Reach CLI, the ESP32 person-detector, the job-market posts), not
   generic AI slop.
2. **Say the lead line** while the video plays: *"Every day I save stuff on
   Instagram and LinkedIn I never look at again. This watches that pile for
   me and hands me back only what's worth my next 90 seconds."*
3. **Point at the ranked cards below the video.** Call out one TOOL card and
   one ANCHOR card by name: *"This one's a tool I'm actually going to use
   this week. This one's tagged ANCHOR because it grounds a project I'm
   already building - job-ai - so instead of scrolling past a vent about
   the job market, it becomes launch-day reply material."*
4. **Live capture moment.** Either:
   - Pull out your phone, forward a link to the Telegram bot, watch it reply
     with a tag in the chat, then watch the card appear on `/today` via
     Realtime, or
   - If Telegram is flaky at the venue, paste the same link into the capture
     box on `/today` directly - identical pipeline, zero external
     dependency, this is the one that must never fail.
5. **Mention the skipped-noise line**: *"It also skipped N noise items
   today - engagement bait, vents with nothing actionable - so what's left
   is dense, not just filtered."*
6. **Close**: *"This is FOC. You don't need to scroll anymore. The good
   stuff finds you. The bad stuff never reaches you."*

## If something breaks live

- Video won't play -> switch to the pre-recorded screen recording fallback,
  say "here's a run from earlier today" and keep talking over it.
- Telegram doesn't reply -> use the paste box, note out loud that it's the
  same backend path.
- Wifi dies entirely -> the screen recording fallback needs no network at
  all; have it downloaded locally, not just linked.

## Anticipated questions

- **"How is this different from just saving things?"** Saving is where
  everyone stops. This classifies against a personal weighting (topics,
  active projects, noise rules) and pushes a ranked, narrated brief back to
  you - the loop closes instead of dead-ending in a pile.
- **"Monetization?"** B2C: a personal subscription, priced like a knowledge
  tool (Readwise/mymind territory), one profile per person. B2B angle later:
  a team version where the content profile is a role or project instead of a
  person, feeding a shared brief to a team channel.
- **"What's automated vs pre-baked for this demo?"** Be honest: classification
  and ranking are live; the narrated video render (TTS + ffmpeg + CapCut
  polish) runs ahead of time because it's the slow step, not because the
  logic is fake - the exact same pipeline (`npm run video:live`) can run for
  any day's real ranked brief.

## Submission

- Track: lean track 2 (AI Shorts & Vertical) given the vertical narrated
  video is the centerpiece; don't over-index on the label in the pitch
  itself.
- Submit by 14:45 (buffer before the 15:00 hard cutoff), not 14:59.
