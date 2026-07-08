"use client";

import { useEffect, useRef, useState } from "react";

interface AudioPlayerProps {
  /** Play (looping) while true; paused and reset when false. */
  active: boolean;
  src: string;
  /** Seconds to skip at the start of the track, and on every loop replay. */
  startSeconds?: number;
  /** If set, playback loops back to startSeconds on reaching this time instead of playing to the end. */
  endSeconds?: number;
}

/** Background reward music. A plain looping <audio> element with a manual fallback for autoplay-blocked browsers. */
export function AudioPlayer({ active, src, startSeconds = 0, endSeconds }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (active) {
      audio.currentTime = startSeconds;
      audio
        .play()
        .then(() => setBlocked(false))
        .catch(() => setBlocked(true));
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [active, src, startSeconds]);

  // Looping is handled manually (rather than the `loop` attribute) so each replay can
  // re-skip the start offset instead of restarting from 0:00. `timeupdate` covers looping
  // a clipped range (endSeconds); `ended` covers the fallback where the whole file plays out.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !active) return;

    const restart = () => {
      audio.currentTime = startSeconds;
      audio.play().catch(() => setBlocked(true));
    };
    const handleTimeUpdate = () => {
      if (endSeconds !== undefined && audio.currentTime >= endSeconds) restart();
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", restart);
    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", restart);
    };
  }, [active, startSeconds, endSeconds]);

  if (!active) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <audio ref={audioRef} src={src} />
      {blocked && (
        <button
          onClick={() => {
            audioRef.current?.play();
            setBlocked(false);
          }}
          className="rounded-full border border-white/15 bg-black/80 px-4 py-2 text-sm font-medium text-white shadow-2xl hover:bg-black/70"
        >
          ▶ Play music
        </button>
      )}
    </div>
  );
}
