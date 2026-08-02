// Synthesizes one narration line to an audio file. In --dry-run (or with no
// OPENAI_API_KEY) this generates silence via ffmpeg's anullsrc, timed from a
// word-count reading-pace estimate, so downstream card timing and assembly
// are fully exercised without ever calling a paid API.

import { writeFile } from "node:fs/promises";
import { run, ffprobeDurationSeconds } from "./ffmpegUtil.js";

const WORDS_PER_SECOND = 2.5; // conversational reading pace estimate

export interface TtsResult {
  path: string;
  durationSeconds: number;
  synthesized: boolean; // false when this is silence, not real speech
}

export async function synthesizeLine(
  text: string,
  outPath: string,
  opts: { dryRun: boolean },
): Promise<TtsResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!opts.dryRun && apiKey) {
    const ok = await synthesizeViaOpenAi(text, outPath, apiKey);
    if (ok) {
      const durationSeconds = await ffprobeDurationSeconds(outPath);
      return { path: outPath, durationSeconds, synthesized: true };
    }
    console.warn(`OpenAI TTS failed for "${text.slice(0, 40)}...", falling back to silence timing.`);
  }

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const estimatedSeconds = Math.max(1.5, wordCount / WORDS_PER_SECOND);
  await run("ffmpeg", [
    "-y",
    "-f",
    "lavfi",
    "-i",
    `anullsrc=r=24000:cl=mono`,
    "-t",
    estimatedSeconds.toFixed(2),
    "-q:a",
    "9",
    outPath,
  ]);
  return { path: outPath, durationSeconds: estimatedSeconds, synthesized: false };
}

async function synthesizeViaOpenAi(text: string, outPath: string, apiKey: string): Promise<boolean> {
  try {
    const model = process.env.OPENAI_TTS_MODEL ?? "gpt-4o-mini-tts";
    const voice = process.env.OPENAI_TTS_VOICE ?? "onyx";
    const res = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, voice, input: text, format: "mp3" }),
    });
    if (!res.ok) {
      console.warn(`OpenAI TTS ${res.status}: ${await res.text()}`);
      return false;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(outPath, buf);
    return true;
  } catch (err) {
    console.warn("OpenAI TTS request threw", err);
    return false;
  }
}
