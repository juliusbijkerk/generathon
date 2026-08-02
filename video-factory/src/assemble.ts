// Orchestrates: intro beat, one item per brief entry (rendered as a short
// burst of zoompan'd, progressively-revealed card stages synced to its own
// continuous audio line), an outro beat, all concatenated into one mp4.
//
// No ffmpeg drawtext/subtitles anywhere - this machine's ffmpeg build has
// neither libfreetype nor libass, so every visual (including the word-reveal
// "captions") is pre-rendered as an image via sharp/SVG and only ever
// animated with the core zoompan filter, which is always available.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { renderCardStages, renderIntroCard, renderOutroCard } from "./renderCards.js";
import { synthesizeLine } from "./tts.js";
import { run } from "./ffmpegUtil.js";
import type { Brief, Script } from "./types.js";

export interface AssembleResult {
  finalPath: string;
  totalDurationSeconds: number;
  synthesizedRealVoice: boolean;
  itemsWithMotion: number;
}

const ZOOM_FILTER =
  "scale=2160:3840,zoompan=z='min(zoom+0.0015,1.15)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30";

async function buildZoomClip(imagePath: string, durationSeconds: number, outPath: string): Promise<void> {
  await run("ffmpeg", [
    "-y",
    "-loop",
    "1",
    "-i",
    imagePath,
    "-t",
    Math.max(0.5, durationSeconds).toFixed(2),
    "-vf",
    ZOOM_FILTER,
    "-an",
    "-pix_fmt",
    "yuv420p",
    "-c:v",
    "libx264",
    outPath,
  ]);
}

async function concatClips(clipPaths: string[], outPath: string, listPath: string): Promise<void> {
  await writeFile(listPath, clipPaths.map((p) => `file '${p}'`).join("\n"));
  await run("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", outPath]);
}

async function muxVideoAudio(videoPath: string, audioPath: string, outPath: string): Promise<void> {
  await run("ffmpeg", [
    "-y",
    "-i",
    videoPath,
    "-i",
    audioPath,
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-shortest",
    outPath,
  ]);
}

export async function assembleVideo(
  brief: Brief,
  script: Script,
  opts: { dryRun: boolean; outDir: string },
): Promise<AssembleResult> {
  const workDir = path.join(opts.outDir, `work-${brief.date}`);
  await mkdir(workDir, { recursive: true });

  const segments: string[] = [];
  let anySynthesized = false;
  let cursor = 0;
  let itemsWithMotion = 0;

  // --- intro beat ---
  const introCard = path.join(workDir, "intro.png");
  await renderIntroCard(brief.display_name, brief.date, brief.items.length, introCard);
  const introAudio = path.join(workDir, "intro.mp3");
  const introTts = await synthesizeLine(script.opener.text, introAudio, script.opener.speaker, opts);
  anySynthesized = anySynthesized || introTts.synthesized;
  const introVisual = path.join(workDir, "intro-visual.mp4");
  await buildZoomClip(introCard, introTts.durationSeconds, introVisual);
  const introSegment = path.join(workDir, "seg-intro.mp4");
  await muxVideoAudio(introVisual, introAudio, introSegment);
  segments.push(introSegment);
  cursor += introTts.durationSeconds;

  // --- one segment per item: staged reveal + zoompan, synced to one continuous audio line ---
  const STAGE_COUNT = 3;
  for (const item of brief.items) {
    const line = script.lines.find((l) => l.rank_position === item.rank_position);
    const text = line?.text ?? item.one_line_insight;
    const speaker = line?.speaker ?? "A";

    const audioPath = path.join(workDir, `line-${item.rank_position}.mp3`);
    const tts = await synthesizeLine(text, audioPath, speaker, opts);
    anySynthesized = anySynthesized || tts.synthesized;

    const stagePaths = await renderCardStages(item, workDir, STAGE_COUNT);
    const stageDur = tts.durationSeconds / stagePaths.length;
    const stageClips: string[] = [];
    for (let s = 0; s < stagePaths.length; s++) {
      const clipPath = path.join(workDir, `item-${item.rank_position}-stage-${s}.mp4`);
      await buildZoomClip(stagePaths[s], stageDur, clipPath);
      stageClips.push(clipPath);
    }
    const visualPath = path.join(workDir, `item-${item.rank_position}-visual.mp4`);
    await concatClips(stageClips, visualPath, path.join(workDir, `item-${item.rank_position}-concat.txt`));

    const segmentPath = path.join(workDir, `seg-${item.rank_position}.mp4`);
    await muxVideoAudio(visualPath, audioPath, segmentPath);
    segments.push(segmentPath);
    itemsWithMotion += 1;
    cursor += tts.durationSeconds;
  }

  // --- outro beat ---
  const outroCard = path.join(workDir, "outro.png");
  await renderOutroCard(script.closer.text, outroCard);
  const outroAudio = path.join(workDir, "outro.mp3");
  const outroTts = await synthesizeLine(script.closer.text, outroAudio, script.closer.speaker, opts);
  anySynthesized = anySynthesized || outroTts.synthesized;
  const outroVisual = path.join(workDir, "outro-visual.mp4");
  await buildZoomClip(outroCard, outroTts.durationSeconds, outroVisual);
  const outroSegment = path.join(workDir, "seg-outro.mp4");
  await muxVideoAudio(outroVisual, outroAudio, outroSegment);
  segments.push(outroSegment);
  cursor += outroTts.durationSeconds;

  // --- final concat ---
  const finalPath = path.join(opts.outDir, `brief-${brief.date}.mp4`);
  await concatClips(segments, finalPath, path.join(workDir, "final-concat.txt"));

  return { finalPath, totalDurationSeconds: cursor, synthesizedRealVoice: anySynthesized, itemsWithMotion };
}
