export function VideoPlayer({ videoUrl, itemCount }: { videoUrl: string | null; itemCount: number }) {
  // In demo mode, don't show the video player - it takes up too much space
  // and distracts from the actual content cards below
  if (!videoUrl) {
    return null;
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
