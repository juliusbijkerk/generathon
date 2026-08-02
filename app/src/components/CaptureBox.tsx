import { useState } from "react";
import { captureItem, rerankToday, type CaptureInput, type CaptureResult } from "../lib/api";
import { TagPill } from "./TagPill";
import type { Intent } from "../lib/types";

const SOURCE_OPTIONS: { value: CaptureInput["source_type"]; label: string }[] = [
  { value: "manual_paste", label: "Paste / other" },
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "newsletter", label: "Newsletter" },
];

/** The guaranteed-to-work live-capture demo moment: paste a URL or text here,
 * it gets classified in a few seconds, no external bot dependency. */
export function CaptureBox({ onCaptured }: { onCaptured?: () => void }) {
  const [sourceType, setSourceType] = useState<CaptureInput["source_type"]>("manual_paste");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CaptureResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const isUrl = /^https?:\/\//i.test(input.trim());
      const capture = await captureItem({
        source_type: sourceType,
        source_url: isUrl ? input.trim() : undefined,
        raw_text: isUrl ? undefined : input.trim(),
      });
      setResult(capture);
      setInput("");
      await rerankToday();
      onCaptured?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.025] p-5">
      <p className="mb-3 text-sm font-medium text-white/60">Capture something new</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
        <select
          value={sourceType}
          onChange={(e) => setSourceType(e.target.value as CaptureInput["source_type"])}
          className="rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-white/80"
        >
          {SOURCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste a URL or the post text..."
          className="flex-1 rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-white/80 placeholder:text-white/25"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-[var(--paper)] px-5 py-2.5 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Classifying..." : "Capture"}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-red-300/90">{error}</p>}

      {result && (
        <div className="mt-3 rounded-xl border border-white/[0.08] bg-black/20 p-3.5">
          <div className="mb-1.5 flex items-center gap-2">
            <TagPill intent={result.intent as Intent} />
            {result.is_noise && <span className="text-xs text-white/35">(would be filtered as noise)</span>}
          </div>
          <p className="text-sm text-white/80">{result.one_line_insight}</p>
        </div>
      )}
    </div>
  );
}
