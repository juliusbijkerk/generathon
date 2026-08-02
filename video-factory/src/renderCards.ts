// Renders one vertical (1080x1920) card per brief item: gradient background
// keyed by intent, a tag pill, source label, and the one-line insight
// word-wrapped. Pure local rendering (SVG -> PNG via sharp), no network call,
// so this step always runs regardless of --dry-run.

import sharp from "sharp";
import type { BriefItem } from "./types.js";

const WIDTH = 1080;
const HEIGHT = 1920;

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

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function renderCard(item: BriefItem, outPath: string): Promise<void> {
  const [c1, c2] = INTENT_GRADIENT[item.intent] ?? ["#374151", "#0b1220"];
  const lines = wrapText(item.one_line_insight, 26);
  const lineHeight = 64;
  const startY = HEIGHT / 2 - (lines.length * lineHeight) / 2;

  const textSpans = lines
    .map(
      (line, i) =>
        `<text x="80" y="${startY + i * lineHeight}" font-family="Helvetica, Arial, sans-serif" font-size="52" font-weight="700" fill="#f9fafb">${escapeXml(line)}</text>`,
    )
    .join("\n");

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
  <text x="80" y="${HEIGHT / 2 + 190}" font-family="Helvetica, Arial, sans-serif" font-size="36" fill="#6b7280">${itemCount} things worth your time today</text>
</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(outPath);
}

export async function renderOutroCard(closerText: string, outPath: string): Promise<void> {
  const lines = wrapText(closerText, 30);
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
