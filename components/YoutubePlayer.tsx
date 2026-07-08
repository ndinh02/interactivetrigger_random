"use client";

import { useEffect, useRef, useState } from "react";
import { MUSIC_INTRO_SKIP_SECONDS } from "@/lib/config";
import { extractVideoId, loadYouTubeApi, type YTPlayerInstance } from "@/lib/youtube";

interface YoutubePlayerProps {
  /** Mount + attempt playback while true; unmounts and stops when false. */
  active: boolean;
  youtubeUrl: string;
}

/** Small embedded YouTube player that autoplays + loops a single video, with a manual fallback. */
export function YoutubePlayer({ active, youtubeUrl }: YoutubePlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayerInstance | null>(null);
  const [showPlayButton, setShowPlayButton] = useState(false);
  const videoId = extractVideoId(youtubeUrl);

  useEffect(() => {
    if (!active || !videoId || !containerRef.current) return;
    let cancelled = false;
    let autoplayCheckTimer: ReturnType<typeof setTimeout> | null = null;

    loadYouTubeApi().then((YT) => {
      if (cancelled || !containerRef.current) return;

      playerRef.current = new YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          autoplay: 1,
          loop: 1,
          playlist: videoId, // required by YouTube for looping a single video
          controls: 1,
          rel: 0,
          modestbranding: 1,
          start: MUSIC_INTRO_SKIP_SECONDS,
        },
        events: {
          onReady: (event) => {
            event.target.playVideo();
            autoplayCheckTimer = setTimeout(() => {
              if (!cancelled) setShowPlayButton(true);
            }, 1200);
          },
          onStateChange: (event) => {
            // loop:1 + playlist replays from 0:00, so re-skip the intro each time it loops.
            if (event.data === YT.PlayerState.ENDED) {
              event.target.seekTo(MUSIC_INTRO_SKIP_SECONDS, true);
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
  }, [active, videoId]);

  if (!active || !videoId) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 overflow-hidden rounded-lg border border-white/15 shadow-2xl">
      <div ref={containerRef} className="h-[135px] w-[240px]" />
      {showPlayButton && (
        <button
          onClick={() => {
            playerRef.current?.playVideo();
            setShowPlayButton(false);
          }}
          className="absolute inset-0 flex items-center justify-center bg-black/70 text-sm font-medium text-white hover:bg-black/60"
        >
          ▶ Play music
        </button>
      )}
    </div>
  );
}
