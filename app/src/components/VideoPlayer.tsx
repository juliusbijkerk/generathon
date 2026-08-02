export function VideoPlayer({ videoUrl, itemCount }: { videoUrl: string | null; itemCount: number }) {
  if (!videoUrl) {
    return (
      <div className="mx-auto flex aspect-[9/16] w-full max-w-xs items-center justify-center rounded-[28px] border border-dashed border-white/[0.12] bg-white/[0.02]">
        <p className="px-8 text-center text-sm leading-relaxed text-white/35">
          No brief video yet.
          <br />
          Run <code className="text-white/50">npm run video:dry-run</code> or wire the live
          pipeline (see docs/SETUP.md).
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xs">
      <video
        className="aspect-[9/16] w-full rounded-[28px] border border-white/[0.08] bg-black shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]"
        src={videoUrl}
        controls
        playsInline
        poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1080 1920'%3E%3Crect fill='%23111' width='1080' height='1920'/%3E%3Ctext x='50%25' y='50%25' font-family='system-ui' font-size='48' fill='%23666' text-anchor='middle' dominant-baseline='middle'%3E🎥 Your Daily Brief%3C/text%3E%3C/svg%3E"
      />
      <p className="mt-3 text-center text-xs text-white/35">
        {itemCount} items narrated · Tap to play
      </p>
    </div>
  );
}
