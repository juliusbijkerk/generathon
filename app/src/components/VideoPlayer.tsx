export function VideoPlayer({ videoUrl, itemCount }: { videoUrl: string | null; itemCount: number }) {
  if (!videoUrl) {
    return (
      <div className="flex aspect-[9/16] w-full max-w-xs mx-auto items-center justify-center rounded-3xl border border-dashed border-white/15 bg-white/[0.02] text-center">
        <p className="px-6 text-sm text-gray-500">
          No brief video yet.
          <br />
          Run <code className="text-gray-400">npm run video:dry-run</code> or wire the live
          pipeline (see docs/SETUP.md).
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xs">
      <video
        className="aspect-[9/16] w-full rounded-3xl border border-white/10 bg-black"
        src={videoUrl}
        controls
        playsInline
      />
      <p className="mt-2 text-center text-xs text-gray-500">{itemCount} items in this brief</p>
    </div>
  );
}
