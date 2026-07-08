"use client";

import { useEffect, useRef, useState } from "react";

interface RewardVideoLocalProps {
  src: string;
}

/** Local video reward clip (muted, looping), sized to match the other corner cards. */
export function RewardVideoLocal({ src }: RewardVideoLocalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, [src]);

  if (failed) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-lg border-2 border-white/80 bg-black/80 text-center text-sm text-white/70 shadow-2xl">
        Video unavailable
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      src={src}
      autoPlay
      loop
      muted
      playsInline
      onError={() => setFailed(true)}
      className="aspect-video w-full rounded-lg border-2 border-white/80 object-cover shadow-2xl"
    />
  );
}
