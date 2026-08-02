import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileP = promisify(execFile);

export async function run(cmd: string, args: string[]): Promise<void> {
  try {
    await execFileP(cmd, args, { maxBuffer: 1024 * 1024 * 64 });
  } catch (err: any) {
    const stderr = err?.stderr ?? err?.message ?? String(err);
    throw new Error(`${cmd} failed: ${stderr}`);
  }
}

export async function ffprobeDurationSeconds(path: string): Promise<number> {
  const { stdout } = await execFileP("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    path,
  ]);
  const seconds = parseFloat(stdout.trim());
  return Number.isFinite(seconds) ? seconds : 3;
}

export function checkFfmpegAvailable(): Promise<boolean> {
  return execFileP("ffmpeg", ["-version"])
    .then(() => true)
    .catch(() => false);
}

export function ffmpegHasSubtitlesFilter(): Promise<boolean> {
  return execFileP("ffmpeg", ["-filters"])
    .then(({ stdout }) => stdout.includes("subtitles"))
    .catch(() => false);
}
