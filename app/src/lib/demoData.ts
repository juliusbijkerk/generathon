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
  skipped_count: 3,
  items: [
    {
      rank_position: 1,
      intent: "TOOL",
      tags: ["ai-agents", "dev-tools"],
      source_type: "instagram",
      source_name: "nick_saraev",
      source_url: "https://www.instagram.com/p/DbV8LwXPDxt/",
      one_line_insight:
        "Agent Reach is a free open-source CLI that gives Claude Code or Cursor scraping access to Twitter, Reddit, YouTube, and GitHub with no paid API keys.",
    },
    {
      rank_position: 2,
      intent: "BUILD",
      tags: ["weird-hardware", "ai-agents"],
      source_type: "instagram",
      source_name: "evolving.ai",
      source_url: "https://www.instagram.com/p/DbgNp0NjcGY/",
      one_line_insight:
        "Someone put a person-detection model directly on an 8 dollar ESP32, zero-delay tracking with no cloud call and no GPU.",
    },
    {
      rank_position: 3,
      intent: "ANCHOR",
      tags: ["gtm-growth"],
      source_type: "linkedin",
      source_name: "Kirill Yerin",
      source_url: "https://www.linkedin.com/feed/update/urn:li:activity:7482323240422477824",
      one_line_insight:
        "job-ai anchor: a 300-comment thread on why layoffs and unfilled roles are happening at once is launch-day reply material.",
    },
    {
      rank_position: 4,
      intent: "ANCHOR",
      tags: ["gtm-growth"],
      source_type: "linkedin",
      source_name: "Mansi Sharma",
      source_url: "https://www.linkedin.com/feed/update/urn:li:activity:7481214376008564736",
      one_line_insight:
        "job-ai anchor: 500+ applications and zero offers is the exact pain job-ai's launch post should open with.",
    },
    {
      rank_position: 5,
      intent: "TOOL",
      tags: ["dev-tools", "startup-tools"],
      source_type: "newsletter",
      source_name: "TLDR AI",
      source_url: "https://tldr.tech/ai",
      one_line_insight: "REPLACE BEFORE DEMO: paste today's real top item from TLDR AI here.",
    },
    {
      rank_position: 6,
      intent: "MARKET",
      tags: ["gtm-growth"],
      source_type: "newsletter",
      source_name: "Lenny's Newsletter",
      source_url: "https://www.lennysnewsletter.com/",
      one_line_insight: "REPLACE BEFORE DEMO: paste today's real top item from Lenny's Newsletter here.",
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
