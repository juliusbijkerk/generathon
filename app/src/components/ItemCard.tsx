import type { BriefItemView } from "../lib/types";
import { TagPill } from "./TagPill";

export function ItemCard({ item }: { item: BriefItemView }) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-500">#{item.rank_position}</span>
          <TagPill intent={item.intent} />
        </div>
        <span className="text-xs text-gray-500">{item.source_name ?? item.source_type}</span>
      </div>
      <p className="mt-3 text-[15px] leading-relaxed text-gray-100">{item.one_line_insight}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {item.tags.map((t) => (
          <span key={t} className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] text-gray-400">
            {t}
          </span>
        ))}
      </div>
    </>
  );

  const className =
    "block rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/20 hover:bg-white/[0.05]";

  if (item.source_url) {
    return (
      <a href={item.source_url} target="_blank" rel="noreferrer" className={className}>
        {content}
      </a>
    );
  }
  return <div className={className}>{content}</div>;
}
