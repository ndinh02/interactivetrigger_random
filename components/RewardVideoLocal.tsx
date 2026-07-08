"use client";

import { useEffect, useRef } from "react";

interface RewardVideoLocalProps {
  src: string;
}

/** Local video reward clip (muted, looping), sized to match the other corner cards. */
export function RewardVideoLocal({ src }: RewardVideoLocalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, [src]);

  return (
    <video
      ref={videoRef}
      src={src}
      autoPlay
      loop
      muted
      playsInline
      className="aspect-video w-full rounded-lg border-2 border-white/80 object-cover shadow-2xl"
    />
  );
}
