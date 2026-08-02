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
    <div className="mx-auto max-w-2xl px-4 py-10">
      <header className="mb-8 flex items-baseline justify-between">
        <h1 className="text-2xl font-bold text-white">{profile.display_name}'s content profile</h1>
        <Link to="/" className="text-sm text-gray-400 hover:text-white">
          ← Today
        </Link>
      </header>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Topics</h2>
        <div className="space-y-2">
          {profile.topics.map((t) => (
            <div key={t.name} className="flex items-center gap-3">
              <span className="w-36 shrink-0 text-sm text-gray-300">{t.name}</span>
              <div className="h-2 flex-1 rounded-full bg-white/5">
                <div
                  className="h-2 rounded-full bg-blue-500"
                  style={{ width: `${(t.weight / maxWeight) * 100}%` }}
                />
              </div>
              <span className="w-10 text-right text-xs text-gray-500">{t.weight.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Active projects</h2>
        {profile.active_projects.map((p) => (
          <div key={p.name} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="font-semibold text-white">{p.name}</p>
            <p className="mt-1 text-sm text-gray-400">{p.reason}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {p.keywords.map((k) => (
                <span key={k} className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] text-gray-500">
                  {k}
                </span>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Consumption caps</h2>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>Daily items: {profile.consumption.daily_item_cap}</li>
          <li>Items narrated in video: {profile.consumption.video_item_cap}</li>
          <li>Discovery slots: {profile.consumption.discovery_slots}</li>
        </ul>
      </section>
    </div>
  );
}
