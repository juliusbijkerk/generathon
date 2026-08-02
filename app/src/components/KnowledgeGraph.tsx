import type { BriefItemView } from "../lib/types";

interface KnowledgeGraphProps {
  items: BriefItemView[];
}

export function KnowledgeGraph({ items }: KnowledgeGraphProps) {
  // Group items by shared tags to show connections
  const tagConnections = new Map<string, number[]>();
  items.forEach((item) => {
    item.tags.forEach((tag) => {
      if (!tagConnections.has(tag)) tagConnections.set(tag, []);
      tagConnections.get(tag)!.push(item.rank_position);
    });
  });

  const connections = Array.from(tagConnections.entries())
    .filter(([_, positions]) => positions.length > 1)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 5);

  if (connections.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 text-center">
        <p className="text-sm text-white/40">No strong connections yet - save more content to see patterns!</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
      <h3 className="mb-4 text-sm font-semibold text-white/80">🔗 Knowledge Graph</h3>
      
      <div className="space-y-4">
        {connections.map(([tag, positions]) => (
          <div key={tag} className="group">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-400/60" />
              <span className="text-sm font-medium text-white/70">{tag}</span>
            </div>
            
            <div className="ml-4 flex flex-wrap gap-2">
              {positions.map((pos) => {
                const item = items.find((i) => i.rank_position === pos);
                if (!item) return null;
                
                return (
                  <a
                    key={pos}
                    href={item.source_url || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-xs text-white/60 transition hover:border-blue-400/30 hover:bg-blue-400/[0.06] hover:text-blue-300"
                  >
                    <span className="font-mono text-white/40">#{pos}</span>
                    <span className="max-w-[120px] truncate">{item.source_name || item.source_type}</span>
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 rounded-xl bg-white/[0.04] p-3">
        <p className="text-xs text-white/50">
          💡 Items sharing tags are automatically connected. Ask the AI to explore these patterns deeper!
        </p>
      </div>
    </div>
  );
}
