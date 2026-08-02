// Provider-agnostic completion. One function fronts every model call and
// routes by id prefix (claude-* / gpt-* / gemini-*), the same shape as a
// prior production pipeline: swapping providers is a config/env change, not a
// code change. Uses raw fetch rather than an SDK to keep the Deno bundle
// small and avoid SDK-vs-runtime compatibility surprises under deadline.

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export interface CompleteOptions {
  model: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  /** When set, OpenAI models are asked for strict structured JSON output. */
  jsonSchema?: { name: string; schema: Record<string, unknown> };
}

export async function complete(opts: CompleteOptions): Promise<string> {
  if (opts.model.startsWith("claude-")) return completeAnthropic(opts);
  if (opts.model.startsWith("gpt-") || opts.model.startsWith("o1") || opts.model.startsWith("o3")) {
    return completeOpenAI(opts);
  }
  if (opts.model.startsWith("gemini-")) return completeGemini(opts);
  if (opts.model.startsWith("mistral-") || opts.model.startsWith("ministral-") || opts.model.startsWith("magistral-")) {
    return completeMistral(opts);
  }
  throw new Error(`No provider route for model "${opts.model}". Add one in _shared/llm.ts.`);
}

async function completeAnthropic({ model, messages, maxTokens, temperature }: CompleteOptions): Promise<string> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");
  const system = messages.find((m) => m.role === "system")?.content ?? "";
  const rest = messages.filter((m) => m.role !== "system").map((m) => ({ role: m.role, content: m.content }));

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      system,
      messages: rest,
      max_tokens: maxTokens ?? 1024,
      temperature: temperature ?? 0.4,
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

async function completeOpenAI({ model, messages, maxTokens, temperature, jsonSchema }: CompleteOptions): Promise<string> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens ?? 1024,
      temperature: temperature ?? 0.4,
      ...(jsonSchema
        ? {
            response_format: {
              type: "json_schema",
              json_schema: { name: jsonSchema.name, schema: jsonSchema.schema, strict: true },
            },
          }
        : {}),
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function completeGemini({ model, messages }: CompleteOptions): Promise<string> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");
  const system = messages.find((m) => m.role === "system")?.content ?? "";
  const rest = messages.filter((m) => m.role !== "system");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: rest.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
      }),
    },
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

async function completeMistral({ model, messages, maxTokens, temperature }: CompleteOptions): Promise<string> {
  const apiKey = Deno.env.get("MISTRAL_API_KEY");
  if (!apiKey) throw new Error("MISTRAL_API_KEY not set");

  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens ?? 1024,
      temperature: temperature ?? 0.4,
    }),
  });
  if (!res.ok) throw new Error(`Mistral ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

/** Best-effort strip of markdown code fences before JSON.parse, since some
 * models wrap structured output in ```json fences even when asked not to. */
export function parseJsonLoose<T>(raw: string): T {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  return JSON.parse(cleaned) as T;
}
