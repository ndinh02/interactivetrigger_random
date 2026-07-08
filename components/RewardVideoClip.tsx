"use client";

import { useEffect, useRef, useState } from "react";
import { loadYouTubeApi, type YTPlayerInstance } from "@/lib/youtube";

interface RewardVideoClipProps {
  videoId: string;
  /** Clip bounds, in seconds, replayed on loop while this component is mounted. */
  startSeconds: number;
  endSeconds: number;
}

/** Reward video clip, sized to sit as a corner card inside the camera zone. Loops [start, end). */
export function RewardVideoClip({ videoId, startSeconds, endSeconds }: RewardVideoClipProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayerInstance | null>(null);
  const [showPlayButton, setShowPlayButton] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;
    let autoplayCheckTimer: ReturnType<typeof setTimeout> | null = null;

    loadYouTubeApi().then((YT) => {
      if (cancelled || !containerRef.current) return;

      playerRef.current = new YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          autoplay: 1,
          start: startSeconds,
          end: endSeconds,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
        },
        events: {
          onReady: (event) => {
            event.target.playVideo();
            autoplayCheckTimer = setTimeout(() => {
              if (!cancelled) setShowPlayButton(true);
            }, 1200);
          },
          onStateChange: (event) => {
            // The `end` param stops playback at endSeconds (fires ENDED); loop back to start.
            if (event.data === YT.PlayerState.ENDED) {
              event.target.seekTo(startSeconds, true);
              event.target.playVideo();
            }
            if (event.data === YT.PlayerState.PLAYING) {
              if (autoplayCheckTimer) clearTimeout(autoplayCheckTimer);
              setShowPlayButton(false);
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      if (autoplayCheckTimer) clearTimeout(autoplayCheckTimer);
      playerRef.current?.destroy();
      playerRef.current = null;
      setShowPlayButton(false);
    };
  }, [videoId, startSeconds, endSeconds]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg border-2 border-white/80 shadow-2xl">
      {/* pointer-events-none hides that this is an embed: no click-to-pause, no YouTube UI. */}
      <div ref={containerRef} className="pointer-events-none h-full w-full" />
      {showPlayButton && (
        <button
          onClick={() => {
            playerRef.current?.playVideo();
            setShowPlayButton(false);
          }}
          className="absolute inset-0 flex items-center justify-center bg-black/70 text-sm font-medium text-white hover:bg-black/60"
        >
          ▶ Play
        </button>
      )}
    </div>
  );
}
