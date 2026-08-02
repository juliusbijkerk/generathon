// Turns a ranked brief into a "stack debrief" narration script: fast, specific,
// second person, names the actual thing rather than describing a category.
// In --dry-run (or with no ANTHROPIC_API_KEY set) this returns a deterministic
// templated script so the rest of the pipeline is fully testable offline -
// the same "prove the plumbing works without an API key" principle as a
// prior production pipeline's `--dry-run-no-llm` mode.

import type { Brief, Script, ScriptLine } from "./types.js";

const SYSTEM_PROMPT = `You write a 60-90 second "stack debrief" video script from a ranked list of
saved posts for one person. Style: a sharp, direct friend, not a newsreader.
Second person. No hype words ("game-changing", "revolutionary"). Name the
actual tool/idea/claim, never a vague category. One sentence per item, each
under 20 words, said out loud naturally. Return strict JSON:
{"opener": string, "lines": [{"rank_position": number, "intent": string, "text": string}], "closer": string}
opener: one sentence framing today's count. closer: one sentence, mention the
skipped-noise count if greater than zero, otherwise a short sign-off.`;

export async function generateScript(brief: Brief, opts: { dryRun: boolean }): Promise<Script> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (opts.dryRun || !apiKey) {
    return templatedScript(brief);
  }
  return llmScript(brief, apiKey);
}

function templatedScript(brief: Brief): Script {
  const lines: ScriptLine[] = brief.items.map((item) => ({
    rank_position: item.rank_position,
    intent: item.intent,
    text: `${introFor(item.intent)}: ${item.one_line_insight}`,
  }));

  const closer =
    brief.skipped_count > 0
      ? `Skipped ${brief.skipped_count} noise item${brief.skipped_count === 1 ? "" : "s"} today. That's your stack.`
      : "That's your stack for today.";

  return {
    opener: `${brief.items.length} things from the last 24 hours actually worth your time.`,
    lines,
    closer,
  };
}

function introFor(intent: string): string {
  switch (intent) {
    case "TOOL":
      return "Add to your stack";
    case "BUILD":
      return "Worth building on";
    case "MARKET":
      return "For when you launch";
    case "ANCHOR":
      return "Grounding for job-ai";
    case "DISCOVER":
      return "Outside your usual lane";
    default:
      return "Worth knowing";
  }
}

async function llmScript(brief: Brief, apiKey: string): Promise<Script> {
  const model = process.env.SCRIPT_MODEL ?? "claude-sonnet-4-6";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      system: SYSTEM_PROMPT,
      max_tokens: 1024,
      temperature: 0.5,
      messages: [{ role: "user", content: JSON.stringify(brief) }],
    }),
  });
  if (!res.ok) {
    console.warn(`Script LLM call failed (${res.status}), falling back to templated script.`);
    return templatedScript(brief);
  }
  const data = await res.json();
  const raw: string = data.content?.[0]?.text ?? "";
  try {
    const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
    return JSON.parse(cleaned) as Script;
  } catch (err) {
    console.warn("Could not parse script LLM output, falling back to templated script.", err);
    return templatedScript(brief);
  }
}
