// Renders one vertical (1080x1920) card per brief item: gradient background
// keyed by intent, a tag pill, source label, and the one-line insight.
// Insight text supports a "reveal" mode - already-said words render bright,
// not-yet-said words render dim - so assemble.ts can generate a short burst
// of stage images per item and get a kinetic, caption-like reveal effect
// purely from pre-rendered PNGs (no ffmpeg drawtext/libass dependency, which
// this machine's ffmpeg build doesn't have anyway).

import sharp from "sharp";
import type { BriefItem } from "./types.js";

const WIDTH = 1080;
const HEIGHT = 1920;
const REVEALED_COLOR = "#f9fafb";
const UNREVEALED_COLOR = "#4b5563";

const INTENT_GRADIENT: Record<string, [string, string]> = {
  TOOL: ["#1d4ed8", "#0b1220"],
  BUILD: ["#15803d", "#0b1220"],
  MARKET: ["#b45309", "#0b1220"],
  ANCHOR: ["#6d28d9", "#0b1220"],
  DISCOVER: ["#0e7490", "#0b1220"],
};

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Wraps text into lines of words (not joined strings) so each word can be
 * colored independently for the reveal effect while keeping SVG's native
 * inline text flow (no manual width math needed). */
function wrapWords(text: string, maxCharsPerLine: number): string[][] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[][] = [];
  let current: string[] = [];
  let currentLen = 0;
  for (const word of words) {
    const addLen = current.length === 0 ? word.length : word.length + 1;
    if (currentLen + addLen > maxCharsPerLine && current.length > 0) {
      lines.push(current);
      current = [word];
      currentLen = word.length;
    } else {
      current.push(word);
      currentLen += addLen;
    }
  }
  if (current.length > 0) lines.push(current);
  return lines;
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function renderRevealText(
  lines: string[][],
  startX: number,
  startY: number,
  lineHeight: number,
  fontSize: number,
  revealedWordCount: number,
): string {
  let wordIdx = 0;
  return lines
    .map((words, li) => {
      const spans = words
        .map((w, wi) => {
          const isLast = wi === words.length - 1;
          const revealed = wordIdx < revealedWordCount;
          wordIdx += 1;
          const fill = revealed ? REVEALED_COLOR : UNREVEALED_COLOR;
          return `<tspan fill="${fill}">${escapeXml(w)}${isLast ? "" : " "}</tspan>`;
        })
        .join("");
      const y = startY + li * lineHeight;
      return `<text xml:space="preserve" x="${startX}" y="${y}" font-family="Helvetica, Arial, sans-serif" font-size="${fontSize}" font-weight="700">${spans}</text>`;
    })
    .join("\n");
}

async function renderCardAtStage(item: BriefItem, outPath: string, revealedWordCount: number | null): Promise<void> {
  const [c1, c2] = INTENT_GRADIENT[item.intent] ?? ["#374151", "#0b1220"];
  const lines = wrapWords(item.one_line_insight, 26);
  const totalWords = countWords(item.one_line_insight);
  const lineHeight = 64;
  const startY = HEIGHT / 2 - (lines.length * lineHeight) / 2;
  const revealCount = revealedWordCount ?? totalWords;

  const textSpans = renderRevealText(lines, 80, startY, lineHeight, 52, revealCount);

  const svg = `
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${c1}" />
      <stop offset="100%" stop-color="${c2}" />
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)" />

  <rect x="80" y="140" rx="24" ry="24" width="260" height="64" fill="#00000055" />
  <text x="110" y="183" font-family="Helvetica, Arial, sans-serif" font-size="34" font-weight="700" fill="#f9fafb">${escapeXml(item.intent)}</text>

  <text x="80" y="260" font-family="Helvetica, Arial, sans-serif" font-size="30" fill="#d1d5db">${escapeXml(item.source_name)} - #${item.rank_position}</text>

  ${textSpans}

  <text x="80" y="${HEIGHT - 100}" font-family="Helvetica, Arial, sans-serif" font-size="28" fill="#9ca3af">${escapeXml(item.tags.join("  ·  "))}</text>
</svg>`;

  await sharp(Buffer.from(svg)).png().toFile(outPath);
}

/** Renders `stageCount` progressively-revealed PNGs for one item (last stage
 * = fully revealed), for use as short zoompan sub-clips in assemble.ts. */
export async function renderCardStages(item: BriefItem, outDir: string, stageCount = 3): Promise<string[]> {
  const totalWords = countWords(item.one_line_insight);
  const paths: string[] = [];
  for (let stage = 0; stage < stageCount; stage++) {
    const revealCount = Math.max(1, Math.ceil((totalWords * (stage + 1)) / stageCount));
    const outPath = `${outDir}/card-${item.rank_position}-stage-${stage}.png`;
    await renderCardAtStage(item, outPath, revealCount);
    paths.push(outPath);
  }
  return paths;
}

export async function renderIntroCard(displayName: string, date: string, itemCount: number, outPath: string): Promise<void> {
  const svg = `
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#111827" />
      <stop offset="100%" stop-color="#000000" />
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)" />
  <text x="80" y="${HEIGHT / 2 - 60}" font-family="Helvetica, Arial, sans-serif" font-size="34" fill="#9ca3af">${escapeXml(date)}</text>
  <text x="80" y="${HEIGHT / 2 + 10}" font-family="Helvetica, Arial, sans-serif" font-size="88" font-weight="800" fill="#f9fafb">${escapeXml(displayName)}'s</text>
  <text x="80" y="${HEIGHT / 2 + 110}" font-family="Helvetica, Arial, sans-serif" font-size="88" font-weight="800" fill="#f9fafb">brief</text>
  <text x="80" y="${HEIGHT / 2 + 190}" font-family="Helvetica, Arial, sans-serif" font-size="36" fill="#6b7280">${itemCount} ${itemCount === 1 ? "thing" : "things"} worth your time today</text>
</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(outPath);
}

export async function renderOutroCard(closerText: string, outPath: string): Promise<void> {
  const lines = wrapWords(closerText, 30).map((words) => words.join(" "));
  const lineHeight = 58;
  const startY = HEIGHT / 2 - (lines.length * lineHeight) / 2;
  const textSpans = lines
    .map(
      (line, i) =>
        `<text x="80" y="${startY + i * lineHeight}" font-family="Helvetica, Arial, sans-serif" font-size="46" font-weight="700" fill="#f9fafb">${escapeXml(line)}</text>`,
    )
    .join("\n");

  const svg = `
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#000000" />
      <stop offset="100%" stop-color="#111827" />
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)" />
  ${textSpans}
  <text x="80" y="${HEIGHT - 100}" font-family="Helvetica, Arial, sans-serif" font-size="30" fill="#6b7280">FOC</text>
</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(outPath);
}
