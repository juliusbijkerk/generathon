import type { Intent } from "../lib/types";

// Soft, low-saturation washes instead of flat solid badges - reads as
// "editorial category" rather than "status chip in a dashboard".
const INTENT_STYLES: Record<Intent, string> = {
  TOOL: "bg-blue-400/15 text-blue-200 ring-1 ring-inset ring-blue-400/25",
  BUILD: "bg-emerald-400/15 text-emerald-200 ring-1 ring-inset ring-emerald-400/25",
  MARKET: "bg-amber-400/15 text-amber-200 ring-1 ring-inset ring-amber-400/25",
  ANCHOR: "bg-violet-400/15 text-violet-200 ring-1 ring-inset ring-violet-400/25",
  DISCOVER: "bg-cyan-400/15 text-cyan-200 ring-1 ring-inset ring-cyan-400/25",
  NOISE: "bg-white/10 text-gray-300 ring-1 ring-inset ring-white/15",
};

export function TagPill({ intent }: { intent: Intent }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] ${
        INTENT_STYLES[intent] ?? INTENT_STYLES.NOISE
      }`}
    >
      {intent}
    </span>
  );
}
