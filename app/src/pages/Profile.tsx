import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProfile } from "../lib/api";
import type { ProfileView } from "../lib/types";

export function Profile() {
  const [profile, setProfile] = useState<ProfileView | null>(null);

  useEffect(() => {
    fetchProfile().then(setProfile);
  }, []);

  if (!profile) return null;

  const maxWeight = Math.max(...profile.topics.map((t) => t.weight), 1);

  return (
    <div className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
      <header className="mb-10 flex items-baseline justify-between">
        <h1 className="font-display text-3xl font-medium tracking-tight text-white">
          {profile.display_name}'s content profile
        </h1>
        <Link to="/" className="text-sm text-white/40 transition hover:text-white">
          ← Today
        </Link>
      </header>

      <section className="mb-10">
        <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">Topics</h2>
        <div className="space-y-3">
          {profile.topics.map((t) => (
            <div key={t.name} className="flex items-center gap-3">
              <span className="w-36 shrink-0 text-sm text-white/70">{t.name}</span>
              <div className="h-1.5 flex-1 rounded-full bg-white/[0.06]">
                <div
                  className="h-1.5 rounded-full bg-gradient-to-r from-blue-400/70 to-violet-400/70"
                  style={{ width: `${(t.weight / maxWeight) * 100}%` }}
                />
              </div>
              <span className="w-10 text-right text-xs text-white/35">{t.weight.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">Active projects</h2>
        <div className="space-y-3">
          {profile.active_projects.map((p) => (
            <div key={p.name} className="rounded-[18px] border border-white/[0.08] bg-white/[0.025] p-5">
              <p className="font-display text-lg text-white">{p.name}</p>
              <p className="mt-1 text-sm text-white/45">{p.reason}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.keywords.map((k) => (
                  <span key={k} className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[11px] text-white/45">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">Consumption caps</h2>
        <ul className="space-y-1.5 text-sm text-white/50">
          <li>Daily items: {profile.consumption.daily_item_cap}</li>
          <li>Items narrated in video: {profile.consumption.video_item_cap}</li>
          <li>Discovery slots: {profile.consumption.discovery_slots}</li>
        </ul>
      </section>
    </div>
  );
}
