"use client";

import { useEffect, useRef, useState } from "react";

interface AudioPlayerProps {
  /** Play (looping) while true; paused and reset when false. */
  active: boolean;
  src: string;
}

/** Background reward music. A plain looping <audio> element with a manual fallback for autoplay-blocked browsers. */
export function AudioPlayer({ active, src }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (active) {
      audio.currentTime = 0;
      audio
        .play()
        .then(() => setBlocked(false))
        .catch(() => setBlocked(true));
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [active, src]);

  if (!active) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <audio ref={audioRef} src={src} loop />
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
