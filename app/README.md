# FOC web app

`/today` and `/profile`, built with Vite + React + TypeScript + Tailwind,
talking directly to Supabase (Postgres + Realtime + Edge Functions).

Runs in **demo mode** with zero configuration (fixture data, matching
`video-factory/src/fixtures/sample-brief.json`) so it's always showable.
Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` /
`VITE_SUPABASE_ANON_KEY` (see `../docs/SETUP.md`) to go live.

```bash
npm run dev      # http://localhost:5173/today
npm run build
```

See `../docs/LOVABLE_PROMPT.md` for an optional Lovable-built alternative on
top of the same schema.
