// Orchestrates: intro card+line, one segment per brief item, an outro
// card+line, concatenated into one mp4, with captions burned in when the
// local ffmpeg build supports the subtitles filter (falls back gracefully,
// with a clear console warning, when it does not - this must never be a hard
// failure since it runs right before a deadline).

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { renderCard, renderIntroCard, renderOutroCard } from "./renderCards.js";
import { synthesizeLine } from "./tts.js";
import { run, ffmpegHasSubtitlesFilter } from "./ffmpegUtil.js";
import type { Brief, Script } from "./types.js";

export interface AssembleResult {
  finalPath: string;
  captioned: boolean;
  totalDurationSeconds: number;
  synthesizedRealVoice: boolean;
}

function srtTimestamp(totalSeconds: number): string {
  const ms = Math.round((totalSeconds % 1) * 1000);
  const s = Math.floor(totalSeconds) % 60;
  const m = Math.floor(totalSeconds / 60) % 60;
  const h = Math.floor(totalSeconds / 3600);
  const pad = (n: number, len = 2) => n.toString().padStart(len, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

export async function assembleVideo(
  brief: Brief,
  script: Script,
  opts: { dryRun: boolean; outDir: string },
): Promise<AssembleResult> {
  const workDir = path.join(opts.outDir, `work-${brief.date}`);
  await mkdir(workDir, { recursive: true });

  const segments: string[] = [];
  const srtEntries: { start: number; end: number; text: string }[] = [];
  let cursor = 0;
  let anySynthesized = false;

  // --- intro ---
  const introCard = path.join(workDir, "intro.png");
  await renderIntroCard(brief.display_name, brief.date, brief.items.length, introCard);
  const introAudio = path.join(workDir, "intro.mp3");
  const introTts = await synthesizeLine(script.opener, introAudio, opts);
  anySynthesized = anySynthesized || introTts.synthesized;
  const introSegment = path.join(workDir, "seg-intro.mp4");
  await buildSegment(introCard, introAudio, introSegment);
  segments.push(introSegment);
  srtEntries.push({ start: cursor, end: cursor + introTts.durationSeconds, text: script.opener });
  cursor += introTts.durationSeconds;

  // --- one segment per item ---
  for (const item of brief.items) {
    const line = script.lines.find((l) => l.rank_position === item.rank_position);
    const text = line?.text ?? item.one_line_insight;

    const cardPath = path.join(workDir, `card-${item.rank_position}.png`);
    await renderCard(item, cardPath);

    const audioPath = path.join(workDir, `line-${item.rank_position}.mp3`);
    const tts = await synthesizeLine(text, audioPath, opts);
    anySynthesized = anySynthesized || tts.synthesized;

    const segmentPath = path.join(workDir, `seg-${item.rank_position}.mp4`);
    await buildSegment(cardPath, audioPath, segmentPath);
    segments.push(segmentPath);

    srtEntries.push({ start: cursor, end: cursor + tts.durationSeconds, text });
    cursor += tts.durationSeconds;
  }

  // --- outro ---
  const outroCard = path.join(workDir, "outro.png");
  await renderOutroCard(script.closer, outroCard);
  const outroAudio = path.join(workDir, "outro.mp3");
  const outroTts = await synthesizeLine(script.closer, outroAudio, opts);
  anySynthesized = anySynthesized || outroTts.synthesized;
  const outroSegment = path.join(workDir, "seg-outro.mp4");
  await buildSegment(outroCard, outroAudio, outroSegment);
  segments.push(outroSegment);
  srtEntries.push({ start: cursor, end: cursor + outroTts.durationSeconds, text: script.closer });
  cursor += outroTts.durationSeconds;

  // --- concat ---
  const concatListPath = path.join(workDir, "concat.txt");
  await writeFile(concatListPath, segments.map((s) => `file '${s}'`).join("\n"));
  const concatenatedPath = path.join(opts.outDir, `brief-${brief.date}-nocaptions.mp4`);
  await run("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", concatListPath, "-c", "copy", concatenatedPath]);

  // --- captions (best effort) ---
  const finalPath = path.join(opts.outDir, `brief-${brief.date}.mp4`);
  const canCaption = await ffmpegHasSubtitlesFilter();
  if (canCaption) {
    const srtPath = path.join(workDir, "captions.srt");
    await writeFile(srtPath, buildSrt(srtEntries));
    try {
      await run("ffmpeg", [
        "-y",
        "-i",
        concatenatedPath,
        "-vf",
        `subtitles=${srtPath.replace(/:/g, "\\:")}:force_style='Fontsize=20,Alignment=2,MarginV=120'`,
        "-c:a",
        "copy",
        finalPath,
      ]);
      return { finalPath, captioned: true, totalDurationSeconds: cursor, synthesizedRealVoice: anySynthesized };
    } catch (err) {
      console.warn("Caption burn-in failed, shipping the uncaptioned cut instead.", err);
    }
  } else {
    console.warn("ffmpeg build has no subtitles filter (libass) - shipping the uncaptioned cut.");
  }

  await run("ffmpeg", ["-y", "-i", concatenatedPath, "-c", "copy", finalPath]);
  return { finalPath, captioned: false, totalDurationSeconds: cursor, synthesizedRealVoice: anySynthesized };
}

async function buildSegment(imagePath: string, audioPath: string, outPath: string): Promise<void> {
  await run("ffmpeg", [
    "-y",
    "-loop",
    "1",
    "-i",
    imagePath,
    "-i",
    audioPath,
    "-c:v",
    "libx264",
    "-tune",
    "stillimage",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-shortest",
    "-vf",
    "scale=1080:1920",
    outPath,
  ]);
}

function buildSrt(entries: { start: number; end: number; text: string }[]): string {
  return entries
    .map((e, i) => `${i + 1}\n${srtTimestamp(e.start)} --> ${srtTimestamp(e.end)}\n${e.text}\n`)
    .join("\n");
}
