// The scoring engine. This file must never change per user - only
// content-profile/<slug>.yaml (synced into profiles.profile_json) should.
//
// score = intent_priority[intent] x best_topic_weight_matched x source_weight
// A DISCOVER item is only ever kept up to consumption.discovery_slots, no
// matter how it scores, so "outside your bubble" content stays a controlled
// allowance rather than crowding out the rest of the brief.

import type { ActiveProject, ClassifierResult, ContentProfile, Save } from "./types.ts";

const FALLBACK_TOPIC_WEIGHT = 0.2; // an item that matches no known topic isn't zeroed, just deprioritized
const FALLBACK_SOURCE_WEIGHT = 1.0;

export function bestTopicWeight(profile: ContentProfile, tags: string[]): number {
  const lowerTags = tags.map((t) => t.toLowerCase());
  let best = FALLBACK_TOPIC_WEIGHT;
  for (const topic of profile.topics) {
    if (lowerTags.includes(topic.name.toLowerCase())) {
      best = Math.max(best, topic.weight);
    }
  }
  return best;
}

export function sourceWeight(profile: ContentProfile, sourceType: string): number {
  const match = profile.sources.find((s) => s.type === sourceType);
  return match?.weight ?? FALLBACK_SOURCE_WEIGHT;
}

export function matchActiveProject(profile: ContentProfile, text: string): ActiveProject | null {
  const lower = text.toLowerCase();
  for (const project of profile.active_projects) {
    if (project.keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
      return project;
    }
  }
  return null;
}

export interface ScoredResult extends ClassifierResult {
  score: number;
}

/**
 * Applies the noise_rules escape hatch and computes the final score. A noisy
 * item (vent, engagement bait) that also matches an active project is kept
 * and reclassified as ANCHOR rather than dropped - this is what turns a "tech
 * layoffs are brutal" vent post into launch-day reply material instead of
 * silently deleting it.
 */
export function scoreClassification(
  profile: ContentProfile,
  raw: ClassifierResult,
  sourceType: string,
  fullText: string,
): ScoredResult {
  let intent = raw.intent;
  let isNoise = raw.is_noise;
  let matchedProject = raw.matched_active_project;

  if (isNoise) {
    const project = matchActiveProject(profile, fullText);
    if (project) {
      isNoise = false;
      intent = "ANCHOR";
      matchedProject = project.name;
    }
  }

  if (isNoise) {
    return { ...raw, intent, is_noise: true, matched_active_project: matchedProject, score: 0 };
  }

  const intentPriority = profile.intent_priority[intent] ?? 0.5;
  const topicWeight = bestTopicWeight(profile, raw.tags);
  const srcWeight = sourceWeight(profile, sourceType);
  const score = Number((intentPriority * topicWeight * srcWeight).toFixed(4));

  return { ...raw, intent, is_noise: false, matched_active_project: matchedProject, score };
}

export interface RankableItem {
  save: Save;
  intent: string;
  tags: string[];
  one_line_insight: string;
  score: number;
  is_noise: boolean;
  matched_active_project: string | null;
}

export interface BriefSelection {
  selected: RankableItem[]; // already sorted, rank_position = index + 1
  skippedNoiseCount: number;
  overflowCount: number; // scored fine but didn't fit today's cap
}

export function selectBriefItems(profile: ContentProfile, items: RankableItem[]): BriefSelection {
  const { daily_item_cap, discovery_slots, min_score_threshold } = profile.consumption;

  const noiseFiltered = items.filter((i) => !i.is_noise);
  const skippedNoiseCount = items.length - noiseFiltered.length;

  const aboveThreshold = noiseFiltered.filter(
    (i) => i.score >= min_score_threshold || i.intent === "ANCHOR",
  );
  const belowThresholdCount = noiseFiltered.length - aboveThreshold.length;

  const sorted = [...aboveThreshold].sort((a, b) => b.score - a.score);

  const selected: RankableItem[] = [];
  let discoveryUsed = 0;
  const deferred: RankableItem[] = [];

  for (const item of sorted) {
    if (selected.length >= daily_item_cap) {
      deferred.push(item);
      continue;
    }
    if (item.intent === "DISCOVER") {
      if (discoveryUsed >= discovery_slots) {
        deferred.push(item);
        continue;
      }
      discoveryUsed += 1;
    }
    selected.push(item);
  }

  return {
    selected,
    skippedNoiseCount: skippedNoiseCount + belowThresholdCount,
    overflowCount: deferred.length,
  };
}
