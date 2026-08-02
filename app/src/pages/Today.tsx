import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchTodayBrief, subscribeToSaves } from "../lib/api";
import { isDemoMode } from "../lib/supabaseClient";
import type { BriefView } from "../lib/types";
import { VideoPlayer } from "../components/VideoPlayer";
import { ItemCard } from "../components/ItemCard";
import { CaptureBox } from "../components/CaptureBox";

export function Today() {
  const [brief, setBrief] = useState<BriefView | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await fetchTodayBrief();
    setBrief(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const unsubscribe = subscribeToSaves(() => load());
    return unsubscribe;
  }, [load]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8 flex items-baseline justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-500">
            {brief?.date ?? "today"} {isDemoMode && <span className="text-amber-500">- demo mode</span>}
          </p>
          <h1 className="text-2xl font-bold text-white">{brief?.display_name ?? "Your"}'s brief</h1>
        </div>
        <Link to="/profile" className="text-sm text-gray-400 hover:text-white">
          Profile →
        </Link>
      </header>

      {isDemoMode && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
          Running on fixture data. Set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in app/.env to
          go live (see docs/SETUP.md).
        </div>
      )}

      <div className="mb-8">
        <VideoPlayer videoUrl={brief?.video_url ?? null} itemCount={brief?.items.length ?? 0} />
      </div>

      <div className="mb-8">
        <CaptureBox onCaptured={load} />
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {brief?.items.map((item) => (
              <ItemCard key={`${item.rank_position}-${item.source_url ?? item.one_line_insight}`} item={item} />
            ))}
          </div>

          {brief && brief.skipped_count > 0 && (
            <p className="mt-6 text-center text-xs text-gray-600">
              Skipped {brief.skipped_count} noise item{brief.skipped_count === 1 ? "" : "s"} today.
            </p>
          )}

          {brief && brief.items.length === 0 && (
            <p className="mt-6 text-center text-sm text-gray-500">
              Nothing ranked yet for today. Capture something above, then it'll show up here.
            </p>
          )}
        </>
      )}
    </div>
  );
}
