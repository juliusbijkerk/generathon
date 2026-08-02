// Fallback data shown when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not
// set, so `npm run dev` shows a real, working page before Supabase is wired
// up - the same "works with no keys" principle applied to video-factory's
// --dry-run mode, applied here to the frontend. Mirrors
// video-factory/src/fixtures/sample-brief.json; keep the two in sync by hand.

import type { BriefView, ProfileView } from "./types";

export const DEMO_BRIEF: BriefView = {
  date: "2026-08-02",
  display_name: "Julius",
  video_url: null,
  skipped_count: 12,
  items: [
    {
      rank_position: 1,
      intent: "TOOL",
      tags: ["ai-agents", "dev-tools"],
      source_type: "instagram",
      source_name: "nick_saraev",
      source_url: "https://www.instagram.com/p/DbV8LwXPDxt/",
      one_line_insight:
        "🔥 Agent Reach: Free open-source CLI that gives Claude/Cursor scraping superpowers for Twitter, Reddit, YouTube & GitHub - zero API costs",
    },
    {
      rank_position: 2,
      intent: "BUILD",
      tags: ["weird-hardware", "ai-agents"],
      source_type: "instagram",
      source_name: "evolving.ai",
      source_url: "https://www.instagram.com/p/DbgNp0NjcGY/",
      one_line_insight:
        "🤯 $8 ESP32 chip running real-time person detection with ZERO latency - no cloud, no GPU, pure edge AI magic",
    },
    {
      rank_position: 3,
      intent: "BUILD",
      tags: ["ai-agents", "startup-tools"],
      source_type: "linkedin",
      source_name: "TechCrunch",
      source_url: "https://techcrunch.com",
      one_line_insight:
        "💰 New Y Combinator batch: 40% of startups are AI agents. The infrastructure gold rush is here.",
    },
    {
      rank_position: 4,
      intent: "ANCHOR",
      tags: ["gtm-growth", "viral-content"],
      source_type: "linkedin",
      source_name: "Kirill Yerin",
      source_url: "https://www.linkedin.com/feed/update/urn:li:activity:7482323240422477824",
      one_line_insight:
        "🎯 1,200+ comments on 'why companies have open roles but keep doing layoffs' - perfect anchor for job-ai launch",
    },
    {
      rank_position: 5,
      intent: "MARKET",
      tags: ["fundraising", "startup-tools"],
      source_type: "newsletter",
      source_name: "TLDR",
      source_url: "https://tldr.tech/ai",
      one_line_insight:
        "📊 VCs now require AI agents to show 'reasoning traces' before funding - transparency is the new moat",
    },
    {
      rank_position: 6,
      intent: "TOOL",
      tags: ["dev-tools", "productivity"],
      source_type: "telegram",
      source_name: "ProductHunt",
      source_url: "https://www.producthunt.com",
      one_line_insight:
        "⚡ Windsurf Editor hits #1 on HN: Cursor competitor with native multi-file editing and $0 inference",
    },
    {
      rank_position: 7,
      intent: "DISCOVER",
      tags: ["weird-hardware", "ai-agents"],
      source_type: "instagram",
      source_name: "hackernews",
      source_url: "https://news.ycombinator.com",
      one_line_insight:
        "🌟 Someone built a $200 robot dog that follows you using only Raspberry Pi and CV - full tutorial posted",
    },
  ],
};

export const DEMO_PROFILE: ProfileView = {
  slug: "julius",
  display_name: "Julius",
  topics: [
    { name: "ai-agents", weight: 1.0 },
    { name: "dev-tools", weight: 0.9 },
    { name: "startup-tools", weight: 0.9 },
    { name: "weird-hardware", weight: 0.7 },
    { name: "gtm-growth", weight: 0.6 },
    { name: "fundraising", weight: 0.4 },
    { name: "generic-motivation", weight: 0.05 },
  ],
  active_projects: [
    {
      name: "job-ai",
      keywords: ["job search", "hiring", "ATS", "tech layoffs", "job market"],
      reason: "launch-day reply material and market validation",
    },
  ],
  consumption: { daily_item_cap: 10, video_item_cap: 7, discovery_slots: 2 },
};
