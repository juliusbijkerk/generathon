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
      />
      <p className="mt-3 text-center text-xs text-white/35">{itemCount} items in this brief</p>
    </div>
  );
}
