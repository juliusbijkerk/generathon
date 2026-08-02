import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchTodayBrief, subscribeToSaves } from "../lib/api";
import { isDemoMode } from "../lib/supabaseClient";
import type { BriefView } from "../lib/types";
import { AICharacter } from "../components/AICharacter";
import { KnowledgeGraph } from "../components/KnowledgeGraph";
import { ItemCard } from "../components/ItemCard";
import { CaptureBox } from "../components/CaptureBox";

export function Today() {
  const [brief, setBrief] = useState<BriefView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchTodayBrief();
      setBrief(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const unsubscribe = subscribeToSaves(() => load());
    return unsubscribe;
  }, [load]);

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
      <header className="mb-10">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              {isDemoMode && <span className="ml-2 text-amber-300/80">· demo</span>}
            </p>
            <h1 className="font-display mt-1 text-4xl font-medium tracking-tight text-white sm:text-[42px]">
              Morning Briefing
            </h1>
            <p className="mt-2 text-sm text-white/50">
              {brief?.display_name ?? "Your"} · {brief?.items.length ?? 0} items analyzed
            </p>
          </div>
          <Link to="/profile" className="text-sm text-white/40 transition hover:text-white">
            Profile →
          </Link>
        </div>
      </header>

      {isDemoMode && (
        <div className="mb-8 rounded-2xl border border-blue-400/20 bg-blue-400/[0.06] p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">🌅</div>
            <div className="text-sm text-blue-100/90">
              <strong>Morning Briefing with Alex</strong> - Start your day by chatting with your AI research assistant about the latest in tech. Alex has analyzed your saved content and is ready to discuss, connect ideas, and help you build.
              <div className="mt-2 text-xs text-blue-100/70">
                Demo mode: Uses sample tech news. Real version connects to your Instagram, LinkedIn, Telegram & newsletter saves + can integrate with email/calendar.
              </div>
            </div>
          </div>
        </div>
      )}

      {brief && brief.items.length > 0 && (
        <div className="mb-10">
          <AICharacter items={brief.items} userName={brief.display_name} />
        </div>
      )}

      {!isDemoMode && (
        <div className="mb-10">
          <CaptureBox onCaptured={load} />
        </div>
      )}

      {error && (
        <div className="mb-8 rounded-2xl border border-red-400/20 bg-red-400/[0.06] p-4 text-sm text-red-200/80">
          Couldn't load today's brief: {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-white/40">Loading...</p>
      ) : (
        <>
          {brief && brief.items.length > 0 && (
            <div className="mb-10">
              <KnowledgeGraph items={brief.items} />
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white/80 mb-4">📚 All Items</h2>
            <div className="grid gap-4">
              {brief?.items.map((item) => (
                <ItemCard key={`${item.rank_position}-${item.source_url ?? item.one_line_insight}`} item={item} />
              ))}
            </div>
          </div>

          {brief && brief.skipped_count > 0 && (
            <p className="mt-8 text-center text-xs text-white/30">
              Skipped {brief.skipped_count} noise item{brief.skipped_count === 1 ? "" : "s"} today.
            </p>
          )}

          {brief && brief.items.length === 0 && (
            <p className="mt-8 text-center text-sm text-white/40">
              Nothing ranked yet for today. Capture something above, then it'll show up here.
            </p>
          )}
        </>
      )}
    </div>
  );
}
