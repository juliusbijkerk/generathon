import type { BriefItemView, Intent } from "../lib/types";
import { TagPill } from "./TagPill";

const INTENT_GLOW: Record<Intent, string> = {
  TOOL: "from-blue-400/10",
  BUILD: "from-emerald-400/10",
  MARKET: "from-amber-400/10",
  ANCHOR: "from-violet-400/10",
  DISCOVER: "from-cyan-400/10",
  NOISE: "from-white/5",
};

export function ItemCard({ item }: { item: BriefItemView }) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="font-display text-sm text-white/40">{String(item.rank_position).padStart(2, "0")}</span>
          <TagPill intent={item.intent} />
        </div>
        <span className="text-xs text-white/40">{item.source_name ?? item.source_type}</span>
      </div>
      <p className="font-display mt-4 text-[17px] leading-relaxed text-white/95">{item.one_line_insight}</p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {item.tags.map((t) => (
          <span key={t} className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[11px] text-white/45">
            {t}
          </span>
        ))}
      </div>
    </>
  );

  const className = `group relative block overflow-hidden rounded-[22px] border border-white/[0.08] bg-white/[0.025] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-white/[0.16] hover:bg-white/[0.045] hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)]`;
  const glow = (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br ${INTENT_GLOW[item.intent] ?? INTENT_GLOW.NOISE} to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
    />
  );

  if (item.source_url) {
    return (
      <a href={item.source_url} target="_blank" rel="noreferrer" className={className}>
        {glow}
        {content}
      </a>
    );
  }
  return (
    <div className={className}>
      {glow}
      {content}
    </div>
  );
}
