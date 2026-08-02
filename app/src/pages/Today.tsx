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
      <header className="mb-10 flex items-baseline justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">
            {brief?.date ?? "today"}
            {isDemoMode && <span className="ml-2 text-amber-300/80">· demo mode</span>}
          </p>
          <h1 className="font-display mt-1 text-4xl font-medium tracking-tight text-white sm:text-[42px]">
            {brief?.display_name ?? "Your"}'s brief
          </h1>
        </div>
        <Link to="/profile" className="text-sm text-white/40 transition hover:text-white">
          Profile →
        </Link>
      </header>

      {isDemoMode && (
        <div className="mb-8 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4 text-sm text-emerald-100/80">
          👤 <strong>Meet Alex - Your Digital Content Co-Founder</strong> - Talk to a real AI character about your saves! Ask questions, explore ideas, get help building. Real version connects to your Instagram, LinkedIn, Telegram & newsletter saves.
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
