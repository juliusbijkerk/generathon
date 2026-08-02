// Turns a ranked brief into a two-host "stack debrief" script - the NotebookLM
// Audio Overview trick applied here: two voices trading short lines reads as
// a conversation, not a lecture, which is the single highest-leverage fix for
// "flat narrator over static cards" without adding a new API or service.
//
// In --dry-run (or with no ANTHROPIC_API_KEY set) this returns a deterministic
// templated script - alternating speakers so the TTS/assembly plumbing is
// fully exercised, but it is NOT meant to sound clever; only the live LLM
// path is. Same "prove the plumbing without an API key" principle as before.

import type { Brief, Script, ScriptLine, Speaker } from "./types.js";

const SYSTEM_PROMPT = `You write a 60-90 second "stack debrief" video script from a ranked list of
saved posts for one person, delivered by TWO hosts trading short lines - the
same trick NotebookLM's Audio Overview uses: it reads as a real conversation,
not a lecture. Style: two sharp, direct friends, not newsreaders. Second
person when addressing the listener. No hype words ("game-changing",
"revolutionary"). Name the actual tool/idea/claim, never a vague category.
Host A tends to state the item, Host B tends to react/add the "why it
matters" angle in one short follow-up line - but vary it, don't make every
exchange the same shape. Each line under 18 words, said out loud naturally.

Return strict JSON matching this shape exactly:
{
  "opener": {"speaker": "A"|"B", "text": string},
  "lines": [{"rank_position": number, "intent": string, "speaker": "A"|"B", "text": string}, ...],
  "closer": {"speaker": "A"|"B", "text": string}
}
Every brief item should get either one line or a two-line exchange (one
"lines" entry per speaker turn, same rank_position repeated if it's a two-line
exchange). opener: A and B briefly frame today's count together (1-2 beats
total). closer: mention the skipped-noise count if greater than zero,
otherwise a short sign-off, 1-2 beats total.`;

export async function generateScript(brief: Brief, opts: { dryRun: boolean }): Promise<Script> {
  const model = process.env.SCRIPT_MODEL ?? "gpt-4o";
  const isClaude = model.startsWith("claude-");
  const apiKey = isClaude ? process.env.ANTHROPIC_API_KEY : process.env.OPENAI_API_KEY;
  if (opts.dryRun || !apiKey) {
    return templatedScript(brief);
  }
  return isClaude ? llmScriptAnthropic(brief, model, apiKey) : llmScriptOpenAi(brief, model, apiKey);
}

function templatedScript(brief: Brief): Script {
  const lines: ScriptLine[] = brief.items.map((item, idx) => ({
    rank_position: item.rank_position,
    intent: item.intent,
    speaker: (idx % 2 === 0 ? "A" : "B") as Speaker,
    text: `${introFor(item.intent)}: ${item.one_line_insight}`,
  }));

  const closerText =
    brief.skipped_count > 0
      ? `Skipped ${brief.skipped_count} noise item${brief.skipped_count === 1 ? "" : "s"} today. That's your stack.`
      : "That's your stack for today.";

  return {
    opener: { speaker: "A", text: `${brief.items.length} things from the last 24 hours actually worth your time.` },
    lines,
    closer: { speaker: "B", text: closerText },
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

async function llmScriptAnthropic(brief: Brief, model: string, apiKey: string): Promise<Script> {
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
      max_tokens: 1536,
      temperature: 0.6,
      messages: [{ role: "user", content: JSON.stringify(brief) }],
    }),
  });
  if (!res.ok) {
    console.warn(`Script LLM call failed (${res.status}), falling back to templated script.`);
    return templatedScript(brief);
  }
  const data = await res.json();
  const raw: string = data.content?.[0]?.text ?? "";
  return parseScriptOrFallback(raw, brief);
}

async function llmScriptOpenAi(brief: Brief, model: string, apiKey: string): Promise<Script> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.6,
      max_tokens: 1536,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(brief) },
      ],
    }),
  });
  if (!res.ok) {
    console.warn(`Script LLM call failed (${res.status}: ${await res.text()}), falling back to templated script.`);
    return templatedScript(brief);
  }
  const data = await res.json();
  const raw: string = data.choices?.[0]?.message?.content ?? "";
  return parseScriptOrFallback(raw, brief);
}

function parseScriptOrFallback(raw: string, brief: Brief): Script {
  try {
    const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
    return JSON.parse(cleaned) as Script;
  } catch (err) {
    console.warn("Could not parse script LLM output, falling back to templated script.", err);
    return templatedScript(brief);
  }
}
