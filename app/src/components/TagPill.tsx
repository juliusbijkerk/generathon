import type { Intent } from "../lib/types";

const INTENT_STYLES: Record<Intent, string> = {
  TOOL: "bg-blue-600",
  BUILD: "bg-green-600",
  MARKET: "bg-amber-600",
  ANCHOR: "bg-violet-600",
  DISCOVER: "bg-cyan-600",
  NOISE: "bg-gray-600",
};

export function TagPill({ intent }: { intent: Intent }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-white ${
        INTENT_STYLES[intent] ?? "bg-gray-600"
      }`}
    >
      {intent}
    </span>
  );
}
